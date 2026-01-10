'use client'

import { useState } from 'react'
import { Button } from '@/components'

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  submitLabel?: string
  initialValue?: string
  onCancel?: () => void
}

export default function CommentForm({
  onSubmit,
  placeholder = 'Write a private note...',
  submitLabel = 'Add Note',
  initialValue = '',
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState(initialValue)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || submitting) return

    try {
      setSubmitting(true)
      await onSubmit(content.trim())
      setContent('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-[0.625rem] border border-input bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px] resize-none"
        disabled={submitting}
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={!content.trim() || submitting} loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
