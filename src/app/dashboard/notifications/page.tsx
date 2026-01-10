'use client'

import { useNotifications } from '@/contexts/NotificationContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type FilterType = 'all' | 'unread' | 'read'

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications, isLoading } = useNotifications()
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>('all')

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'read') return n.isRead
    return true
  })

  // Get the navigation path based on notification type
  const getNavigationPath = (notification: typeof notifications[0]): string | null => {
    const type = notification.type

    // Invite-related notifications go to invites page
    if (type === 'invite_received') {
      return '/dashboard/invites'
    }

    // Task-related notifications go to the project with task
    if (type === 'task_assigned' || type === 'task_completed' || type === 'task_status_changed' ||
        type === 'task_due_approaching' || type === 'task_overdue') {
      if (notification.taskId && notification.projectId) {
        return `/dashboard/projects/${notification.projectId}?task=${notification.taskId}`
      }
    }

    // Project-related notifications go to the project
    if (notification.projectId) {
      return `/dashboard/projects/${notification.projectId}`
    }

    return null
  }

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }

    const path = getNavigationPath(notification)
    if (path) {
      router.push(path)
    }
  }

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    await deleteNotification(notificationId)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
      case 'task_completed':
      case 'task_status_changed':
      case 'task_due_approaching':
      case 'task_overdue':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )
      case 'invite_accepted':
      case 'invite_declined':
      case 'invite_received':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      case 'project_completed':
      case 'project_deadline_approaching':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        )
      case 'member_joined':
      case 'member_left':
      case 'removed_from_project':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      invite_accepted: 'Invite',
      invite_declined: 'Invite',
      invite_received: 'Invite',
      task_assigned: 'Task',
      task_completed: 'Task',
      task_status_changed: 'Task',
      task_due_approaching: 'Task',
      task_overdue: 'Task',
      project_deadline_approaching: 'Project',
      project_completed: 'Project',
      removed_from_project: 'Team',
      member_joined: 'Team',
      member_left: 'Team',
    }
    return labels[type] || 'Notification'
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-[0.625rem] transition-colors"
            >
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-[0.625rem] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'unread', 'read'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-[0.625rem] transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-primary-foreground text-primary">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {isLoading ? (
        <div className="bg-card rounded-[0.625rem] border border-border p-8 text-center">
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-card rounded-[0.625rem] border border-border p-8 text-center">
          <svg className="w-12 h-12 mx-auto text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-muted-foreground">
            {filter === 'all'
              ? 'No notifications yet'
              : filter === 'unread'
              ? 'No unread notifications'
              : 'No read notifications'}
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-[0.625rem] border border-border divide-y divide-border">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`relative group ${!notification.isRead ? 'bg-primary/5' : ''}`}
            >
              <button
                onClick={() => handleNotificationClick(notification)}
                className="w-full p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex gap-4">
                  <div className={`mt-0.5 p-2 rounded-full ${
                    !notification.isRead ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          !notification.isRead ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {getTypeLabel(notification.type)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>
                    <p className={`mt-2 text-sm ${!notification.isRead ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    {notification.project && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Project: {notification.project.title}
                      </p>
                    )}
                  </div>
                  {!notification.isRead && (
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  )}
                </div>
              </button>
              <button
                onClick={(e) => handleDeleteNotification(e, notification.id)}
                className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-destructive/10"
                title="Delete notification"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
