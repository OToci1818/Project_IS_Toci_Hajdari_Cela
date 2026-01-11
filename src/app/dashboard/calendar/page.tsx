'use client'

import { useState, useEffect, useCallback } from 'react'
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

interface Project {
  id: string
  title: string
  deadlineDate?: string
  status: string
}

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: 'task' | 'project'
  priority?: 'low' | 'medium' | 'high'
  status?: string
  projectTitle?: string
  originalData: Task | Project
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [view, setView] = useState<'month' | 'week'>('month')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [tasksRes, projectsRes, userRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/projects'),
        fetch('/api/auth/me'),
      ])

      if (tasksRes.ok) {
        const data = await tasksRes.json()
        setTasks(data.tasks || [])
      }

      if (projectsRes.ok) {
        const data = await projectsRes.json()
        setProjects(data.projects || [])
      }

      if (userRes.ok) {
        const data = await userRes.json()
        setCurrentUserId(data.user.id)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Get calendar events from tasks and projects
  const getCalendarEvents = useCallback((): CalendarEvent[] => {
    const events: CalendarEvent[] = []

    // Add tasks with due dates
    tasks.forEach((task) => {
      if (task.dueDate) {
        events.push({
          id: `task-${task.id}`,
          title: task.title,
          date: new Date(task.dueDate),
          type: 'task',
          priority: task.priority,
          status: task.status,
          projectTitle: task.project?.title,
          originalData: task,
        })
      }
    })

    // Add project deadlines
    projects.forEach((project) => {
      if (project.deadlineDate) {
        events.push({
          id: `project-${project.id}`,
          title: project.title,
          date: new Date(project.deadlineDate),
          type: 'project',
          status: project.status,
          originalData: project,
        })
      }
    })

    return events
  }, [tasks, projects])

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (Date | null)[] = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  // Get days in week view
  const getDaysInWeek = (date: Date) => {
    const days: Date[] = []
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }

    return days
  }

  // Get events for a specific day
  const getEventsForDay = (day: Date | null, events: CalendarEvent[]) => {
    if (!day) return []
    return events.filter((event) => {
      const eventDate = new Date(event.date)
      return (
        eventDate.getFullYear() === day.getFullYear() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getDate() === day.getDate()
      )
    })
  }

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Navigate weeks
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const goToNextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  // Check if date is today
  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )
  }

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive text-destructive-foreground'
      case 'medium':
        return 'bg-warning text-warning-foreground'
      case 'low':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-primary text-primary-foreground'
    }
  }

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'task') {
      setSelectedTask(event.originalData as Task)
    } else {
      // For projects, navigate to project page
      window.location.href = `/dashboard/projects/${(event.originalData as Project).id}`
    }
  }

  const calendarEvents = getCalendarEvents()
  const days = view === 'month' ? getDaysInMonth(currentDate) : getDaysInWeek(currentDate)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-card-foreground">Calendar</h1>
        <p className="text-muted-foreground mt-1">View all your deadlines and due dates</p>
      </div>

      {/* Calendar Controls */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={view === 'month' ? goToPreviousMonth : goToPreviousWeek}
              className="p-2 rounded-[0.5rem] hover:bg-muted transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-card-foreground min-w-[200px] text-center">
              {view === 'month'
                ? `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              }
            </h2>
            <button
              onClick={view === 'month' ? goToNextMonth : goToNextWeek}
              className="p-2 rounded-[0.5rem] hover:bg-muted transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium rounded-[0.5rem] border border-border hover:bg-muted transition-colors"
            >
              Today
            </button>
            <div className="flex rounded-[0.5rem] border border-border overflow-hidden">
              <button
                onClick={() => setView('month')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  view === 'month' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  view === 'week' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                Week
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive"></div>
          <span className="text-sm text-muted-foreground">High Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning"></div>
          <span className="text-sm text-muted-foreground">Medium Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted"></div>
          <span className="text-sm text-muted-foreground">Low Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-sm text-muted-foreground">Project Deadline</span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Calendar Grid */}
      {!loading && (
        <Card>
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS.map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className={`grid grid-cols-7 ${view === 'week' ? 'min-h-[400px]' : ''}`}>
            {days.map((day, index) => {
              const dayEvents = getEventsForDay(day, calendarEvents)
              const isCurrentDay = isToday(day)

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border-b border-r border-border ${
                    !day ? 'bg-muted/30' : ''
                  } ${view === 'week' ? 'min-h-[400px]' : ''}`}
                >
                  {day && (
                    <>
                      <div
                        className={`text-sm font-medium mb-2 w-7 h-7 flex items-center justify-center rounded-full ${
                          isCurrentDay
                            ? 'bg-primary text-primary-foreground'
                            : 'text-card-foreground'
                        }`}
                      >
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, view === 'week' ? 10 : 3).map((event) => (
                          <button
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className={`w-full text-left px-2 py-1 rounded text-xs truncate transition-opacity hover:opacity-80 ${getPriorityColor(
                              event.type === 'task' ? event.priority : undefined
                            )} ${event.status === 'done' ? 'opacity-50 line-through' : ''}`}
                            title={`${event.title}${event.projectTitle ? ` - ${event.projectTitle}` : ''}`}
                          >
                            {event.type === 'project' && (
                              <span className="mr-1">📁</span>
                            )}
                            {event.title}
                          </button>
                        ))}
                        {dayEvents.length > (view === 'week' ? 10 : 3) && (
                          <p className="text-xs text-muted-foreground px-2">
                            +{dayEvents.length - (view === 'week' ? 10 : 3)} more
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Upcoming Events Summary */}
      {!loading && (
        <Card className="mt-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">Upcoming Deadlines</h3>
          {calendarEvents
            .filter((event) => {
              const eventDate = new Date(event.date)
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              return eventDate >= today && event.status !== 'done'
            })
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 5)
            .map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      event.type === 'task'
                        ? event.priority === 'high'
                          ? 'bg-destructive'
                          : event.priority === 'medium'
                          ? 'bg-warning'
                          : 'bg-muted'
                        : 'bg-primary'
                    }`}
                  ></div>
                  <div>
                    <button
                      onClick={() => handleEventClick(event)}
                      className="font-medium text-card-foreground hover:text-primary transition-colors"
                    >
                      {event.title}
                    </button>
                    {event.projectTitle && (
                      <p className="text-xs text-muted-foreground">{event.projectTitle}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={event.type === 'task' ? 'outline' : 'info'}>
                    {event.type === 'task' ? 'Task' : 'Project'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {event.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          {calendarEvents.filter((e) => {
            const eventDate = new Date(e.date)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            return eventDate >= today && e.status !== 'done'
          }).length === 0 && (
            <p className="text-muted-foreground text-center py-4">No upcoming deadlines</p>
          )}
        </Card>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        currentUserId={currentUserId}
      />
    </div>
  )
}
