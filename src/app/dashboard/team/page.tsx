'use client'

import { useState } from 'react'
import { Card, Badge, Button, Modal, Input } from '@/components'

const mockMembers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@fti.edu.al',
    role: 'team_leader' as const,
    avatar: null,
    initials: 'JD',
    status: 'active' as const,
    tasksAssigned: 8,
    tasksCompleted: 5,
    projects: ['Database Management System', 'Web Application Development'],
    joinedAt: '2024-09-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@fti.edu.al',
    role: 'student' as const,
    avatar: null,
    initials: 'JS',
    status: 'active' as const,
    tasksAssigned: 6,
    tasksCompleted: 4,
    projects: ['Web Application Development'],
    joinedAt: '2024-09-20',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@fti.edu.al',
    role: 'student' as const,
    avatar: null,
    initials: 'MJ',
    status: 'active' as const,
    tasksAssigned: 5,
    tasksCompleted: 3,
    projects: ['Database Management System', 'Web Application Development'],
    joinedAt: '2024-09-22',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@fti.edu.al',
    role: 'student' as const,
    avatar: null,
    initials: 'SW',
    status: 'active' as const,
    tasksAssigned: 4,
    tasksCompleted: 2,
    projects: ['Web Application Development'],
    joinedAt: '2024-10-01',
  },
  {
    id: '5',
    name: 'Prof. David Brown',
    email: 'david.brown@fti.edu.al',
    role: 'professor' as const,
    avatar: null,
    initials: 'DB',
    status: 'active' as const,
    tasksAssigned: 0,
    tasksCompleted: 0,
    projects: ['Database Management System', 'Web Application Development', 'Machine Learning Project'],
    joinedAt: '2024-09-01',
  },
  {
    id: '6',
    name: 'Alex Turner',
    email: 'alex.turner@fti.edu.al',
    role: 'student' as const,
    avatar: null,
    initials: 'AT',
    status: 'pending' as const,
    tasksAssigned: 0,
    tasksCompleted: 0,
    projects: [],
    joinedAt: '2024-12-10',
  },
]

export default function TeamPage() {
  const [members] = useState(mockMembers)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [filter, setFilter] = useState('all')

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'team_leader':
        return <Badge variant="info">Team Leader</Badge>
      case 'professor':
        return <Badge variant="warning">Professor</Badge>
      case 'student':
        return <Badge variant="default">Student</Badge>
      case 'admin':
        return <Badge variant="danger">Admin</Badge>
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      default:
        return null
    }
  }

  const filteredMembers = members.filter((member) => {
    if (filter === 'all') return true
    return member.role === filter
  })

  const stats = [
    {
      label: 'Total Members',
      value: members.length,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'primary'
    },
    {
      label: 'Team Leaders',
      value: members.filter((m) => m.role === 'team_leader').length,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'warning'
    },
    {
      label: 'Students',
      value: members.filter((m) => m.role === 'student').length,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      ),
      color: 'success'
    },
    {
      label: 'Professors',
      value: members.filter((m) => m.role === 'professor').length,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'destructive'
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-card-foreground">Team</h1>
          <p className="text-muted-foreground mt-1">Manage your team members</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Invite Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className={`stats-icon stats-icon-${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {['all', 'team_leader', 'student', 'professor'].map((role) => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            className={`px-3 py-2 rounded-[0.625rem] text-sm font-medium transition-all ${
              filter === role
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {role === 'all' ? 'All' : role === 'team_leader' ? 'Team Leaders' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
          </button>
        ))}
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} hoverable>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {member.initials}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-card-foreground truncate">{member.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                </div>
              </div>
              {getStatusBadge(member.status)}
            </div>

            <div className="flex items-center gap-2 mb-4">
              {getRoleBadge(member.role)}
            </div>

            {member.role !== 'professor' && (
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted/50 rounded-[0.625rem]">
                <div className="text-center">
                  <p className="text-lg font-bold text-card-foreground">{member.tasksAssigned}</p>
                  <p className="text-xs text-muted-foreground">Assigned</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-success">{member.tasksCompleted}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Projects:</p>
              <div className="flex flex-wrap gap-1">
                {member.projects.length > 0 ? (
                  member.projects.slice(0, 2).map((project, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full"
                    >
                      {project.length > 20 ? project.substring(0, 20) + '...' : project}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">No projects yet</span>
                )}
                {member.projects.length > 2 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    +{member.projects.length - 2} more
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Joined: {member.joinedAt}
              </span>
              <button className="text-primary text-sm font-medium hover:underline">
                View Profile
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <div className="empty-state">
          <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-card-foreground mb-2">No members found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your filter</p>
          <Button onClick={() => setFilter('all')}>
            Clear Filter
          </Button>
        </div>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Team Member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowInviteModal(false)}>
              Send Invite
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@fti.edu.al"
            value={inviteEmail}
            onChange={setInviteEmail}
            required
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            }
          />
          <p className="text-xs text-muted-foreground">
            Only @fti.edu.al emails can be invited to join the team.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-card-foreground">Role</label>
            <select
              className="px-4 py-2.5 rounded-[0.625rem] border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-card-foreground"
            >
              <option value="student">Student</option>
              <option value="team_leader">Team Leader</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-card-foreground">Add to Project</label>
            <select
              className="px-4 py-2.5 rounded-[0.625rem] border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-card-foreground"
            >
              <option value="">Select a project...</option>
              <option value="1">Database Management System</option>
              <option value="2">Web Application Development</option>
              <option value="3">Machine Learning Project</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
