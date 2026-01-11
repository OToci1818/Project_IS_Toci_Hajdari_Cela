import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { fileStorageService } from '@/services/FileStorageService'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * POST /api/users/[id]/avatar - Upload user avatar
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify JWT token
    let decoded: { userId: string; email: string }
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      ) as { userId: string; email: string }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get current user to check role
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Users can only update their own avatar (unless admin)
    if (currentUser.id !== params.id && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      )
    }

    // Get old avatar to delete later
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { avatarUrl: true },
    })

    // Upload new avatar
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await fileStorageService.upload(buffer, file.name, file.type)

    // Use /api/avatars/ endpoint for serving avatars (not /api/files/)
    const avatarUrl = `/api/avatars/${result.key}`

    // Update user with new avatar URL
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    // Delete old avatar if exists
    if (targetUser?.avatarUrl) {
      const oldKey = targetUser.avatarUrl.split('/').pop()
      if (oldKey) {
        await fileStorageService.delete(oldKey)
      }
    }

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'update_avatar',
        resourceType: 'user',
        resourceId: params.id,
      },
    })

    return NextResponse.json({ user, avatarUrl })
  } catch (error) {
    console.error('Upload avatar error:', error)
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/[id]/avatar - Remove user avatar
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify JWT token
    let decoded: { userId: string; email: string }
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      ) as { userId: string; email: string }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get current user to check role
    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Users can only delete their own avatar (unless admin)
    if (currentUser.id !== params.id && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current avatar
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { avatarUrl: true },
    })

    if (targetUser?.avatarUrl) {
      // Delete from storage
      const key = targetUser.avatarUrl.split('/').pop()
      if (key) {
        await fileStorageService.delete(key)
      }
    }

    // Update user to remove avatar URL
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { avatarUrl: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: currentUser.id,
        action: 'remove_avatar',
        resourceType: 'user',
        resourceId: params.id,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Delete avatar error:', error)
    return NextResponse.json(
      { error: 'Failed to delete avatar' },
      { status: 500 }
    )
  }
}
