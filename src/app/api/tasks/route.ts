import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authService, taskService } from '@/services'
import { TaskPriority } from '@/types'

async function getCurrentUser() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('sessionId')?.value
  if (!sessionId) return null

  const result = await authService.validateSession(sessionId)
  return result.valid ? result.user : null
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    let tasks
    if (projectId) {
      tasks = await taskService.getTasksByProject(projectId)
    } else {
      tasks = await taskService.getTasksByUser(user.id, true)
    }

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, title, description, priority, assigneeId, dueDate } = body

    if (!projectId || !title) {
      return NextResponse.json(
        { error: 'Project ID and title are required' },
        { status: 400 }
      )
    }

    const task = await taskService.createTask({
      projectId,
      title,
      description,
      priority: priority as TaskPriority,
      assigneeId: assigneeId || user.id,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdById: user.id,
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
