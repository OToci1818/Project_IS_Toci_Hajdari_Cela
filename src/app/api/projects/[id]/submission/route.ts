import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/services/NotificationService'
import jwt from 'jsonwebtoken'

async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    ) as { userId: string; email: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })
    return user ?? null
  } catch {
    return null
  }
}

// GET /api/projects/[id]/submission - Get project submission
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    const submission = await prisma.finalSubmission.findUnique({
      where: { projectId: id },
      include: {
        files: true,
        submittedBy: {
          select: { id: true, fullName: true, email: true },
        },
        reviewedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
    })

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Get submission error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/submission - Create or update submission
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { description } = body

    // Check project and user access
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        course: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Only team leader can create/update submission
    if (project.teamLeaderId !== user.id) {
      return NextResponse.json(
        { error: 'Only the team leader can manage submissions' },
        { status: 403 }
      )
    }

    // Check if submission exists
    const existingSubmission = await prisma.finalSubmission.findUnique({
      where: { projectId: id },
    })

    // Can't update if already approved
    if (existingSubmission?.status === 'approved') {
      return NextResponse.json(
        { error: 'Cannot modify an approved submission' },
        { status: 400 }
      )
    }

    const submission = await prisma.finalSubmission.upsert({
      where: { projectId: id },
      update: {
        description,
        // If it was needs_revision, reset to draft
        status: existingSubmission?.status === 'needs_revision' ? 'draft' : existingSubmission?.status,
      },
      create: {
        projectId: id,
        description,
        status: 'draft',
      },
      include: {
        files: true,
      },
    })

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Create submission error:', error)
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id]/submission - Submit for review or review submission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, reviewComment } = body

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        course: true,
        members: {
          where: { inviteStatus: 'accepted' },
          select: { userId: true },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const existingSubmission = await prisma.finalSubmission.findUnique({
      where: { projectId: id },
    })

    if (!existingSubmission) {
      return NextResponse.json({ error: 'No submission found' }, { status: 404 })
    }

    if (action === 'submit') {
      // Team leader submits for review
      if (project.teamLeaderId !== user.id) {
        return NextResponse.json(
          { error: 'Only the team leader can submit' },
          { status: 403 }
        )
      }

      if (existingSubmission.status !== 'draft' && existingSubmission.status !== 'needs_revision') {
        return NextResponse.json(
          { error: 'Can only submit draft or revised submissions' },
          { status: 400 }
        )
      }

      const submission = await prisma.finalSubmission.update({
        where: { projectId: id },
        data: {
          status: 'submitted',
          submittedAt: new Date(),
          submittedById: user.id,
        },
        include: {
          files: true,
        },
      })

      // Notify professor
      if (project.course?.professorId) {
        await notificationService.notifySubmissionReceived(
          project.course.professorId,
          { id: user.id, fullName: user.fullName },
          { id: project.id, title: project.title },
          { id: project.course.id, title: project.course.title }
        )
      }

      return NextResponse.json({ submission })
    }

    if (action === 'approve' || action === 'request_revision') {
      // Professor reviews submission
      if (user.role !== 'professor' && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Only professors can review submissions' },
          { status: 403 }
        )
      }

      // Check professor owns the course
      if (project.course?.professorId !== user.id && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'You can only review submissions in your courses' },
          { status: 403 }
        )
      }

      if (existingSubmission.status !== 'submitted') {
        return NextResponse.json(
          { error: 'Can only review submitted submissions' },
          { status: 400 }
        )
      }

      const newStatus = action === 'approve' ? 'approved' : 'needs_revision'

      const submission = await prisma.finalSubmission.update({
        where: { projectId: id },
        data: {
          status: newStatus,
          reviewedAt: new Date(),
          reviewedById: user.id,
          reviewComment: reviewComment || null,
        },
        include: {
          files: true,
        },
      })

      // Notify project members
      const memberIds = project.members.map((m) => m.userId)
      if (memberIds.length > 0) {
        await notificationService.notifySubmissionReviewed(
          memberIds,
          { id: user.id, fullName: user.fullName },
          { id: project.id, title: project.title },
          newStatus === 'approved' ? 'approved' : 'needs_revision',
          reviewComment
        )
      }

      return NextResponse.json({ submission })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Update submission error:', error)
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    )
  }
}
