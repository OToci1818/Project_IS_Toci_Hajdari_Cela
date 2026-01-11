'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, Badge, Button, Input, Modal } from '@/components'

interface Course {
  id: string
  title: string
  code: string
}

interface Announcement {
  id: string
  courseId: string
  course: Course
  title: string
  content: string
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export default function ProfessorAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [courseFilter, setCourseFilter] = useState('all')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    content: '',
    isPinned: false,
  })
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (courseFilter !== 'all') {
        params.set('courseId', courseFilter)
      }

      const response = await fetch(`/api/professor/announcements?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements)
        setCourses(data.courses)
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setLoading(false)
    }
  }, [courseFilter])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const openCreateModal = () => {
    setEditingAnnouncement(null)
    setFormData({
      courseId: courses[0]?.id || '',
      title: '',
      content: '',
      isPinned: false,
    })
    setShowModal(true)
  }

  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      courseId: announcement.courseId,
      title: announcement.title,
      content: announcement.content,
      isPinned: announcement.isPinned,
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!formData.courseId || !formData.title || !formData.content) {
      alert('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const url = '/api/professor/announcements'
      const method = editingAnnouncement ? 'PUT' : 'POST'
      const body = editingAnnouncement
        ? { id: editingAnnouncement.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        if (editingAnnouncement) {
          setAnnouncements((prev) =>
            prev.map((a) => (a.id === editingAnnouncement.id ? data.announcement : a))
          )
        } else {
          setAnnouncements((prev) => [data.announcement, ...prev])
        }
        setShowModal(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save announcement')
      }
    } catch (error) {
      console.error('Failed to save announcement:', error)
      alert('Failed to save announcement')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/professor/announcements?id=${deleteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== deleteId))
        setDeleteId(null)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete announcement')
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error)
      alert('Failed to delete announcement')
    } finally {
      setDeleting(false)
    }
  }

  const togglePin = async (announcement: Announcement) => {
    try {
      const response = await fetch('/api/professor/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: announcement.id,
          isPinned: !announcement.isPinned,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === announcement.id ? data.announcement : a))
        )
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-card-foreground">Announcements</h1>
          <p className="text-muted-foreground mt-1">Create and manage announcements for your courses</p>
        </div>
        <Button onClick={openCreateModal} disabled={courses.length === 0}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Announcement
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-sm font-medium text-muted-foreground">Filter by Course:</span>
          </div>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-2.5 rounded-[0.625rem] border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[200px]"
          >
            <option value="all">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-card-foreground">{announcements.length}</p>
            <p className="text-sm text-muted-foreground">Total Announcements</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">{announcements.filter((a) => a.isPinned).length}</p>
            <p className="text-sm text-muted-foreground">Pinned</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-info">{courses.length}</p>
            <p className="text-sm text-muted-foreground">Courses</p>
          </div>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Announcements List */}
      {!loading && announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className={announcement.isPinned ? 'border-warning/50' : ''}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {announcement.isPinned && (
                      <svg className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a.75.75 0 01.75.75v5.59l1.95-2.1a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0L6.2 7.26a.75.75 0 111.1-1.02l1.95 2.1V2.75A.75.75 0 0110 2z" />
                        <path d="M5.273 4.5a1.25 1.25 0 00-1.205.918l-1.523 5.52c-.006.02-.01.041-.015.062H6a1 1 0 01.894.553l.448.894a1 1 0 00.894.553h3.528a1 1 0 00.894-.553l.448-.894A1 1 0 0114 10.5h3.47a1.318 1.318 0 00-.015-.062l-1.523-5.52a1.25 1.25 0 00-1.205-.918h-.977a.75.75 0 010-1.5h.977a2.75 2.75 0 012.651 2.019l1.523 5.52c.066.239.099.485.099.732V15a2 2 0 01-2 2H3a2 2 0 01-2-2v-3.73c0-.246.033-.492.099-.73l1.523-5.521A2.75 2.75 0 015.273 3h.977a.75.75 0 010 1.5h-.977z" />
                      </svg>
                    )}
                    <Badge variant="outline">{announcement.course.code}</Badge>
                    <h3 className="text-lg font-semibold text-card-foreground">{announcement.title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-3 whitespace-pre-wrap">{announcement.content}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Posted: {formatDate(announcement.createdAt)}</span>
                    {announcement.updatedAt !== announcement.createdAt && (
                      <span>Updated: {formatDate(announcement.updatedAt)}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePin(announcement)}
                    className={`p-2 rounded-[0.625rem] transition-colors ${
                      announcement.isPinned
                        ? 'text-warning hover:bg-warning/10'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                    title={announcement.isPinned ? 'Unpin' : 'Pin'}
                  >
                    <svg className="w-5 h-5" fill={announcement.isPinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  <Button variant="outline" size="sm" onClick={() => openEditModal(announcement)}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setDeleteId(announcement.id)}>
                    <svg className="w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && announcements.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No announcements yet</h3>
            <p className="text-muted-foreground mb-4">
              {courses.length === 0
                ? 'Create a course first to post announcements'
                : 'Create your first announcement to notify students'}
            </p>
            {courses.length > 0 && (
              <Button onClick={openCreateModal}>
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Announcement
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
      >
        <div className="space-y-4">
          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Course <span className="text-destructive">*</span>
            </label>
            <select
              value={formData.courseId}
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-[0.625rem] bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={!!editingAnnouncement}
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-[0.625rem] bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Announcement title..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Content <span className="text-destructive">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-[0.625rem] bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[150px] resize-none"
              placeholder="Write your announcement..."
            />
          </div>

          {/* Pin Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPinned}
              onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
              className="w-4 h-4 text-primary focus:ring-primary border-border rounded"
            />
            <span className="text-card-foreground">Pin this announcement</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={saving}>
              {editingAnnouncement ? 'Update' : 'Create'} Announcement
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Announcement"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete this announcement? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
