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
  { id: 'to_do', title: 'To Do', color: '#64748B' },
  { id: 'in_progress', title: 'In Progress', color: '#1A73E8' },
  { id: 'done', title: 'Done', color: '#34A853' },
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

    // Optimistic update
    setTasks(tasks.map((t) =>
      t.id === draggedTask
        ? { ...t, status: newStatus as Task['status'] }
        : t
    ))
    setDraggedTask(null)

    // Update on server
    try {
      const response = await fetch(`/api/tasks/${draggedTask}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        // Revert on error
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
        <div className="text-[#64748B]">Loading tasks...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Tasks</h1>
          <p className="text-[#64748B] mt-1">Manage your tasks with Kanban board</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} disabled={!projectId}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-[#64748B] mb-4">No tasks yet. Create your first task!</p>
          <p className="text-sm text-[#94A3B8]">
            Click the &quot;Setup Demo Account&quot; button on the login page to create demo data.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((column) => (
            <div
              key={column.id}
              className="bg-gray-50 rounded-xl p-4 min-h-[500px]"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-semibold text-[#1E293B]">{column.title}</h3>
                </div>
                <span className="text-sm text-[#64748B] bg-white px-2 py-1 rounded-full">
                  {getTasksByStatus(column.id).length}
                </span>
              </div>

              <div className="space-y-3">
                {getTasksByStatus(column.id).map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    className={`bg-white rounded-lg p-4 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
                      draggedTask === task.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-[#1E293B] text-sm">{task.title}</h4>
                      {getPriorityBadge(task.priority)}
                    </div>

                    {task.description && (
                      <p className="text-xs text-[#64748B] mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      {task.assignee && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#1A73E8]/10 rounded-full flex items-center justify-center">
                            <span className="text-[10px] font-medium text-[#1A73E8]">
                              {getInitials(task.assignee.fullName)}
                            </span>
                          </div>
                          <span className="text-xs text-[#64748B]">{task.assignee.fullName}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <span className="text-xs text-[#64748B]">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {getTasksByStatus(column.id).length === 0 && (
                  <div className="text-center py-8 text-[#64748B] text-sm">
                    No tasks here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1E293B]">Description</label>
            <textarea
              placeholder="Describe the task..."
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/20 focus:border-[#1A73E8] min-h-[80px] resize-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1E293B]">Priority</label>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/20 focus:border-[#1A73E8]"
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
