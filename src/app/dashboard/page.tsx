'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, Badge } from '@/components'

interface User {
  fullName: string
}

const stats = [
  {
    label: 'Total Projects',
    value: '12',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    color: 'primary'
  },
  {
    label: 'Active Tasks',
    value: '28',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    color: 'warning'
  },
  {
    label: 'Completed',
    value: '45',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'success'
  },
  {
    label: 'Team Members',
    value: '8',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    color: 'destructive'
  },
]

const recentProjects = [
  {
    id: '1',
    title: 'Database Management System',
    course: 'CS301',
    status: 'active',
    progress: 65,
    deadline: '2025-01-15',
  },
  {
    id: '2',
    title: 'Web Application Development',
    course: 'CS401',
    status: 'active',
    progress: 40,
    deadline: '2025-01-20',
  },
  {
    id: '3',
    title: 'Machine Learning Project',
    course: 'CS450',
    status: 'completed',
    progress: 100,
    deadline: '2024-12-01',
  },
]

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch {
        // Handle error
      }
    }
    fetchUser()
  }, [])

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0]
  }

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
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-4">
              <div className={`stats-icon stats-icon-${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tip Alert */}
      <div className="alert-warning flex items-start gap-3 mb-6">
        <svg className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <div>
          <p className="font-medium text-card-foreground">Tip: Stay organized!</p>
          <p className="text-sm text-muted-foreground">Use the Tasks page to track your progress and stay on top of deadlines.</p>
        </div>
      </div>

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

        <div className="space-y-4">
          {recentProjects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-4 rounded-[0.625rem] border border-border hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-medium text-card-foreground group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <Badge variant={project.status === 'completed' ? 'success' : 'info'}>
                    {project.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {project.course}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due: {project.deadline}
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
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
