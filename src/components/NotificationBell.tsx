'use client'

import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { useRouter } from 'next/navigation'

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

    setIsOpen(false)
  }

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation() // Prevent triggering the click handler
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
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )
      case 'invite_accepted':
      case 'invite_declined':
      case 'invite_received':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      case 'project_completed':
      case 'project_deadline_approaching':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        )
      case 'member_joined':
      case 'member_left':
      case 'removed_from_project':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-sidebar-muted hover:text-sidebar-foreground transition-colors rounded-[0.625rem] hover:bg-sidebar-foreground/5"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-80 bg-card rounded-[0.625rem] shadow-lg border border-border overflow-hidden z-50">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-card-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-destructive hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`relative group p-3 border-b border-border last:border-b-0 ${
                    !notification.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="w-full text-left hover:bg-muted/50 transition-colors rounded-md -m-1 p-1"
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 ${!notification.isRead ? 'text-primary' : 'text-muted-foreground'}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''} text-card-foreground`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                  <button
                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                    className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-destructive/10"
                    title="Delete notification"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div className="p-2 border-t border-border">
              <button
                onClick={() => {
                  router.push('/dashboard/notifications')
                  setIsOpen(false)
                }}
                className="w-full text-center text-sm text-primary hover:underline py-1"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
