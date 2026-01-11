import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/search - Search tasks across all projects the user has access to
 */
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify JWT token
    let decoded: { userId: string; email: string }
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      ) as { userId: string; email: string }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    // Get all projects the user is a member of
    const userProjects = await prisma.projectUser.findMany({
      where: {
        userId: decoded.userId,
        inviteStatus: 'accepted',
      },
      select: {
        projectId: true,
      },
    })

    const projectIds = userProjects.map((p) => p.projectId)

    // If user has no projects, return empty results
    if (projectIds.length === 0) {
      return NextResponse.json({ results: { tasks: [], projects: [] } })
    }

    // Search tasks in user's projects
    const tasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: { not: 'archived' },
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        status: true,
        dueDate: true,
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 10,
    })

    // Also search projects by title
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        status: { not: 'archived' },
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { courseCode: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        courseCode: true,
        status: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    })

    return NextResponse.json({
      results: {
        tasks,
        projects,
      },
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    )
  }
}
