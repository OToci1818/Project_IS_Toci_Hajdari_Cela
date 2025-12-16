import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authService } from '@/services'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sessionId')?.value

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const result = await authService.validateSession(sessionId)

    if (!result.valid) {
      const response = NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
      response.cookies.delete('sessionId')
      return response
    }

    return NextResponse.json({ user: result.user })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
