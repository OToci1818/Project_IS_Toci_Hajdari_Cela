'use client'

import { useState } from 'react'
import { Card, Badge, Button, Modal, Input } from '@/components'

const mockTasks = [
  {
    id: '1',
    title: 'Design database schema',
    description: 'Create ERD and define all tables',
    priority: 'high' as const,
    status: 'done' as const,
    assignee: { id: '1', name: 'John Doe', initials: 'JD' },
    dueDate: '2024-12-10',
    project: 'Database Management System',
  },
  {
    id: '2',
    title: 'Implement user authentication',
    description: 'JWT-based auth with @fti.edu.al validation',
    priority: 'high' as const,
    status: 'in_progress' as const,
    assignee: { id: '2', name: 'Jane Smith', initials: 'JS' },
    dueDate: '2024-12-15',
    project: 'Web Application Development',
  },
  {
    id: '3',
    title: 'Create REST API endpoints',
    description: 'CRUD operations for projects and tasks',
    priority: 'medium' as const,
    status: 'in_progress' as const,
    assignee: { id: '1', name: 'John Doe', initials: 'JD' },
    dueDate: '2024-12-18',
    project: 'Web Application Development',
  },
  {
    id: '4',
    title: 'Setup Docker environment',
    description: 'Configure docker-compose with PostgreSQL',
    priority: 'medium' as const,
    status: 'done' as const,
    assignee: { id: '3', name: 'Mike Johnson', initials: 'MJ' },
    dueDate: '2024-12-08',
    project: 'Database Management System',
  },
  {
    id: '5',
    title: 'Write unit tests',
    description: 'Test coverage for auth module',
    priority: 'low' as const,
    status: 'to_do' as const,
    assignee: { id: '2', name: 'Jane Smith', initials: 'JS' },
    dueDate: '2024-12-20',
    project: 'Web Application Development',
  },
  {
    id: '6',
    title: 'Design landing page UI',
    description: 'Figma mockups for main pages',
    priority: 'medium' as const,
    status: 'to_do' as const,
    assignee: { id: '4', name: 'Sarah Wilson', initials: 'SW' },
    dueDate: '2024-12-22',
    project: 'Web Application Development',
  },
  {
    id: '7',
    title: 'Implement file upload',
    description: 'S3 integration for task attachments',
    priority: 'low' as const,
    status: 'to_do' as const,
    assignee: { id: '1', name: 'John Doe', initials: 'JD' },
    dueDate: '2024-12-25',
    project: 'Database Management System',
  },
  {
    id: '8',
    title: 'Setup CI/CD pipeline',
    description: 'GitHub Actions for automated deployment',
    priority: 'high' as const,
    status: 'in_progress' as const,
    assignee: { id: '3', name: 'Mike Johnson', initials: 'MJ' },
    dueDate: '2024-12-14',
    project: 'Web Application Development',
  },
]

const columns = [
  { id: 'to_do', title: 'To Do', color: '#64748B' },
  { id: 'in_progress', title: 'In Progress', color: '#1A73E8' },
  { id: 'done', title: 'Done', color: '#34A853' },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState(mockTasks)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
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

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status)
  }

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (status: string) => {
    if (draggedTask) {
      setTasks(tasks.map((task) =>
        task.id === draggedTask
          ? { ...task, status: status as 'to_do' | 'in_progress' | 'done' }
          : task
      ))
      setDraggedTask(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Tasks</h1>
          <p className="text-[#64748B] mt-1">Manage your tasks with Kanban board</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </Button>
      </div>

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

                  <p className="text-xs text-[#64748B] mb-3 line-clamp-2">
                    {task.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#1A73E8]/10 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-medium text-[#1A73E8]">
                          {task.assignee.initials}
                        </span>
                      </div>
                      <span className="text-xs text-[#64748B]">{task.assignee.name}</span>
                    </div>
                    <span className="text-xs text-[#64748B]">{task.dueDate}</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-[#1A73E8]">{task.project}</span>
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

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateModal(false)}>
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
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1E293B]">Assign To</label>
            <select
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/20 focus:border-[#1A73E8]"
            >
              <option value="1">John Doe</option>
              <option value="2">Jane Smith</option>
              <option value="3">Mike Johnson</option>
              <option value="4">Sarah Wilson</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
