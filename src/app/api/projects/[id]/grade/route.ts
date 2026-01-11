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

// GET /api/projects/[id]/grade - Get project grade
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

    const grade = await prisma.projectGrade.findUnique({
      where: { projectId: id },
      include: {
        professor: {
          select: { id: true, fullName: true, email: true },
        },
      },
    })

    return NextResponse.json({ grade })
  } catch (error) {
    console.error('Get grade error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grade' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/grade - Add or update grade
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.role !== 'professor' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only professors can grade projects' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { gradeType, numericGrade, letterGrade, feedback } = body

    // Validate grade
    if (!gradeType || (gradeType !== 'numeric' && gradeType !== 'letter')) {
      return NextResponse.json({ error: 'Invalid grade type' }, { status: 400 })
    }

    if (gradeType === 'numeric') {
      if (numericGrade === undefined || numericGrade < 0 || numericGrade > 100) {
        return NextResponse.json({ error: 'Numeric grade must be between 0 and 100' }, { status: 400 })
      }
    }

    if (gradeType === 'letter') {
      const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']
      if (!letterGrade || !validGrades.includes(letterGrade)) {
        return NextResponse.json({ error: 'Invalid letter grade' }, { status: 400 })
      }
    }

    // Get project and verify professor owns the course
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

    if (!project.courseId) {
      return NextResponse.json({ error: 'Project is not linked to a course' }, { status: 400 })
    }

    if (project.course?.professorId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'You can only grade projects in your courses' }, { status: 403 })
    }

    // Upsert grade
    const grade = await prisma.projectGrade.upsert({
      where: { projectId: id },
      update: {
        gradeType,
        numericGrade: gradeType === 'numeric' ? numericGrade : null,
        letterGrade: gradeType === 'letter' ? letterGrade : null,
        feedback,
        professorId: user.id,
      },
      create: {
        projectId: id,
        professorId: user.id,
        gradeType,
        numericGrade: gradeType === 'numeric' ? numericGrade : null,
        letterGrade: gradeType === 'letter' ? letterGrade : null,
        feedback,
      },
      include: {
        professor: {
          select: { id: true, fullName: true, email: true },
        },
      },
    })

    // Send notification to project members
    const memberIds = project.members.map((m) => m.userId)
    if (memberIds.length > 0) {
      await notificationService.notifyProjectGraded(
        memberIds,
        { id: user.id, fullName: user.fullName },
        { id: project.id, title: project.title },
        gradeType === 'numeric' ? `${numericGrade}/100` : letterGrade
      )
    }

    return NextResponse.json({ grade })
  } catch (error) {
    console.error('Add grade error:', error)
    return NextResponse.json(
      { error: 'Failed to add grade' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/grade - Remove grade
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.role !== 'professor' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only professors can remove grades' }, { status: 403 })
    }

    const { id } = await params

    // Get project and verify professor owns the course
    const project = await prisma.project.findUnique({
      where: { id },
      include: { course: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.course?.professorId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'You can only remove grades from projects in your courses' }, { status: 403 })
    }

    await prisma.projectGrade.delete({
      where: { projectId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete grade error:', error)
    return NextResponse.json(
      { error: 'Failed to delete grade' },
      { status: 500 }
    )
  }
}
