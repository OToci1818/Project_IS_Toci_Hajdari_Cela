'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface Project {
  id: string
  title: string
}

interface AnalyticsData {
  projects: Project[]
  taskCompletionTrend: { date: string; completed: number }[]
  tasksByStatus: { status: string; count: number }[]
  memberPerformance: { name: string; completed: number; pending: number }[]
  deadlineAdherence: { onTime: number; overdue: number }
  projectProgress: { name: string; progress: number; total: number; done: number }[]
}

// Vibrant colors for charts
const STATUS_COLORS = ['#6366f1', '#f59e0b', '#22c55e'] // indigo, amber, green
const PIE_COLORS = ['#22c55e', '#ef4444'] // green, red
const MEMBER_COLORS = ['#22c55e', '#f59e0b'] // green, amber
const LINE_COLOR = '#8b5cf6' // violet

const TIMELINE_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 60, label: 'Last 60 days' },
  { value: 90, label: 'Last 90 days' },
]

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedDays, setSelectedDays] = useState<number>(30)

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedProject) {
        params.append('projectId', selectedProject)
      }
      params.append('days', selectedDays.toString())

      const response = await fetch(`/api/dashboard/analytics?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [selectedProject, selectedDays])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const deadlineData = [
    { name: 'On Time', value: data.deadlineAdherence.onTime },
    { name: 'Overdue', value: data.deadlineAdherence.overdue },
  ]

  const hasDeadlineData = data.deadlineAdherence.onTime > 0 || data.deadlineAdherence.overdue > 0

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-card-foreground">
          Team Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your team&apos;s performance and project progress
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Project
          </label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border border-border rounded-[0.625rem] bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary min-w-[200px]"
          >
            <option value="">All Projects</option>
            {data.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#6366f1]">
              {data.projectProgress.length}
            </p>
            <p className="text-sm text-muted-foreground">Projects</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#f59e0b]">
              {data.memberPerformance.length}
            </p>
            <p className="text-sm text-muted-foreground">Team Members</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#22c55e]">
              {data.tasksByStatus.reduce((sum, t) => sum + t.count, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Tasks</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-[#8b5cf6]">
              {hasDeadlineData
                ? Math.round(
                    (data.deadlineAdherence.onTime /
                      (data.deadlineAdherence.onTime + data.deadlineAdherence.overdue)) *
                      100
                  )
                : 0}
              %
            </p>
            <p className="text-sm text-muted-foreground">On-Time Rate</p>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Task Completion Trend */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-card-foreground">
              Task Completion Trend
            </h2>
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 text-sm border border-border rounded-[0.625rem] bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {TIMELINE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {data.taskCompletionTrend.some((d) => d.completed > 0) ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.taskCompletionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.625rem',
                    }}
                    labelFormatter={formatDate}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke={LINE_COLOR}
                    strokeWidth={3}
                    dot={{ fill: LINE_COLOR, strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: LINE_COLOR }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No completed tasks in the selected period
            </div>
          )}
        </Card>

        {/* Tasks by Status */}
        <Card>
          <h2 className="text-xl font-semibold text-card-foreground mb-6">
            Tasks by Status
          </h2>
          {data.tasksByStatus.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.tasksByStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="status"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.625rem',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No tasks found
            </div>
          )}
        </Card>

        {/* Member Performance */}
        <Card>
          <h2 className="text-xl font-semibold text-card-foreground mb-6">
            Member Performance
          </h2>
          {data.memberPerformance.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.memberPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.625rem',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" fill={MEMBER_COLORS[0]} stackId="a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill={MEMBER_COLORS[1]} stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No member data available
            </div>
          )}
        </Card>

        {/* Deadline Adherence */}
        <Card>
          <h2 className="text-xl font-semibold text-card-foreground mb-6">
            Deadline Adherence
          </h2>
          {hasDeadlineData ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deadlineData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {deadlineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.625rem',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No deadline data available
            </div>
          )}
        </Card>
      </div>

      {/* Project Progress */}
      <Card>
        <h2 className="text-xl font-semibold text-card-foreground mb-6">
          Project Progress
        </h2>
        {data.projectProgress.length > 0 ? (
          <div className="space-y-4">
            {data.projectProgress.map((project, index) => {
              const progressColors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899']
              const color = progressColors[index % progressColors.length]
              return (
                <div key={project.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-card-foreground">{project.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {project.done}/{project.total} tasks ({project.progress}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${project.progress}%`,
                        backgroundColor: project.progress === 100 ? '#22c55e' : color
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No projects found. Create a project to see analytics.
          </div>
        )}
      </Card>
    </div>
  )
}
