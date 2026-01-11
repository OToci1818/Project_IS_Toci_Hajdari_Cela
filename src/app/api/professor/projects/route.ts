import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
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

// GET /api/professor/projects - Get all projects for professor's courses
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.role !== 'professor' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only professors can access this' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Get all courses owned by this professor
    const professorCourses = await prisma.course.findMany({
      where: { professorId: user.id },
      select: { id: true },
    })

    const courseIds = professorCourses.map((c) => c.id)

    // Verify professor owns the specific course if filtering
    if (courseId && !courseIds.includes(courseId)) {
      return NextResponse.json({ error: 'You do not own this course' }, { status: 403 })
    }

    // Build the where clause
    const whereClause: Prisma.ProjectWhereInput = {
      courseId: courseId ? courseId : { in: courseIds },
      deletedAt: null,
    }

    if (status && status !== 'all') {
      whereClause.status = status as Prisma.EnumProjectStatusFilter<'Project'>
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
      ]
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        teamLeader: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        course: {
          select: { id: true, title: true, code: true },
        },
        members: {
          where: { inviteStatus: 'accepted' },
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true },
            },
          },
        },
        tasks: {
          where: { isDeleted: false },
          select: { status: true },
        },
        grade: true,
        finalSubmission: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    const formattedProjects = projects.map((project) => {
      const total = project.tasks.length
      const done = project.tasks.filter((t) => t.status === 'done').length
      const progress = total > 0 ? Math.round((done / total) * 100) : 0

      return {
        id: project.id,
        title: project.title,
        description: project.description,
        courseId: project.courseId,
        course: project.course,
        projectType: project.projectType,
        status: project.status,
        deadlineDate: project.deadlineDate,
        teamLeaderId: project.teamLeaderId,
        teamLeader: project.teamLeader,
        memberCount: project.members.length,
        members: project.members.map((m) => m.user),
        taskStats: { total, done },
        progress,
        hasGrade: !!project.grade,
        grade: project.grade,
        submissionStatus: project.finalSubmission?.status ?? null,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }
    })

    // Also return the courses for filtering
    const courses = await prisma.course.findMany({
      where: { professorId: user.id },
      select: { id: true, title: true, code: true },
      orderBy: { title: 'asc' },
    })

    return NextResponse.json({ projects: formattedProjects, courses })
  } catch (error) {
    console.error('Get professor projects error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
