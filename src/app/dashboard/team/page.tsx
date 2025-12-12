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
    { label: 'Total Members', value: members.length, icon: '👥' },
    { label: 'Team Leaders', value: members.filter((m) => m.role === 'team_leader').length, icon: '👑' },
    { label: 'Students', value: members.filter((m) => m.role === 'student').length, icon: '🎓' },
    { label: 'Professors', value: members.filter((m) => m.role === 'professor').length, icon: '📚' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Team</h1>
          <p className="text-[#64748B] mt-1">Manage your team members</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Invite Member
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-xl font-bold text-[#1E293B]">{stat.value}</p>
                <p className="text-xs text-[#64748B]">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6">
        {['all', 'team_leader', 'student', 'professor'].map((role) => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === role
                ? 'bg-[#1A73E8] text-white'
                : 'bg-gray-100 text-[#64748B] hover:bg-gray-200'
            }`}
          >
            {role === 'all' ? 'All' : role === 'team_leader' ? 'Team Leaders' : role.charAt(0).toUpperCase() + role.slice(1) + 's'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map((member) => (
          <Card key={member.id} hoverable>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#1A73E8]/10 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-[#1A73E8]">
                    {member.initials}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1E293B]">{member.name}</h3>
                  <p className="text-sm text-[#64748B]">{member.email}</p>
                </div>
              </div>
              {getStatusBadge(member.status)}
            </div>

            <div className="flex items-center gap-2 mb-4">
              {getRoleBadge(member.role)}
            </div>

            {member.role !== 'professor' && (
              <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-[#F7F9FC] rounded-lg">
                <div className="text-center">
                  <p className="text-lg font-bold text-[#1E293B]">{member.tasksAssigned}</p>
                  <p className="text-xs text-[#64748B]">Assigned</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#34A853]">{member.tasksCompleted}</p>
                  <p className="text-xs text-[#64748B]">Completed</p>
                </div>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs text-[#64748B] mb-2">Projects:</p>
              <div className="flex flex-wrap gap-1">
                {member.projects.length > 0 ? (
                  member.projects.slice(0, 2).map((project, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-gray-100 text-[#64748B] px-2 py-1 rounded"
                    >
                      {project.length > 20 ? project.substring(0, 20) + '...' : project}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#64748B]">No projects yet</span>
                )}
                {member.projects.length > 2 && (
                  <span className="text-xs bg-gray-100 text-[#64748B] px-2 py-1 rounded">
                    +{member.projects.length - 2} more
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <span className="text-xs text-[#64748B]">Joined: {member.joinedAt}</span>
              <button className="text-[#1A73E8] text-sm hover:underline">
                View Profile
              </button>
            </div>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card className="text-center py-12">
          <svg className="w-12 h-12 text-[#64748B] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-[#1E293B] mb-2">No members found</h3>
          <p className="text-[#64748B]">Try adjusting your filter</p>
        </Card>
      )}

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
          />
          <p className="text-xs text-[#64748B]">
            Only @fti.edu.al emails can be invited to join the team.
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1E293B]">Role</label>
            <select
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/20 focus:border-[#1A73E8]"
            >
              <option value="student">Student</option>
              <option value="team_leader">Team Leader</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#1E293B]">Add to Project</label>
            <select
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/20 focus:border-[#1A73E8]"
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
