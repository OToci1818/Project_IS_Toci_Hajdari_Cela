import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authService, taskService } from '@/services'
import { TaskStatus, TaskPriority } from '@/types'

async function getCurrentUser() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('sessionId')?.value
  if (!sessionId) return null

  const result = await authService.validateSession(sessionId)
  return result.valid ? result.user : null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const task = await taskService.getTaskById(id)

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Get task error:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, assigneeId, title, description, priority, dueDate } = body

    let task

    // Handle status change
    if (status !== undefined) {
      task = await taskService.changeTaskStatus(id, status as TaskStatus, user.id)
    }
    // Handle assignment change
    else if (assigneeId !== undefined) {
      task = await taskService.assignTask(id, assigneeId, user.id)
    }
    // Handle general update
    else {
      task = await taskService.updateTask(
        id,
        {
          title,
          description,
          priority: priority as TaskPriority,
          dueDate: dueDate ? new Date(dueDate) : undefined,
        },
        user.id
      )
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const deleted = await taskService.deleteTask(id, user.id)

    if (!deleted) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Task deleted' })
  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
