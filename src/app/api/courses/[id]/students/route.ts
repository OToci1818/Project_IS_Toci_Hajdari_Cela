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

// GET /api/courses/[id]/students - List enrolled students
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

    // Only professor can see enrolled students
    if (course.professorId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only the course professor can view enrolled students' },
        { status: 403 }
      )
    }

    const students = await courseService.getEnrolledStudents(id)

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Get enrolled students error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrolled students' },
      { status: 500 }
    )
  }
}
