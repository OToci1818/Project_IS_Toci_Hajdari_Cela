'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, Badge, Button } from '@/components'
import { useInvites } from '@/contexts/InviteContext'

interface Invite {
  id: string
  projectId: string
  role: string
  inviteStatus: string
  project?: {
    id: string
    title: string
  }
  invitedBy?: {
    id: string
    fullName: string
  }
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const { decrementInviteCount } = useInvites()

  const fetchInvites = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/invites')
      if (response.ok) {
        const data = await response.json()
        setInvites(data.invites)
      }
    } catch (error) {
      console.error('Failed to fetch invites:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvites()
  }, [fetchInvites])

  const handleRespond = async (inviteId: string, accept: boolean) => {
    setRespondingId(inviteId)
    try {
      const response = await fetch(`/api/invites/${inviteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept }),
      })

      if (response.ok) {
        setInvites((prev) => prev.filter((inv) => inv.id !== inviteId))
        decrementInviteCount()
      }
    } catch (error) {
      console.error('Failed to respond to invite:', error)
    } finally {
      setRespondingId(null)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'team_leader':
        return <Badge variant="info">Team Leader</Badge>
      case 'student':
        return <Badge variant="default">Student</Badge>
      case 'professor':
        return <Badge variant="warning">Professor</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-card-foreground">Invites</h1>
        <p className="text-muted-foreground mt-1">
          {invites.length > 0
            ? `You have ${invites.length} pending invitation${invites.length > 1 ? 's' : ''}`
            : 'Manage your project invitations'}
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {!loading && invites.length > 0 && (
        <div className="space-y-4">
          {invites.map((invite) => (
            <Card key={invite.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/20 rounded-[0.625rem] flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">
                        {invite.project?.title || 'Unknown Project'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Invited by {invite.invitedBy?.fullName || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-13">
                    <span className="text-sm text-muted-foreground">Role:</span>
                    {getRoleBadge(invite.role)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => handleRespond(invite.id, true)} disabled={respondingId === invite.id} loading={respondingId === invite.id}>Accept</Button>
                  <button onClick={() => handleRespond(invite.id, false)} disabled={respondingId === invite.id} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[0.625rem] transition-colors disabled:opacity-50" title="Decline invite">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && invites.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No pending invites</h3>
            <p className="text-muted-foreground">When someone invites you to a project, it will appear here.</p>
          </div>
        </Card>
      )}
    </div>
  )
}
