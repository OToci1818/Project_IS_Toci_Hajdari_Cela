'use client'

import { useState } from 'react'

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
  task?: {
    id: string
    title: string
  }
}

interface FileListProps {
  files: FileItem[]
  currentUserId: string
  onDelete: (fileKey: string) => Promise<void>
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

export default function FileList({ files, currentUserId, onDelete }: FileListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleDelete = async (file: FileItem) => {
    if (!file.s3Key) return
    setDeletingId(file.id)
    try {
      await onDelete(file.s3Key)
    } finally {
      setDeletingId(null)
    }
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-muted-foreground text-sm">No files uploaded yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {files.map((file) => {
        const isOwn = file.uploader.id === currentUserId
        const isDeleting = deletingId === file.id
        const iconType = getFileIcon(file.mimeType)

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
                <span>•</span>
                <span>{file.uploader.fullName}</span>
                <span>•</span>
                <span>{formatDate(file.createdAt)}</span>
                {file.task && (
                  <>
                    <span>•</span>
                    <span className="text-primary">{file.task.title}</span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {file.s3Key && (
                <a
                  href={`/api/files/${file.s3Key}`}
                  download
                  className="p-2 rounded-[0.5rem] text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                  title="Download"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              )}
              {isOwn && (
                <button
                  onClick={() => handleDelete(file)}
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
  )
}
