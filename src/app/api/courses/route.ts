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

// GET /api/courses - List courses
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'enrolled', 'available', 'teaching'
    const forProjects = searchParams.get('forProjects') === 'true'

    let courses

    if (user.role === 'professor') {
      // Professors see their own courses
      courses = await courseService.getCoursesByProfessor(user.id)
    } else if (type === 'available') {
      // Students browsing available courses
      courses = await courseService.getAvailableCourses(user.id)
    } else {
      // Students see enrolled courses by default
      courses = await courseService.getEnrolledCourses(user.id)
    }

    // Filter to only courses with projects enabled (for project creation dropdown)
    if (forProjects && courses) {
      courses = courses.filter((course: { projectsEnabled?: boolean }) => course.projectsEnabled !== false)
    }

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Get courses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only professors can create courses
    if (user.role !== 'professor' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only professors can create courses' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, code, description, semester, year } = body

    if (!title || !code || !semester || !year) {
      return NextResponse.json(
        { error: 'Title, code, semester, and year are required' },
        { status: 400 }
      )
    }

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (existingCourse) {
      return NextResponse.json(
        { error: 'A course with this code already exists' },
        { status: 400 }
      )
    }

    const course = await courseService.createCourse({
      title,
      code,
      description,
      semester,
      year: parseInt(year, 10),
      professorId: user.id,
    })

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    console.error('Create course error:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}
