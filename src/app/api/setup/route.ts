import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authService } from '@/services'

export async function POST() {
  try {
    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@fti.edu.al' }
    })

    if (existingUser) {
      // Get demo project
      const project = await prisma.project.findFirst({
        where: { teamLeaderId: existingUser.id }
      })

      return NextResponse.json({
        message: 'Demo data already exists',
        user: {
          email: existingUser.email,
          fullName: existingUser.fullName,
        },
        projectId: project?.id,
        password: 'demo123'
      })
    }

    // Create demo user with hashed password
    const passwordHash = authService.hashPassword('demo123')

    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@fti.edu.al',
        fullName: 'Demo User',
        passwordHash,
        role: 'team_leader',
      }
    })

    // Create a demo project
    const demoProject = await prisma.project.create({
      data: {
        title: 'Web Application Development',
        description: 'Building a university project management system using Next.js and PostgreSQL',
        courseCode: 'CS401',
        projectType: 'group',
        teamLeaderId: demoUser.id,
        status: 'active',
        deadlineDate: new Date('2024-12-31'),
      }
    })

    // Create some demo tasks
    const tasks = [
      {
        title: 'Design database schema',
        description: 'Create ERD and define all tables for the project',
        priority: 'high' as const,
        status: 'done' as const,
        ordinal: 0,
      },
      {
        title: 'Implement user authentication',
        description: 'Session-based auth with @fti.edu.al email validation',
        priority: 'high' as const,
        status: 'done' as const,
        ordinal: 1,
      },
      {
        title: 'Create REST API endpoints',
        description: 'CRUD operations for projects and tasks',
        priority: 'medium' as const,
        status: 'in_progress' as const,
        ordinal: 2,
      },
      {
        title: 'Build task management UI',
        description: 'Kanban board with drag-and-drop functionality',
        priority: 'medium' as const,
        status: 'in_progress' as const,
        ordinal: 3,
      },
      {
        title: 'Write unit tests',
        description: 'Test coverage for auth and task modules',
        priority: 'low' as const,
        status: 'to_do' as const,
        ordinal: 4,
      },
      {
        title: 'Deploy to production',
        description: 'Setup CI/CD and deploy to cloud',
        priority: 'medium' as const,
        status: 'to_do' as const,
        ordinal: 5,
      },
    ]

    for (const task of tasks) {
      await prisma.task.create({
        data: {
          projectId: demoProject.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          ordinal: task.ordinal,
          assigneeId: demoUser.id,
          createdById: demoUser.id,
          dueDate: new Date(Date.now() + (task.ordinal + 1) * 7 * 24 * 60 * 60 * 1000),
        }
      })
    }

    return NextResponse.json({
      message: 'Demo data created successfully',
      user: {
        email: demoUser.email,
        fullName: demoUser.fullName,
      },
      projectId: demoProject.id,
      password: 'demo123'
    }, { status: 201 })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup demo data' },
      { status: 500 }
    )
  }
}
