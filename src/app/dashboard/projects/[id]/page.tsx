'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Badge, Button, Tabs, FileList, Modal, Input } from '@/components'

interface Member {
  id: string
  userId: string
  role: string
  inviteStatus: string
  user: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string
  }
}

interface Project {
  id: string
  title: string
  description?: string
  courseCode?: string
  projectType: 'individual' | 'group'
  status: 'active' | 'completed' | 'archived'
  deadlineDate?: string
  teamLeaderId: string
  teamLeader: {
    id: string
    fullName: string
    email: string
  }
  members: Member[]
  taskStats: { total: number; done: number }
  progress: number
  createdAt: string
}

interface Task {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: 'to_do' | 'in_progress' | 'done' | 'archived'
  dueDate?: string
  assignee?: {
    id: string
    fullName: string
  }
}

interface FileItem {
  id: string
  filename: string
  s3Key: string | null
  sizeBytes: string
  formattedSize: string
  mimeType: string | null
  createdAt: string
  uploader: {
    id: string
    fullName: string
  }
  task: {
    id: string
    title: string
  }
}

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'members', label: 'Members' },
  { id: 'files', label: 'Files' },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [currentUserId, setCurrentUserId] = useState('')
  const [currentUserRole, setCurrentUserRole] = useState('')

  // Create task modal state
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false)
  const [creatingTask, setCreatingTask] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    assigneeId: '',
  })

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true)
      const [projectRes, tasksRes, filesRes, userRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/tasks?projectId=${projectId}`),
        fetch(`/api/projects/${projectId}/files`),
        fetch('/api/auth/me'),
      ])

      if (projectRes.ok) {
        const data = await projectRes.json()
        setProject(data.project)
      } else if (projectRes.status === 404) {
        router.push('/dashboard/projects')
        return
      }

      if (tasksRes.ok) {
        const data = await tasksRes.json()
        setTasks(data.tasks)
      }

      if (filesRes.ok) {
        const data = await filesRes.json()
        setFiles(data.files)
      }

      if (userRes.ok) {
        const data = await userRes.json()
        setCurrentUserId(data.user.id)
        setCurrentUserRole(data.user.role)
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId, router])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const handleDeleteFile = async (fileKey: string) => {
    const response = await fetch(`/api/files/${fileKey}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setFiles((prev) => prev.filter((f) => f.s3Key !== fileKey))
    }
  }

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return

    setCreatingTask(true)
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: newTask.title.trim(),
          description: newTask.description.trim() || undefined,
          priority: newTask.priority,
          dueDate: newTask.dueDate || undefined,
          assigneeId: newTask.assigneeId || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTasks((prev) => [...prev, data.task])
        setShowCreateTaskModal(false)
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: '',
          assigneeId: '',
        })
        // Update project stats
        if (project) {
          setProject({
            ...project,
            taskStats: {
              ...project.taskStats,
              total: project.taskStats.total + 1,
            },
          })
        }
      }
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setCreatingTask(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="info">Active</Badge>
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'archived':
        return <Badge variant="default">Archived</Badge>
      default:
        return null
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

  const getTaskStatusBadge = (status: string) => {
    switch (status) {
      case 'to_do':
        return <Badge variant="outline">To Do</Badge>
      case 'in_progress':
        return <Badge variant="info">In Progress</Badge>
      case 'done':
        return <Badge variant="success">Done</Badge>
      case 'archived':
        return <Badge variant="default">Archived</Badge>
      default:
        return null
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'team_leader':
        return <Badge variant="info">Team Leader</Badge>
      case 'student':
        return <Badge variant="default">Student</Badge>
      case 'professor':
        return <Badge variant="warning">Professor</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-card-foreground mb-2">Project not found</h2>
        <Link href="/dashboard/projects">
          <Button>Back to Projects</Button>
        </Link>
      </div>
    )
  }

  const acceptedMembers = project.members.filter((m) => m.inviteStatus === 'accepted')
  const isProfessor = currentUserRole === 'professor'
  // Professors can only view - they cannot create tasks even if they were somehow the team leader
  const isTeamLeader = currentUserId === project.teamLeaderId && !isProfessor

  return (
    <div>
      {/* Back Link */}
      <Link
        href={isProfessor ? "/dashboard/professor/projects" : "/dashboard/projects"}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-card-foreground mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {isProfessor ? 'Back to Student Projects' : 'Back to Projects'}
      </Link>

      {/* Project Header */}
      <Card className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-card-foreground">{project.title}</h1>
              {getStatusBadge(project.status)}
              <Badge variant={project.projectType === 'group' ? 'info' : 'outline'}>
                {project.projectType}
              </Badge>
              {isProfessor && (
                <Badge variant="warning">Professor View (Read Only)</Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {project.courseCode && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {project.courseCode}
                </span>
              )}
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Due: {formatDate(project.deadlineDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-card-foreground">{project.progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                project.progress === 100 ? 'bg-success' : 'bg-primary'
              }`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Description</h2>
              <p className="text-muted-foreground">
                {project.description || 'No description provided.'}
              </p>
            </Card>
          </div>
          <div>
            <Card>
              <h2 className="text-lg font-semibold text-card-foreground mb-4">Statistics</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Team Members</span>
                  <span className="font-semibold text-card-foreground">{acceptedMembers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Tasks</span>
                  <span className="font-semibold text-card-foreground">{project.taskStats.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-semibold text-success">{project.taskStats.done}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">In Progress</span>
                  <span className="font-semibold text-info">
                    {tasks.filter((t) => t.status === 'in_progress').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">To Do</span>
                  <span className="font-semibold text-card-foreground">
                    {tasks.filter((t) => t.status === 'to_do').length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Add Task Button - Only visible to team leader */}
          {isTeamLeader && (
            <div className="flex justify-end">
              <Button onClick={() => setShowCreateTaskModal(true)}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </Button>
            </div>
          )}

          {tasks.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-card-foreground mb-2">No tasks yet</h3>
                <p className="text-muted-foreground mb-4">
                  {isTeamLeader ? 'Create your first task to get started.' : 'The team leader will assign tasks soon.'}
                </p>
                {isTeamLeader && (
                  <Button onClick={() => setShowCreateTaskModal(true)}>
                    Create Task
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card key={task.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-card-foreground">{task.title}</h3>
                      {getTaskStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {task.assignee && (
                        <span className="flex items-center gap-1">
                          <div className="w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center text-xs text-primary font-semibold">
                            {getInitials(task.assignee.fullName)}
                          </div>
                          {task.assignee.fullName}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-4">
          {acceptedMembers.map((member) => (
            <Card key={member.id}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">
                    {getInitials(member.user.fullName)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-card-foreground">{member.user.fullName}</h3>
                    {getRoleBadge(member.role)}
                  </div>
                  <p className="text-sm text-muted-foreground">{member.user.email}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'files' && (
        <Card>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-card-foreground mb-1">Project Files</h2>
            <p className="text-sm text-muted-foreground">
              Files uploaded to tasks in this project
            </p>
          </div>
          <FileList
            files={files}
            currentUserId={currentUserId}
            onDelete={handleDeleteFile}
          />
        </Card>
      )}

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateTaskModal}
        onClose={() => setShowCreateTaskModal(false)}
        title="Create New Task"
      >
        <div className="space-y-4">
          <Input
            label="Task Title"
            placeholder="Enter task title"
            value={newTask.title}
            onChange={(value) => setNewTask({ ...newTask, title: value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 bg-input border border-border rounded-[0.625rem] text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
              rows={3}
              placeholder="Enter task description (optional)"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Priority
            </label>
            <select
              className="w-full px-3 py-2 bg-input border border-border rounded-[0.625rem] text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
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

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1.5">
              Assign To <span className="text-destructive">*</span>
            </label>
            <select
              className="w-full px-3 py-2 bg-input border border-border rounded-[0.625rem] text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              value={newTask.assigneeId}
              onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
              required
            >
              <option value="">Select a team member</option>
              {acceptedMembers.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowCreateTaskModal(false)}
              disabled={creatingTask}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={!newTask.title.trim() || !newTask.assigneeId || creatingTask}
            >
              {creatingTask ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
