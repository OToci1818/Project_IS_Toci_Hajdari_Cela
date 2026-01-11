import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { courseService } from '@/services'
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

// GET /api/courses/[id] - Get course details
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

    const course = await courseService.getCourseById(id)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check access
    const canAccess = await courseService.canUserAccessCourse(id, user.id, user.role)
    if (!canAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this course' },
        { status: 403 }
      )
    }

    // Get additional data based on role
    const projects = await courseService.getCourseProjects(id)
    const isEnrolled = await courseService.isStudentEnrolled(id, user.id)

    return NextResponse.json({
      course,
      projects,
      isEnrolled,
      isOwner: course.professorId === user.id,
    })
  } catch (error) {
    console.error('Get course error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

// PATCH /api/courses/[id] - Update course
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
    const course = await courseService.getCourseById(id)

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Only course owner or admin can update
    if (course.professorId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only the course professor can update this course' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, code, description, semester, year, isActive, projectsEnabled } = body

    // Check for duplicate code if code is being changed
    if (code && code.toUpperCase() !== course.code) {
      const existingCourse = await prisma.course.findUnique({
        where: { code: code.toUpperCase() },
      })
      if (existingCourse) {
        return NextResponse.json(
          { error: 'A course with this code already exists' },
          { status: 400 }
        )
      }
    }

    const updatedCourse = await courseService.updateCourse(id, {
      title,
      code,
      description,
      semester,
      year: year ? parseInt(year, 10) : undefined,
      isActive,
      projectsEnabled,
    })

    return NextResponse.json({ course: updatedCourse })
  } catch (error) {
    console.error('Update course error:', error)
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    )
  }
}

// DELETE /api/courses/[id] - Delete (deactivate) course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const course = await courseService.getCourseById(id)

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Only course owner or admin can delete
    if (course.professorId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only the course professor can delete this course' },
        { status: 403 }
      )
    }

    await courseService.deleteCourse(id)

    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Delete course error:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}
