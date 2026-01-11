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

function formatFileSize(bytes: bigint): string {
  const size = Number(bytes)
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

// GET /api/projects/[id]/submission/files - Get submission files
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: projectId } = await params

    // Check if user can access this project
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      include: {
        members: {
          where: { userId: user.id, inviteStatus: 'accepted' },
        },
        course: {
          select: { professorId: true },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check access: team leader, member, or professor
    const canAccess =
      project.teamLeaderId === user.id ||
      project.members.length > 0 ||
      project.course?.professorId === user.id

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get submission with files
    const submission = await prisma.finalSubmission.findUnique({
      where: { projectId },
      include: {
        files: {
          include: {
            uploader: {
              select: { id: true, fullName: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!submission) {
      return NextResponse.json({ files: [] })
    }

    // Serialize BigInt and format file size
    const serializedFiles = submission.files.map((file) => ({
      id: file.id,
      filename: file.filename,
      filepath: file.filepath,
      sizeBytes: file.sizeBytes.toString(),
      formattedSize: formatFileSize(file.sizeBytes),
      mimeType: file.mimeType,
      createdAt: file.createdAt.toISOString(),
      uploader: file.uploader,
    }))

    return NextResponse.json({ files: serializedFiles })
  } catch (error) {
    console.error('Get submission files error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submission files' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/submission/files - Upload a submission file
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: projectId } = await params

    // Check project and user is team leader
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.teamLeaderId !== user.id) {
      return NextResponse.json(
        { error: 'Only the team leader can upload submission files' },
        { status: 403 }
      )
    }

    // Check if submission exists and is not approved
    let submission = await prisma.finalSubmission.findUnique({
      where: { projectId },
    })

    if (submission?.status === 'approved') {
      return NextResponse.json(
        { error: 'Cannot add files to an approved submission' },
        { status: 400 }
      )
    }

    // Create draft submission if none exists
    if (!submission) {
      submission = await prisma.finalSubmission.create({
        data: {
          projectId,
          description: '',
          status: 'draft',
        },
      })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size
    const maxSize = fileStorageService.getMaxFileSize()
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }

    // Upload file
    const buffer = Buffer.from(await file.arrayBuffer())
    const uploadResult = await fileStorageService.upload(
      buffer,
      file.name,
      file.type || 'application/octet-stream'
    )

    // Create file record
    const submissionFile = await prisma.finalSubmissionFile.create({
      data: {
        submissionId: submission.id,
        filename: file.name,
        filepath: uploadResult.key,
        sizeBytes: BigInt(file.size),
        mimeType: file.type || null,
        uploadedBy: user.id,
      },
      include: {
        uploader: {
          select: { id: true, fullName: true, email: true },
        },
      },
    })

    return NextResponse.json({
      file: {
        id: submissionFile.id,
        filename: submissionFile.filename,
        filepath: submissionFile.filepath,
        sizeBytes: submissionFile.sizeBytes.toString(),
        formattedSize: formatFileSize(submissionFile.sizeBytes),
        mimeType: submissionFile.mimeType,
        createdAt: submissionFile.createdAt.toISOString(),
        uploader: submissionFile.uploader,
      },
    })
  } catch (error) {
    console.error('Upload submission file error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
