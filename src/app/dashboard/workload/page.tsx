'use client'

import { useState, useEffect } from 'react'
import { Card, Badge } from '@/components'

interface TaskCounts {
  total: number
  todo: number
  inProgress: number
  inReview: number
  done: number
  overdue: number
}

interface TeamMemberWorkload {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  tasks: TaskCounts
}

interface ProjectWorkload {
  id: string
  title: string
  members: TeamMemberWorkload[]
}

interface WorkloadData {
  projects: ProjectWorkload[]
  overall: TeamMemberWorkload[]
}

export default function WorkloadDashboardPage() {
  const [data, setData] = useState<WorkloadData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>('')

  useEffect(() => {
    const fetchWorkload = async () => {
      try {
        const response = await fetch('/api/dashboard/workload')
        if (response.ok) {
          const workloadData = await response.json()
          setData(workloadData)
          // Set first project as default
          if (workloadData.projects.length > 0 && !selectedProject) {
            setSelectedProject(workloadData.projects[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch workload data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkload()
  }, [])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getWorkloadLevel = (activeTasks: number): { level: string; color: string } => {
    if (activeTasks === 0) return { level: 'Free', color: 'bg-muted text-muted-foreground' }
    if (activeTasks <= 2) return { level: 'Light', color: 'bg-success/20 text-success' }
    if (activeTasks <= 4) return { level: 'Moderate', color: 'bg-warning/20 text-warning' }
    return { level: 'Heavy', color: 'bg-destructive/20 text-destructive' }
  }

  const getProgressPercentage = (tasks: TaskCounts) => {
    if (tasks.total === 0) return 0
    return Math.round((tasks.done / tasks.total) * 100)
  }

  const membersToShow = data?.projects.find((p) => p.id === selectedProject)?.members || []

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-card-foreground">
          Workload Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor your team members task distribution and workload
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : !data || data.projects.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No Projects Found</h3>
            <p className="text-muted-foreground">
              You need to be a team leader of at least one project to view workload data.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Project Filter */}
          <div className="mb-6">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2 rounded-[0.625rem] border border-border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {data.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="flex items-center gap-4">
                <div className="stats-icon stats-icon-primary">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">
                    {membersToShow.reduce((sum, m) => sum + m.tasks.total, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-4">
                <div className="stats-icon stats-icon-warning">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">
                    {membersToShow.reduce((sum, m) => sum + m.tasks.total - m.tasks.done, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Tasks</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-4">
                <div className="stats-icon stats-icon-success">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">
                    {membersToShow.reduce((sum, m) => sum + m.tasks.done, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed Tasks</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-4">
                <div className="stats-icon stats-icon-destructive">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">
                    {membersToShow.reduce((sum, m) => sum + m.tasks.overdue, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Overdue Tasks</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Team Members Workload */}
          <Card>
            <h2 className="text-xl font-semibold text-card-foreground mb-6">Team Members Workload</h2>

            {membersToShow.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No team members in this project yet.</p>
            ) : (
              <div className="space-y-4">
                {membersToShow.map((member) => {
                  const activeTasks = member.tasks.total - member.tasks.done
                  const workload = getWorkloadLevel(activeTasks)
                  const progress = getProgressPercentage(member.tasks)

                  return (
                    <div
                      key={member.id}
                      className="p-4 rounded-[0.625rem] border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Member Info */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-primary font-semibold text-sm">
                              {getInitials(member.fullName)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-card-foreground">{member.fullName}</h3>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>

                        {/* Workload Badge */}
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${workload.color}`}>
                          {workload.level}
                        </span>
                      </div>

                      {/* Task Stats */}
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="text-center p-2 bg-muted/50 rounded-[0.625rem]">
                          <p className="text-lg font-semibold text-card-foreground">{member.tasks.todo}</p>
                          <p className="text-xs text-muted-foreground">To Do</p>
                        </div>
                        <div className="text-center p-2 bg-primary/10 rounded-[0.625rem]">
                          <p className="text-lg font-semibold text-primary">{member.tasks.inProgress}</p>
                          <p className="text-xs text-muted-foreground">In Progress</p>
                        </div>
                        <div className="text-center p-2 bg-warning/10 rounded-[0.625rem]">
                          <p className="text-lg font-semibold text-warning">{member.tasks.inReview}</p>
                          <p className="text-xs text-muted-foreground">In Review</p>
                        </div>
                        <div className="text-center p-2 bg-success/10 rounded-[0.625rem]">
                          <p className="text-lg font-semibold text-success">{member.tasks.done}</p>
                          <p className="text-xs text-muted-foreground">Done</p>
                        </div>
                        <div className="text-center p-2 bg-destructive/10 rounded-[0.625rem]">
                          <p className="text-lg font-semibold text-destructive">{member.tasks.overdue}</p>
                          <p className="text-xs text-muted-foreground">Overdue</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">Completion Progress</span>
                          <span className="text-sm font-medium text-card-foreground">{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-success' : 'bg-primary'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
