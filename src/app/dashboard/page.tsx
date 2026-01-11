'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, Badge } from '@/components'

interface User {
  fullName: string
  role: string
}

// Student dashboard interfaces
interface DashboardStats {
  totalProjects: number
  completedProjects: number
  activeTasks: number
  completedTasks: number
  totalTasks: number
}

interface RecentProject {
  id: string
  title: string
  courseCode?: string
  status: string
  progress: number
  deadlineDate?: string
  grade?: {
    gradeType: 'numeric' | 'letter'
    numericGrade?: number
    letterGrade?: string
  }
}

// Professor dashboard interfaces
interface ProfessorDashboardStats {
  totalCourses: number
  activeCourses: number
  totalStudents: number
  totalProjects: number
  pendingSubmissions: number
  gradedProjects: number
}

interface ProfessorCourse {
  id: string
  title: string
  code: string
  semester: string
  year: number
  studentCount: number
  projectCount: number
  pendingSubmissions: number
}

interface RecentActivity {
  id: string
  type: 'graded' | 'reviewed' | 'submission_received'
  projectTitle: string
  projectId: string
  studentName: string
  courseName: string
  timestamp: string
  details?: string
}

interface Announcement {
  id: string
  title: string
  content: string
  isPinned: boolean
  createdAt: string
  course: {
    id: string
    title: string
    code: string
  }
  professor: {
    id: string
    fullName: string
  }
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Student data
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  // Professor data
  const [professorStats, setProfessorStats] = useState<ProfessorDashboardStats | null>(null)
  const [courses, setCourses] = useState<ProfessorCourse[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, dashboardResponse] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/dashboard/stats'),
        ])

        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData.user)
        }

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json()
          setUserRole(dashboardData.userRole)

          if (dashboardData.userRole === 'professor') {
            setProfessorStats(dashboardData.stats)
            setCourses(dashboardData.courses || [])
            setRecentActivity(dashboardData.recentActivity || [])
          } else {
            setStats(dashboardData.stats)
            setRecentProjects(dashboardData.recentProjects)

            // Fetch announcements for students
            const announcementsResponse = await fetch('/api/announcements')
            if (announcementsResponse.ok) {
              const announcementsData = await announcementsResponse.json()
              setAnnouncements(announcementsData.announcements || [])
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0]
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(timestamp)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'graded':
        return (
          <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'reviewed':
        return (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        )
      case 'submission_received':
        return (
          <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  // Professor dashboard
  if (userRole === 'professor') {
    const professorStatsConfig = [
      {
        label: 'Total Courses',
        value: professorStats?.totalCourses ?? 0,
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        color: 'primary'
      },
      {
        label: 'Total Students',
        value: professorStats?.totalStudents ?? 0,
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
        color: 'info'
      },
      {
        label: 'Pending Submissions',
        value: professorStats?.pendingSubmissions ?? 0,
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'warning'
      },
      {
        label: 'Graded Projects',
        value: professorStats?.gradedProjects ?? 0,
        icon: (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: 'success'
      },
    ]

    return (
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-card-foreground">
            Mire se vjen, Prof. {user ? getFirstName(user.fullName) : '...'}!
          </h1>
          <p className="text-muted-foreground mt-1">Manage your courses and review student projects.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {professorStatsConfig.map((stat) => (
            <Card key={stat.label}>
              <div className="flex items-center gap-4">
                <div className={`stats-icon stats-icon-${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground">
                    {loading ? '...' : stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Courses */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-card-foreground">My Courses</h2>
              <Link
                href="/dashboard/courses"
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                View all
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No courses yet</p>
                <Link
                  href="/dashboard/courses"
                  className="text-primary font-medium hover:underline"
                >
                  Create your first course
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.slice(0, 4).map((course) => (
                  <Link
                    key={course.id}
                    href={`/dashboard/courses/${course.id}`}
                    className="flex items-center justify-between p-4 rounded-[0.625rem] border border-border hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer group block"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-card-foreground group-hover:text-primary transition-colors truncate">
                          {course.title}
                        </h3>
                        <Badge variant="default">{course.code}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {course.semester} {course.year}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {course.studentCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        {course.projectCount}
                      </span>
                      {course.pendingSubmissions > 0 && (
                        <Badge variant="warning">{course.pendingSubmissions} pending</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-card-foreground">Recent Activity</h2>
              <Link
                href="/dashboard/professor/projects"
                className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
              >
                View projects
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.slice(0, 5).map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/dashboard/projects/${activity.projectId}`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {activity.projectTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.studentName} · {activity.courseName}
                      </p>
                      {activity.details && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.details}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <Card>
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/dashboard/courses"
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-card-foreground">Create Course</p>
                  <p className="text-sm text-muted-foreground">Add a new course</p>
                </div>
              </Link>

              <Link
                href="/dashboard/professor/projects"
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-card-foreground">Review Submissions</p>
                  <p className="text-sm text-muted-foreground">{professorStats?.pendingSubmissions || 0} pending</p>
                </div>
              </Link>

              <Link
                href="/dashboard/professor/projects"
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-card-foreground">Grade Projects</p>
                  <p className="text-sm text-muted-foreground">View student projects</p>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Student dashboard
  const statsConfig = [
    {
      label: 'Total Projects',
      value: stats?.totalProjects ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      color: 'primary'
    },
    {
      label: 'Active Tasks',
      value: stats?.activeTasks ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'warning'
    },
    {
      label: 'Completed Tasks',
      value: stats?.completedTasks ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'success'
    },
    {
      label: 'Total Tasks',
      value: stats?.totalTasks ?? 0,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'info'
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-card-foreground">
          Mire se vjen, {user ? getFirstName(user.fullName) : '...'}!
        </h1>
        <p className="text-muted-foreground mt-1">Here is what is happening with your projects.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsConfig.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-4">
              <div className={`stats-icon stats-icon-${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">
                  {loading ? '...' : stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              <h2 className="text-xl font-semibold text-card-foreground">Announcements</h2>
            </div>
          </div>
          <div className="space-y-4">
            {announcements.slice(0, 3).map((announcement) => (
              <div
                key={announcement.id}
                className="p-4 rounded-[0.625rem] border border-border hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.isPinned && (
                        <svg className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2H7a2 2 0 01-2-2V5zm2 10v-4h6v4a2 2 0 01-2 2H9a2 2 0 01-2-2z" />
                        </svg>
                      )}
                      <h3 className="font-medium text-card-foreground">{announcement.title}</h3>
                      <Badge variant="info">{announcement.course.code}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{announcement.professor.fullName}</span>
                      <span>-</span>
                      <span>{formatTimestamp(announcement.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Projects */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-card-foreground">Recent Projects</h2>
          <Link
            href="/dashboard/projects"
            className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
          >
            View all
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No projects yet</p>
            <Link
              href="/dashboard/projects"
              className="text-primary font-medium hover:underline"
            >
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="flex items-center justify-between p-4 rounded-[0.625rem] border border-border hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer group block"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-medium text-card-foreground group-hover:text-primary transition-colors">
                      {project.title}
                    </h3>
                    <Badge variant={project.status === 'completed' ? 'success' : 'info'}>
                      {project.status}
                    </Badge>
                    {project.grade && (
                      <Badge variant="success">
                        {project.grade.gradeType === 'numeric'
                          ? `${project.grade.numericGrade}/100`
                          : project.grade.letterGrade}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {project.courseCode || 'No course'}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Due: {formatDate(project.deadlineDate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            project.progress === 100 ? 'bg-success' : 'bg-primary'
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-card-foreground w-10">{project.progress}%</span>
                    </div>
                  </div>
                  <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                    View Details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
