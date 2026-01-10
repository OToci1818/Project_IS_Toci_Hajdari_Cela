'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, Badge, Button, Modal, Input } from '@/components'

interface Project {
  id: string
  title: string
}

interface Member {
  id: string
  userId: string
  projectId: string
  role: string
  inviteStatus: string
  joinedAt?: string
  user: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string
    role: string
  }
  invitedBy?: {
    id: string
    fullName: string
  }
  taskStats: {
    assigned: number
    completed: number
  }
}

export default function TeamPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('student')
  const [inviting, setInviting] = useState(false)
  const [filter, setFilter] = useState('all')

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects)
          if (data.projects.length > 0) {
            setSelectedProjectId(data.projects[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  // Fetch members when project changes
  const fetchMembers = useCallback(async () => {
    if (!selectedProjectId) {
      setMembers([])
      return
    }

    try {
      setLoadingMembers(true)
      const response = await fetch(`/api/projects/${selectedProjectId}/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members)
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    } finally {
      setLoadingMembers(false)
    }
  }, [selectedProjectId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleInvite = async () => {
    if (!inviteEmail || !selectedProjectId) return

    try {
      setInviting(true)
      const response = await fetch(`/api/projects/${selectedProjectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      if (response.ok) {
        setShowInviteModal(false)
        setInviteEmail('')
        setInviteRole('student')
        fetchMembers()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to invite member')
      }
    } catch (error) {
      console.error('Failed to invite member:', error)
    } finally {
      setInviting(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

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
      case 'accepted':
        return <Badge variant="success">Active</Badge>
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'declined':
        return <Badge variant="danger">Declined</Badge>
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
      label: 'Pending',
      value: members.filter((m) => m.inviteStatus === 'pending').length,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'destructive'
    },
  ]

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Pending'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-card-foreground">Team</h1>
          <p className="text-muted-foreground mt-1">Manage your project team members</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)} disabled={!selectedProjectId}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Invite Member
        </Button>
      </div>

      {/* Project Selector */}
      {projects.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-card-foreground">Select Project:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-[0.625rem] border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-card-foreground"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        </Card>
      )}

      {projects.length === 0 && (
        <div className="empty-state">
          <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-card-foreground mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">Create a project first to manage team members</p>
        </div>
      )}

      {selectedProjectId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <div className="flex items-center gap-3">
                  <div className={`stats-icon stats-icon-${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-card-foreground">
                      {loadingMembers ? '...' : stat.value}
                    </p>
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

          {/* Loading Members */}
          {loadingMembers && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Members Grid */}
          {!loadingMembers && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member) => (
                <Card key={member.id} hoverable>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {getInitials(member.user.fullName)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-card-foreground truncate">{member.user.fullName}</h3>
                        <p className="text-sm text-muted-foreground truncate">{member.user.email}</p>
                      </div>
                    </div>
                    {getStatusBadge(member.inviteStatus)}
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    {getRoleBadge(member.role)}
                  </div>

                  {member.inviteStatus === 'accepted' && (
                    <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted/50 rounded-[0.625rem]">
                      <div className="text-center">
                        <p className="text-lg font-bold text-card-foreground">{member.taskStats.assigned}</p>
                        <p className="text-xs text-muted-foreground">Assigned</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-success">{member.taskStats.completed}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                    </div>
                  )}

                  {member.invitedBy && member.inviteStatus === 'pending' && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-[0.625rem]">
                      <p className="text-xs text-muted-foreground">
                        Invited by {member.invitedBy.fullName}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Joined: {formatDate(member.joinedAt)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loadingMembers && filteredMembers.length === 0 && (
            <div className="empty-state">
              <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">No members found</h3>
              <p className="text-muted-foreground mb-4">
                {members.length === 0
                  ? 'Invite team members to get started'
                  : 'Try adjusting your filter'}
              </p>
              {members.length === 0 ? (
                <Button onClick={() => setShowInviteModal(true)}>Invite Member</Button>
              ) : (
                <Button onClick={() => setFilter('all')}>Clear Filter</Button>
              )}
            </div>
          )}
        </>
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
            <Button onClick={handleInvite} loading={inviting}>
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
            The user must already have an account in the system.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-card-foreground">Role in Project</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-4 py-2.5 rounded-[0.625rem] border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-card-foreground"
            >
              <option value="student">Student</option>
              <option value="team_leader">Team Leader</option>
            </select>
          </div>
          <div className="p-3 bg-muted/50 rounded-[0.625rem]">
            <p className="text-sm text-muted-foreground">
              Inviting to: <span className="font-medium text-card-foreground">
                {projects.find((p) => p.id === selectedProjectId)?.title}
              </span>
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
