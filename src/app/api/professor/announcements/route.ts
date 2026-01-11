import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
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

// GET - Fetch all announcements for professor's courses
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'professor') {
      return NextResponse.json({ error: 'Only professors can access this' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')

    // Get all courses taught by this professor
    const courses = await prisma.course.findMany({
      where: {
        professorId: user.id,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        code: true,
      },
      orderBy: { title: 'asc' },
    })

    // Build where clause for announcements
    const whereClause: {
      course: { professorId: string }
      courseId?: string
    } = {
      course: { professorId: user.id },
    }

    if (courseId && courseId !== 'all') {
      whereClause.courseId = courseId
    }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        professor: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ announcements, courses })
  } catch (error) {
    console.error('Failed to fetch announcements:', error)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

// POST - Create a new announcement
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'professor') {
      return NextResponse.json({ error: 'Only professors can create announcements' }, { status: 403 })
    }

    const body = await request.json()
    const { courseId, title, content, isPinned } = body

    if (!courseId || !title || !content) {
      return NextResponse.json({ error: 'Course, title, and content are required' }, { status: 400 })
    }

    // Verify the professor owns this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        professorId: user.id,
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found or not authorized' }, { status: 404 })
    }

    const announcement = await prisma.announcement.create({
      data: {
        courseId,
        professorId: user.id,
        title,
        content,
        isPinned: isPinned || false,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        professor: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    })

    // Create notifications for enrolled students
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId },
      select: { studentId: true },
    })

    if (enrollments.length > 0) {
      await prisma.notification.createMany({
        data: enrollments.map((enrollment) => ({
          userId: enrollment.studentId,
          type: 'announcement_posted',
          title: `New Announcement: ${title}`,
          message: `${user.fullName} posted a new announcement in ${course.code}`,
          actorId: user.id,
          metadata: { courseId, announcementId: announcement.id },
        })),
      })
    }

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (error) {
    console.error('Failed to create announcement:', error)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}

// PUT - Update an announcement
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'professor') {
      return NextResponse.json({ error: 'Only professors can update announcements' }, { status: 403 })
    }

    const body = await request.json()
    const { id, title, content, isPinned } = body

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 })
    }

    // Verify the professor owns this announcement
    const existing = await prisma.announcement.findFirst({
      where: {
        id,
        professorId: user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found or not authorized' }, { status: 404 })
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(typeof isPinned === 'boolean' && { isPinned }),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
        professor: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    })

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('Failed to update announcement:', error)
    return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
  }
}

// DELETE - Delete an announcement
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'professor') {
      return NextResponse.json({ error: 'Only professors can delete announcements' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 })
    }

    // Verify the professor owns this announcement
    const existing = await prisma.announcement.findFirst({
      where: {
        id,
        professorId: user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found or not authorized' }, { status: 404 })
    }

    await prisma.announcement.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete announcement:', error)
    return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
  }
}
