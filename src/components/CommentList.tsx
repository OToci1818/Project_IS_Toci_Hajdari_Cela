'use client'

import { useState } from 'react'
import { Button } from '@/components'
import CommentForm from './CommentForm'

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

interface CommentListProps {
  comments: Comment[]
  currentUserId: string
  onEdit: (commentId: string, content: string) => Promise<void>
  onDelete: (commentId: string) => Promise<void>
}

export default function CommentList({
  comments,
  currentUserId,
  onEdit,
  onDelete,
}: CommentListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  const handleEdit = async (commentId: string, content: string) => {
    await onEdit(commentId, content)
    setEditingId(null)
  }

  const handleDelete = async (commentId: string) => {
    setDeletingId(commentId)
    try {
      await onDelete(commentId)
    } finally {
      setDeletingId(null)
    }
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <p className="text-muted-foreground text-sm">No private notes yet. Add a note to keep track of your thoughts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const isOwn = comment.author.id === currentUserId
        const isEditing = editingId === comment.id
        const isDeleting = deletingId === comment.id
        const wasEdited = comment.updatedAt !== comment.createdAt

        return (
          <div key={comment.id} className="flex gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-semibold text-xs">
                {getInitials(comment.author.fullName)}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-card-foreground text-sm">
                  {comment.author.fullName}
                </span>
                <span className="text-muted-foreground text-xs">
                  {formatRelativeTime(comment.createdAt)}
                  {wasEdited && ' (edited)'}
                </span>
              </div>

              {isEditing ? (
                <CommentForm
                  onSubmit={(content) => handleEdit(comment.id, content)}
                  initialValue={comment.content}
                  submitLabel="Save"
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <p className="text-card-foreground text-sm whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>

                  {/* Actions */}
                  {isOwn && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => setEditingId(comment.id)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={isDeleting}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
