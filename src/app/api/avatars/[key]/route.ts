import { NextResponse } from 'next/server'
import { fileStorageService } from '@/services/FileStorageService'
import path from 'path'

// Map file extensions to MIME types
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

/**
 * GET /api/avatars/[key] - Serve avatar images
 * This endpoint serves avatar images directly from storage without auth
 * (avatars are public by design)
 */
export async function GET(
  request: Request,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params

    // Read file from storage
    const buffer = await fileStorageService.read(key)
    if (!buffer) {
      return NextResponse.json({ error: 'Avatar not found' }, { status: 404 })
    }

    // Determine MIME type from extension
    const ext = path.extname(key).toLowerCase()
    const mimeType = MIME_TYPES[ext] || 'image/jpeg'

    // Return image with caching headers
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      },
    })
  } catch (error) {
    console.error('Get avatar error:', error)
    return NextResponse.json(
      { error: 'Failed to get avatar' },
      { status: 500 }
    )
  }
}
