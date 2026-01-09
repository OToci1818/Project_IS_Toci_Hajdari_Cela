'use client'

import { useState, useEffect } from 'react'
import { Card, Badge, Button, Modal, Input } from '@/components'

interface Task {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'to_do' | 'in_progress' | 'done'
  assignee?: {
    id: string
    fullName: string
    email: string
  }
  dueDate?: string
  projectId: string
}

const columns = [
  { id: 'to_do', title: 'To Do', color: 'hsl(220, 10%, 45%)' },
  { id: 'in_progress', title: 'In Progress', color: 'hsl(220, 65%, 35%)' },
  { id: 'done', title: 'Done', color: 'hsl(152, 60%, 40%)' },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
  })

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks')
      const data = await response.json()

      if (response.ok) {
        setTasks(data.tasks || [])
        if (data.tasks?.length > 0) {
          setProjectId(data.tasks[0].projectId)
        }
      } else if (response.status === 401) {
        window.location.href = '/login'
      } else {
        setError(data.error || 'Failed to load tasks')
      }
    } catch {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

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

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (newStatus: string) => {
    if (!draggedTask) return

    const task = tasks.find((t) => t.id === draggedTask)
    if (!task || task.status === newStatus) {
      setDraggedTask(null)
      return
    }

    setTasks(tasks.map((t) =>
      t.id === draggedTask
        ? { ...t, status: newStatus as Task['status'] }
        : t
    ))
    setDraggedTask(null)

    try {
      const response = await fetch(`/api/tasks/${draggedTask}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        fetchTasks()
      }
    } catch {
      fetchTasks()
    }
  }

  const handleCreateTask = async () => {
    if (!newTask.title || !projectId) return

    setCreating(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          dueDate: newTask.dueDate || undefined,
        }),
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewTask({ title: '', description: '', priority: 'medium', dueDate: '' })
        fetchTasks()
      }
    } catch {
      // Handle error
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading tasks...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-card-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage your tasks with Kanban board</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} disabled={!projectId}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="empty-state">
          <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-semibold text-card-foreground mb-2">No tasks yet</h3>
          <p className="text-muted-foreground">Create your first task to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <div
              key={column.id}
              className="bg-muted/50 rounded-[0.625rem] p-4 min-h-[500px]"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-semibold text-card-foreground">{column.title}</h3>
                </div>
                <span className="text-sm text-muted-foreground bg-card px-2 py-1 rounded-full border border-border">
                  {getTasksByStatus(column.id).length}
                </span>
              </div>

              <div className="space-y-3">
                {getTasksByStatus(column.id).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    className={`bg-card rounded-[0.625rem] p-4 shadow-card border border-border cursor-grab active:cursor-grabbing hover:shadow-card-hover hover:border-primary/20 transition-all ${
                      draggedTask === task.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-card-foreground text-sm">{task.title}</h4>
                      {getPriorityBadge(task.priority)}
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      {task.assignee && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-[10px] font-medium text-primary">
                              {getInitials(task.assignee.fullName)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{task.assignee.fullName}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {getTasksByStatus(column.id).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-[0.625rem]">
                    No tasks here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} loading={creating}>
              Create Task
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Task Title"
            placeholder="Enter task title"
            value={newTask.title}
            onChange={(value) => setNewTask({ ...newTask, title: value })}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-card-foreground">Description</label>
            <textarea
              placeholder="Describe the task..."
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="px-4 py-2.5 rounded-[0.625rem] border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[80px] resize-none text-card-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-card-foreground">Priority</label>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="px-4 py-2.5 rounded-[0.625rem] border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-card-foreground"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <Input
            label="Due Date"
            type="date"
            value={newTask.dueDate}
            onChange={(value) => setNewTask({ ...newTask, dueDate: value })}
          />
        </div>
      </Modal>
    </div>
  )
}
