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

// POST /api/courses/[id]/enroll - Enroll in a course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only students can enroll
    if (user.role !== 'student' && user.role !== 'team_leader') {
      return NextResponse.json(
        { error: 'Only students can enroll in courses' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if course exists and is active
    const course = await courseService.getCourseById(id)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (!course.isActive) {
      return NextResponse.json(
        { error: 'This course is no longer available for enrollment' },
        { status: 400 }
      )
    }

    // Check if already enrolled
    const isEnrolled = await courseService.isStudentEnrolled(id, user.id)
    if (isEnrolled) {
      return NextResponse.json(
        { error: 'You are already enrolled in this course' },
        { status: 400 }
      )
    }

    const enrollment = await courseService.enrollStudent(id, user.id)

    return NextResponse.json(
      { message: 'Successfully enrolled in course', enrollment },
      { status: 201 }
    )
  } catch (error) {
    console.error('Enroll in course error:', error)
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    )
  }
}

// DELETE /api/courses/[id]/enroll - Unenroll from a course
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

    // Check if enrolled
    const isEnrolled = await courseService.isStudentEnrolled(id, user.id)
    if (!isEnrolled) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course' },
        { status: 400 }
      )
    }

    await courseService.unenrollStudent(id, user.id)

    return NextResponse.json({ message: 'Successfully unenrolled from course' })
  } catch (error) {
    console.error('Unenroll from course error:', error)
    return NextResponse.json(
      { error: 'Failed to unenroll from course' },
      { status: 500 }
    )
  }
}
