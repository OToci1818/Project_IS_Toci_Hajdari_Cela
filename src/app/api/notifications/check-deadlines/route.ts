import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { notificationService } from '@/services/NotificationService'

/**
 * POST /api/notifications/check-deadlines
 * Triggers deadline checks for tasks due today and tomorrow
 * Called on dashboard load to ensure users see deadline reminders
 */
export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify JWT token
    try {
      jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-in-production'
      )
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Run deadline checks
    const [dueTodayCount, dueTomorrowCount] = await Promise.all([
      notificationService.checkTasksDueToday(),
      notificationService.checkTasksDueApproaching(),
    ])

    return NextResponse.json({
      success: true,
      notifications: {
        dueToday: dueTodayCount,
        dueTomorrow: dueTomorrowCount,
      },
    })
  } catch (error) {
    console.error('Check deadlines error:', error)
    return NextResponse.json(
      { error: 'Failed to check deadlines' },
      { status: 500 }
    )
  }
}
