'use client'

import { useState } from 'react'
import { Card, Badge, Button, Input, Modal } from '@/components'

// Mock data
const mockProjects = [
  {
    id: '1',
    title: 'Database Management System',
    description: 'Design and implement a relational database for a university library system.',
    course: 'CS301',
    status: 'active' as const,
    type: 'group' as const,
    progress: 65,
    deadline: '2025-01-15',
    members: 4,
    tasks: { total: 12, done: 8 },
  },
  {
    id: '2',
    title: 'Web Application Development',
    description: 'Build a full-stack web application using modern frameworks.',
    course: 'CS401',
    status: 'active' as const,
    type: 'group' as const,
    progress: 40,
    deadline: '2025-01-20',
    members: 3,
    tasks: { total: 15, done: 6 },
  },
  {
    id: '3',
    title: 'Machine Learning Project',
    description: 'Implement a machine learning model for image classification.',
    course: 'CS450',
    status: 'completed' as const,
    type: 'individual' as const,
    progress: 100,
    deadline: '2024-12-01',
    members: 1,
    tasks: { total: 8, done: 8 },
  },
  {
    id: '4',
    title: 'Network Security Analysis',
    description: 'Analyze network vulnerabilities and propose security solutions.',
    course: 'CS420',
    status: 'active' as const,
    type: 'group' as const,
    progress: 25,
    deadline: '2025-02-01',
    members: 5,
    tasks: { total: 20, done: 5 },
  },
  {
    id: '5',
    title: 'Mobile App Development',
    description: 'Create a cross-platform mobile application for student services.',
    course: 'CS380',
    status: 'archived' as const,
    type: 'group' as const,
    progress: 100,
    deadline: '2024-11-15',
    members: 4,
    tasks: { total: 10, done: 10 },
  },
]

const statusOptions = ['all', 'active', 'completed', 'archived']
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'deadline', label: 'Closest Deadline' },
]

export default function ProjectsPage() {
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // New project form state
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    course: '',
    deadline: '',
    type: 'group',
  })

  // Filter and search
  const filteredProjects = mockProjects
    .filter((p) => filter === 'all' || p.status === filter)
    .filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.course.toLowerCase().includes(search.toLowerCase())
    )

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Projects</h1>
          <p className="text-[#64748B] mt-1">Manage your university projects</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/20 focus:border-[#1A73E8]"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === status
                    ? 'bg-[#1A73E8] text-white'
                    : 'bg-gray-100 text-[#64748B] hover:bg-gray-200'
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
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/20 focus:border-[#1A73E8]"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} hoverable>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-[#1E293B]">{project.title}</h3>
                  {getStatusBadge(project.status)}
                </div>
                <p className="text-sm text-[#64748B]">{project.course}</p>
              </div>
              <Badge variant={project.type === 'group' ? 'info' : 'default'}>
                {project.type}
              </Badge>
            </div>

            <p className="text-sm text-[#64748B] mb-4 line-clamp-2">
              {project.description}
            </p>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-[#64748B]">Progress</span>
                <span className="font-medium text-[#1E293B]">{project.progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    project.progress === 100 ? 'bg-[#34A853]' : 'bg-[#1A73E8]'
                  }`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4 text-sm text-[#64748B]">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {project.members}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {project.tasks.done}/{project.tasks.total}
                </span>
              </div>
              <span className="text-sm text-[#64748B]">
                Due: {project.deadline}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card className="text-center py-12">
          <svg className="w-12 h-12 text-[#64748B] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-medium text-[#1E293B] mb-2">No projects found</h3>
          <p className="text-[#64748B]">Try adjusting your search or filter criteria</p>
        </Card>
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
            <Button onClick={() => setShowCreateModal(false)}>
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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1E293B]">Description</label>
            <textarea
              placeholder="Describe your project..."
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/20 focus:border-[#1A73E8] min-h-[100px] resize-none"
            />
          </div>
          <Input
            label="Course Code"
            placeholder="e.g., CS301"
            value={newProject.course}
            onChange={(value) => setNewProject({ ...newProject, course: value })}
            required
          />
          <Input
            label="Deadline"
            type="date"
            value={newProject.deadline}
            onChange={(value) => setNewProject({ ...newProject, deadline: value })}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1E293B]">Project Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="group"
                  checked={newProject.type === 'group'}
                  onChange={() => setNewProject({ ...newProject, type: 'group' })}
                  className="text-[#1A73E8] focus:ring-[#1A73E8]"
                />
                <span className="text-[#1E293B]">Group</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="individual"
                  checked={newProject.type === 'individual'}
                  onChange={() => setNewProject({ ...newProject, type: 'individual' })}
                  className="text-[#1A73E8] focus:ring-[#1A73E8]"
                />
                <span className="text-[#1E293B]">Individual</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
