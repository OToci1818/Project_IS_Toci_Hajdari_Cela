import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authService } from '@/services'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sessionId')?.value

    if (sessionId) {
      await authService.logout(sessionId)
    }

    const response = NextResponse.json({ message: 'Logged out successfully' })
    response.cookies.delete('sessionId')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}
