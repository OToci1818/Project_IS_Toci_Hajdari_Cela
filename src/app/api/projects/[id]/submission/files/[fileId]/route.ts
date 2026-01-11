import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { fileStorageService } from '@/services'
import jwt from 'jsonwebtoken'

async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    ) as { userId: string; email: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })
    return user ?? null
  } catch {
    return null
  }
}

// DELETE /api/projects/[id]/submission/files/[fileId] - Delete a submission file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: projectId, fileId } = await params

    // Check project and user is team leader
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.teamLeaderId !== user.id) {
      return NextResponse.json(
        { error: 'Only the team leader can delete submission files' },
        { status: 403 }
      )
    }

    // Find the file
    const file = await prisma.finalSubmissionFile.findUnique({
      where: { id: fileId },
      include: {
        submission: true,
      },
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check file belongs to this project's submission
    if (file.submission.projectId !== projectId) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Cannot delete from approved submission
    if (file.submission.status === 'approved') {
      return NextResponse.json(
        { error: 'Cannot delete files from an approved submission' },
        { status: 400 }
      )
    }

    // Delete from storage
    try {
      await fileStorageService.delete(file.filepath)
    } catch (storageError) {
      console.error('Failed to delete file from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await prisma.finalSubmissionFile.delete({
      where: { id: fileId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete submission file error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
