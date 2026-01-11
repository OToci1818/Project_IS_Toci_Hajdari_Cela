'use client'

import { useState, useRef } from 'react'
import { Card, Badge, Button } from '@/components'

interface SubmissionFile {
  id: string
  filename: string
  filepath: string
  sizeBytes: string
  formattedSize: string
  mimeType: string | null
  createdAt: string
  uploader: {
    id: string
    fullName: string
    email: string
  }
}

interface Submission {
  id: string
  projectId: string
  status: 'draft' | 'submitted' | 'approved' | 'needs_revision'
  description?: string
  submittedAt?: string
  reviewedAt?: string
  reviewComment?: string
  submittedBy?: {
    id: string
    fullName: string
    email: string
  }
  reviewedBy?: {
    id: string
    fullName: string
    email: string
  }
  files: SubmissionFile[]
}

interface SubmissionTabProps {
  projectId: string
  submission: Submission | null
  files: SubmissionFile[]
  currentUserId: string
  isTeamLeader: boolean
  isProfessor: boolean
  onSubmissionUpdate: () => void
}

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return 'file'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'doc'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'sheet'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive'
  return 'file'
}

const FileIcon = ({ type }: { type: string }) => {
  const iconClass = 'w-5 h-5'

  switch (type) {
    case 'image':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    case 'pdf':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    default:
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
  }
}

export default function SubmissionTab({
  projectId,
  submission,
  files,
  currentUserId,
  isTeamLeader,
  isProfessor,
  onSubmissionUpdate,
}: SubmissionTabProps) {
  const [description, setDescription] = useState(submission?.description || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canEdit = isTeamLeader && (!submission || submission.status === 'draft' || submission.status === 'needs_revision')

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="default">Draft</Badge>
      case 'submitted':
        return <Badge variant="info">Submitted</Badge>
      case 'approved':
        return <Badge variant="success">Approved</Badge>
      case 'needs_revision':
        return <Badge variant="warning">Needs Revision</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }

  const handleSaveDescription = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/submission`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      if (response.ok) {
        onSubmissionUpdate()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save description')
      }
    } catch (error) {
      console.error('Failed to save description:', error)
      alert('Failed to save description')
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/projects/${projectId}/submission/files`, {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        onSubmissionUpdate()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Failed to upload file:', error)
      alert('Failed to upload file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    setDeletingFileId(fileId)
    try {
      const response = await fetch(`/api/projects/${projectId}/submission/files/${fileId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onSubmissionUpdate()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
      alert('Failed to delete file')
    } finally {
      setDeletingFileId(null)
    }
  }

  const handleSubmitForReview = async () => {
    if (!confirm('Are you sure you want to submit for review? You cannot make changes after submission unless the professor requests revisions.')) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/submission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit' }),
      })

      if (response.ok) {
        onSubmissionUpdate()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit for review')
      }
    } catch (error) {
      console.error('Failed to submit for review:', error)
      alert('Failed to submit for review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-card-foreground">Submission Status</h2>
          {getStatusBadge(submission?.status)}
        </div>

        {submission?.status === 'submitted' && (
          <p className="text-sm text-muted-foreground">
            Submitted on {formatDate(submission.submittedAt)} by {submission.submittedBy?.fullName}
          </p>
        )}

        {submission?.status === 'approved' && (
          <p className="text-sm text-muted-foreground">
            Approved on {formatDate(submission.reviewedAt)} by {submission.reviewedBy?.fullName}
          </p>
        )}

        {submission?.status === 'needs_revision' && (
          <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-sm font-medium text-warning mb-2">Revision Requested</p>
            {submission.reviewComment && (
              <p className="text-sm text-muted-foreground">{submission.reviewComment}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Reviewed by {submission.reviewedBy?.fullName} on {formatDate(submission.reviewedAt)}
            </p>
          </div>
        )}

        {!submission && (
          <p className="text-sm text-muted-foreground">
            {isTeamLeader
              ? 'Upload your final submission files and submit for review when ready.'
              : 'The team leader has not started the submission yet.'}
          </p>
        )}
      </Card>

      {/* Description */}
      <Card>
        <h2 className="text-lg font-semibold text-card-foreground mb-4">Description</h2>
        {canEdit ? (
          <div className="space-y-4">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-[0.625rem] bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Describe your submission..."
              rows={4}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSaveDescription}
                disabled={saving}
                size="sm"
              >
                {saving ? 'Saving...' : 'Save Description'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            {submission?.description || 'No description provided.'}
          </p>
        )}
      </Card>

      {/* Files */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-card-foreground">Submission Files</h2>
          {canEdit && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                id="submission-file-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                size="sm"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload File
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {files.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-muted-foreground text-sm">
              {canEdit ? 'No files uploaded yet. Upload your submission files above.' : 'No submission files available.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => {
              const iconType = getFileIcon(file.mimeType)
              const isDeleting = deletingFileId === file.id

              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-[0.625rem] border border-border hover:border-primary/30 transition-all"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 bg-primary/10 rounded-[0.5rem] flex items-center justify-center text-primary flex-shrink-0">
                    <FileIcon type={iconType} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-card-foreground text-sm truncate">
                      {file.filename}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span>{file.formattedSize}</span>
                      <span>-</span>
                      <span>{file.uploader.fullName}</span>
                      <span>-</span>
                      <span>{formatDate(file.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <a
                      href={`/api/files/${file.filepath}`}
                      download
                      className="p-2 rounded-[0.5rem] text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      title="Download"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    {canEdit && file.uploader.id === currentUserId && (
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        disabled={isDeleting}
                        className="p-2 rounded-[0.5rem] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
                        title="Delete"
                      >
                        {isDeleting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Submit for Review Button */}
      {isTeamLeader && (submission?.status === 'draft' || submission?.status === 'needs_revision') && files.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitForReview}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Submit for Review
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
