'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal, Badge, CommentList, CommentForm, FileUpload, FileList } from '@/components'

interface Task {
  id: string
  title: string
  description?: string
  status: 'to_do' | 'in_progress' | 'done' | 'archived'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  project?: {
    id: string
    title: string
  }
  assignee?: {
    id: string
    fullName: string
  }
}

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  author: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string
  }
}

interface FileItem {
  id: string
  filename: string
  s3Key: string | null
  sizeBytes: string
  formattedSize: string
  mimeType: string | null
  createdAt: string
  uploader: {
    id: string
    fullName: string
  }
}

interface TaskDetailModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  currentUserId: string
  onStatusChange?: (taskId: string, newStatus: string) => void
}

export default function TaskDetailModal({
  task,
  isOpen,
  onClose,
  currentUserId,
  onStatusChange,
}: TaskDetailModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string>(task?.status || 'to_do')

  const fetchComments = useCallback(async () => {
    if (!task) return

    try {
      setLoadingComments(true)
      const response = await fetch(`/api/tasks/${task.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }, [task])

  const fetchFiles = useCallback(async () => {
    if (!task) return

    try {
      setLoadingFiles(true)
      const response = await fetch(`/api/tasks/${task.id}/files`)
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files)
      }
    } catch (error) {
      console.error('Failed to fetch files:', error)
    } finally {
      setLoadingFiles(false)
    }
  }, [task])

  useEffect(() => {
    if (isOpen && task) {
      fetchComments()
      fetchFiles()
      setCurrentStatus(task.status)
    } else {
      setComments([])
      setFiles([])
    }
  }, [isOpen, task, fetchComments, fetchFiles])

  const handleMarkAsDone = async () => {
    if (!task) return
    setUpdatingStatus(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      })
      if (response.ok) {
        setCurrentStatus('done')
        if (onStatusChange) {
          onStatusChange(task.id, 'done')
        }
      }
    } catch (error) {
      console.error('Failed to update task status:', error)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleAddComment = async (content: string) => {
    if (!task) return

    const response = await fetch(`/api/tasks/${task.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (response.ok) {
      const data = await response.json()
      setComments((prev) => [...prev, data.comment])
    }
  }

  const handleEditComment = async (commentId: string, content: string) => {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })

    if (response.ok) {
      const data = await response.json()
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? data.comment : c))
      )
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    }
  }

  const handleUploadFile = async (file: File) => {
    if (!task) return

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`/api/tasks/${task.id}/files`, {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const data = await response.json()
      setFiles((prev) => [data.file, ...prev])
    } else {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }
  }

  const handleDeleteFile = async (fileKey: string) => {
    const response = await fetch(`/api/files/${fileKey}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setFiles((prev) => prev.filter((f) => f.s3Key !== fileKey))
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="danger">High Priority</Badge>
      case 'medium':
        return <Badge variant="warning">Medium Priority</Badge>
      case 'low':
        return <Badge variant="default">Low Priority</Badge>
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'to_do':
        return <Badge variant="outline">To Do</Badge>
      case 'in_progress':
        return <Badge variant="info">In Progress</Badge>
      case 'done':
        return <Badge variant="success">Done</Badge>
      case 'archived':
        return <Badge variant="default">Archived</Badge>
      default:
        return null
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (!task) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.title} size="lg">
      <div className="space-y-6">
        {/* Task Info */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(currentStatus)}
              {getPriorityBadge(task.priority)}
            </div>
            {currentStatus !== 'done' && (
              <button
                onClick={handleMarkAsDone}
                disabled={updatingStatus}
                className="flex items-center gap-2 px-4 py-2 bg-success text-success-foreground rounded-[0.625rem] font-medium text-sm hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingStatus ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                Mark as Done
              </button>
            )}
          </div>

          {task.description && (
            <p className="text-card-foreground mb-4">{task.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {task.project && (
              <div>
                <span className="text-muted-foreground">Project:</span>
                <p className="font-medium text-card-foreground">{task.project.title}</p>
              </div>
            )}
            {task.assignee && (
              <div>
                <span className="text-muted-foreground">Assigned to:</span>
                <p className="font-medium text-card-foreground">{task.assignee.fullName}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Due date:</span>
              <p className="font-medium text-card-foreground">{formatDate(task.dueDate)}</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Private Notes Section */}
        <div>
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Private Notes ({comments.length})
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Only you can see these notes.
          </p>

          {loadingComments ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <CommentList
                comments={comments}
                currentUserId={currentUserId}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />

              <div className="border-t border-border pt-4">
                <CommentForm onSubmit={handleAddComment} />
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Files Section */}
        <div>
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Attachments ({files.length})
          </h3>

          {loadingFiles ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <FileUpload onUpload={handleUploadFile} />
              <FileList
                files={files}
                currentUserId={currentUserId}
                onDelete={handleDeleteFile}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
