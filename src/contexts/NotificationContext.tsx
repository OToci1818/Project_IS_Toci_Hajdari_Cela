'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  projectId?: string
  taskId?: string
  createdAt: string
  actor?: {
    id: string
    fullName: string
    avatarUrl?: string
  }
  project?: {
    id: string
    title: string
  }
  task?: {
    id: string
    title: string
  }
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications?limit=50')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/read-all', { method: 'PATCH' })
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setNotifications((prev) => {
          const notification = prev.find((n) => n.id === id)
          if (notification && !notification.isRead) {
            setUnreadCount((count) => Math.max(0, count - 1))
          }
          return prev.filter((n) => n.id !== id)
        })
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }, [])

  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/clear-all', { method: 'DELETE' })
      if (response.ok) {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to clear all notifications:', error)
    }
  }, [])

  // Fetch on mount and trigger scheduled notification check
  useEffect(() => {
    fetchNotifications()

    // Trigger scheduled notification check (for due dates, overdue tasks, etc.)
    // Fire and forget - don't await
    fetch('/api/notifications/check-scheduled', { method: 'POST' }).catch(() => {})
  }, [fetchNotifications])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
