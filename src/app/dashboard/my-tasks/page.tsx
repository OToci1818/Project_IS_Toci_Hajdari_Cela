'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, Badge, TaskDetailModal } from '@/components'

interface Task {
  id: string
  title: string
  description?: string
  status: 'to_do' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  project?: {
    id: string
    title: string
  }
  assignee?: {
    id: string
    fullName: string
  }
}

const statusOptions = ['all', 'to_do', 'in_progress', 'done'] as const
const statusLabels: Record<string, string> = {
  all: 'All',
  to_do: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUserId(data.user.id)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchCurrentUser()
  }, [fetchTasks, fetchCurrentUser])

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdatingTaskId(taskId)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, status: newStatus as Task['status'] } : task
          )
        )
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    } finally {
      setUpdatingTaskId(null)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return true
    return task.status === filter
  })

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="danger">High</Badge>
      case 'medium':
        return <Badge variant="warning">Medium</Badge>
      case 'low':
        return <Badge variant="default">Low</Badge>
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'to_do':
        return <Badge variant="outline">To Do</Badge>
      case 'in_progress':
        return <Badge variant="info">In Progress</Badge>
      case 'done':
        return <Badge variant="success">Done</Badge>
      default:
        return null
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const isOverdue = date < now && dateString
    return {
      formatted: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      isOverdue,
    }
  }

  const taskCounts = {
    all: tasks.length,
    to_do: tasks.filter((t) => t.status === 'to_do').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-card-foreground">My Tasks</h1>
        <p className="text-muted-foreground mt-1">All tasks assigned to you across all projects</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`p-4 rounded-[0.625rem] border transition-all text-left ${
              filter === status
                ? 'bg-primary/10 border-primary'
                : 'bg-card border-border hover:border-primary/30'
            }`}
          >
            <p className="text-2xl font-bold text-card-foreground">
              {loading ? '...' : taskCounts[status]}
            </p>
            <p className="text-sm text-muted-foreground">{statusLabels[status]}</p>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Tasks List */}
      {!loading && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-card-foreground">
              {statusLabels[filter]} Tasks ({filteredTasks.length})
            </h2>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-12 h-12 text-muted-foreground mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">
                {filter === 'all' ? 'No tasks assigned' : `No ${statusLabels[filter].toLowerCase()} tasks`}
              </h3>
              <p className="text-muted-foreground">
                {filter === 'all'
                  ? 'Tasks assigned to you will appear here'
                  : 'Try selecting a different filter'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const dateInfo = formatDate(task.dueDate)
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-[0.625rem] border border-border hover:border-primary/30 transition-all ${
                      task.status === 'done' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <button
                            onClick={() => setSelectedTask(task)}
                            className={`font-medium text-card-foreground hover:text-primary transition-colors text-left ${
                              task.status === 'done' ? 'line-through' : ''
                            }`}
                          >
                            {task.title}
                          </button>
                          {getPriorityBadge(task.priority)}
                          {getStatusBadge(task.status)}
                        </div>

                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {task.project && (
                            <Link
                              href={`/dashboard/projects/${task.project.id}`}
                              className="flex items-center gap-1 hover:text-primary transition-colors"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                />
                              </svg>
                              {task.project.title}
                            </Link>
                          )}
                          {dateInfo && (
                            <span
                              className={`flex items-center gap-1 ${
                                dateInfo.isOverdue && task.status !== 'done'
                                  ? 'text-destructive'
                                  : ''
                              }`}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              {dateInfo.formatted}
                              {dateInfo.isOverdue && task.status !== 'done' && ' (Overdue)'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Buttons */}
                      <div className="flex items-center gap-1">
                        {['to_do', 'in_progress', 'done'].map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(task.id, status)}
                            disabled={updatingTaskId === task.id || task.status === status}
                            className={`px-3 py-1.5 rounded-[0.5rem] text-xs font-medium transition-all ${
                              task.status === status
                                ? status === 'done'
                                  ? 'bg-success text-success-foreground'
                                  : status === 'in_progress'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                            } ${updatingTaskId === task.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {status === 'to_do' && 'To Do'}
                            {status === 'in_progress' && 'Working'}
                            {status === 'done' && 'Done'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        currentUserId={currentUserId}
        onStatusChange={(taskId, newStatus) => {
          setTasks((prev) =>
            prev.map((task) =>
              task.id === taskId ? { ...task, status: newStatus as Task['status'] } : task
            )
          )
          setSelectedTask((prev) =>
            prev ? { ...prev, status: newStatus as Task['status'] } : null
          )
        }}
      />
    </div>
  )
}
