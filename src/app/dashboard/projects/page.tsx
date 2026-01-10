'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, Badge, Button, Input, Modal } from '@/components'

interface Project {
  id: string
  title: string
  description?: string
  courseCode?: string
  projectType: 'individual' | 'group'
  status: 'active' | 'completed' | 'archived'
  progress: number
  deadlineDate?: string
  memberCount: number
  taskStats: { total: number; done: number }
}

const statusOptions = ['all', 'active', 'completed', 'archived']
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'deadline', label: 'Closest Deadline' },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    courseCode: '',
    deadlineDate: '',
    projectType: 'group',
  })

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.set('status', filter)
      }
      const response = await fetch(`/api/projects?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleCreateProject = async () => {
    if (!newProject.title) return

    try {
      setCreating(true)
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newProject.title,
          description: newProject.description || undefined,
          courseCode: newProject.courseCode || undefined,
          projectType: newProject.projectType,
          deadlineDate: newProject.deadlineDate || undefined,
        }),
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewProject({
          title: '',
          description: '',
          courseCode: '',
          deadlineDate: '',
          projectType: 'group',
        })
        fetchProjects()
      }
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setCreating(false)
    }
  }

  const filteredProjects = projects
    .filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.courseCode?.toLowerCase() || '').includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'deadline') {
        if (!a.deadlineDate) return 1
        if (!b.deadlineDate) return -1
        return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime()
      }
      return 0 // API already sorts by newest
    })

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-card-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage your university projects</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Project
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="text-sm font-medium text-muted-foreground">Filters:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={setSearch}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 rounded-[0.625rem] text-sm font-medium transition-all ${
                  filter === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2.5 rounded-[0.625rem] border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Projects Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card hoverable className="h-full cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-card-foreground truncate">{project.title}</h3>
                    {getStatusBadge(project.status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {project.courseCode || 'No course'}
                  </div>
                </div>
                <Badge variant={project.projectType === 'group' ? 'info' : 'outline'}>
                  {project.projectType}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {project.description || 'No description'}
              </p>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-card-foreground">{project.progress}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      project.progress === 100 ? 'bg-success' : 'bg-primary'
                    }`}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1" title="Team members">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {project.memberCount}
                  </span>
                  <span className="flex items-center gap-1" title="Tasks completed">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    {project.taskStats.done}/{project.taskStats.total}
                  </span>
                </div>
                <span className="flex items-center gap-1 text-sm text-muted-foreground" title="Deadline">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(project.deadlineDate)}
                </span>
              </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProjects.length === 0 && (
        <div className="empty-state">
          <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-card-foreground mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">
            {projects.length === 0
              ? 'Create your first project to get started'
              : 'Try adjusting your search or filter criteria'}
          </p>
          {projects.length === 0 ? (
            <Button onClick={() => setShowCreateModal(true)}>Create Project</Button>
          ) : (
            <Button onClick={() => { setFilter('all'); setSearch(''); }}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} loading={creating}>
              Create Project
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Project Title"
            placeholder="Enter project title"
            value={newProject.title}
            onChange={(value) => setNewProject({ ...newProject, title: value })}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-card-foreground">Description</label>
            <textarea
              placeholder="Describe your project..."
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="px-4 py-2.5 rounded-[0.625rem] border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px] resize-none text-card-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Input
            label="Course Code"
            placeholder="e.g., CS301"
            value={newProject.courseCode}
            onChange={(value) => setNewProject({ ...newProject, courseCode: value })}
          />
          <Input
            label="Deadline"
            type="date"
            value={newProject.deadlineDate}
            onChange={(value) => setNewProject({ ...newProject, deadlineDate: value })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-card-foreground">Project Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="group"
                  checked={newProject.projectType === 'group'}
                  onChange={() => setNewProject({ ...newProject, projectType: 'group' })}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-card-foreground">Group</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="individual"
                  checked={newProject.projectType === 'individual'}
                  onChange={() => setNewProject({ ...newProject, projectType: 'individual' })}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-card-foreground">Individual</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
