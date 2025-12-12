'use client'

import { Card, Badge } from '@/components'

const stats = [
  { label: 'Total Projects', value: '12', icon: '📁' },
  { label: 'Active Tasks', value: '28', icon: '📋' },
  { label: 'Completed', value: '45', icon: '✅' },
  { label: 'Team Members', value: '8', icon: '👥' },
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
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1E293B]">Dashboard</h1>
        <p className="text-[#64748B] mt-1">Welcome back, John! Here is what is happening.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-4">
              <div className="text-3xl">{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold text-[#1E293B]">{stat.value}</p>
                <p className="text-sm text-[#64748B]">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#1E293B]">Recent Projects</h2>
          <a href="/dashboard/projects" className="text-[#1A73E8] text-sm hover:underline">
            View all
          </a>
        </div>

        <div className="space-y-4">
          {recentProjects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-[#1A73E8]/20 hover:bg-[#F7F9FC] transition-all cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-medium text-[#1E293B]">{project.title}</h3>
                  <Badge variant={project.status === 'completed' ? 'success' : 'info'}>
                    {project.status}
                  </Badge>
                </div>
                <p className="text-sm text-[#64748B]">Course: {project.course}</p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        project.progress === 100 ? 'bg-[#34A853]' : 'bg-[#1A73E8]'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-[#1E293B]">{project.progress}%</span>
                </div>
                <p className="text-xs text-[#64748B]">Due: {project.deadline}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
