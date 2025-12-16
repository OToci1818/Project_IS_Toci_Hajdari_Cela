import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authService, taskService } from '@/services'

async function getCurrentUser() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('sessionId')?.value
  if (!sessionId) return null

  const result = await authService.validateSession(sessionId)
  return result.valid ? result.user : null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const history = await taskService.getTaskHistory(id)

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Get task history error:', error)
    return NextResponse.json({ error: 'Failed to fetch task history' }, { status: 500 })
  }
}
