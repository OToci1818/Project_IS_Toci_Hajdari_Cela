import { prisma } from '@/lib/prisma'
import { User } from '@/types'
import crypto from 'crypto'

// Session duration: 7 days in milliseconds
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export interface LoginResult {
  success: boolean
  user?: User
  sessionId?: string
  error?: string
}

export interface SessionValidationResult {
  valid: boolean
  user?: User
  error?: string
}

/**
 * AuthService handles all authentication-related business logic:
 * - User login/logout
 * - Session creation and validation
 * - Password hashing and verification
 */
class AuthService {
  /**
   * Authenticate a user by email and password.
   * Creates a new session on successful authentication.
   */
  async login(
    email: string,
    password: string,
    userAgent?: string,
    ip?: string
  ): Promise<LoginResult> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email, isActive: true, deletedAt: null },
      })

      if (!user) {
        return { success: false, error: 'Invalid email or password' }
      }

      const isValidPassword = this.verifyPassword(password, user.passwordHash)
      if (!isValidPassword) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Create a new session
      const session = await this.createSession(user.id, userAgent, ip)

      // Update last login timestamp
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      })

      // Log the activity
      await this.logActivity(user.id, 'login', 'user', user.id)

      return {
        success: true,
        user: this.mapToUserType(user),
        sessionId: session.id,
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An error occurred during login' }
    }
  }

  /**
   * Logout a user by revoking their session.
   */
  async logout(sessionId: string): Promise<boolean> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      })

      if (!session) {
        return false
      }

      await prisma.session.update({
        where: { id: sessionId },
        data: { revoked: true },
      })

      // Log the activity
      await this.logActivity(session.userId, 'logout', 'session', sessionId)

      return true
    } catch (error) {
      console.error('Logout error:', error)
      return false
    }
  }

  /**
   * Create a new session for a user.
   */
  async createSession(userId: string, userAgent?: string, ip?: string) {
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

    return prisma.session.create({
      data: {
        userId,
        userAgent,
        ip,
        expiresAt,
      },
    })
  }

  /**
   * Validate a session and return the associated user if valid.
   */
  async validateSession(sessionId: string): Promise<SessionValidationResult> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true },
      })

      if (!session) {
        return { valid: false, error: 'Session not found' }
      }

      if (session.revoked) {
        return { valid: false, error: 'Session has been revoked' }
      }

      if (new Date() > session.expiresAt) {
        return { valid: false, error: 'Session has expired' }
      }

      if (!session.user.isActive || session.user.deletedAt) {
        return { valid: false, error: 'User account is inactive' }
      }

      return {
        valid: true,
        user: this.mapToUserType(session.user),
      }
    } catch (error) {
      console.error('Session validation error:', error)
      return { valid: false, error: 'Failed to validate session' }
    }
  }

  /**
   * Revoke all sessions for a user (useful for password changes, security issues).
   */
  async revokeAllUserSessions(userId: string): Promise<number> {
    const result = await prisma.session.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    })

    await this.logActivity(userId, 'revoke_all_sessions', 'user', userId)

    return result.count
  }

  /**
   * Hash a password using PBKDF2 with a random salt.
   * Returns the salt and hash combined as: salt:hash
   */
  hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
      .toString('hex')
    return `${salt}:${hash}`
  }

  /**
   * Verify a password against a stored hash.
   */
  verifyPassword(password: string, storedHash: string): boolean {
    const [salt, hash] = storedHash.split(':')
    if (!salt || !hash) return false

    const verifyHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
      .toString('hex')
    return hash === verifyHash
  }

  /**
   * Get user by ID (for internal use).
   */
  async getUserById(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true, deletedAt: null },
    })

    return user ? this.mapToUserType(user) : null
  }

  /**
   * Log activity for audit purposes.
   */
  private async logActivity(
    userId: string,
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, unknown>
  ) {
    try {
      await prisma.activityLog.create({
        data: {
          userId,
          action,
          resourceType,
          resourceId,
          details: details ?? undefined,
        },
      })
    } catch (error) {
      // Don't fail the main operation if logging fails
      console.error('Failed to log activity:', error)
    }
  }

  /**
   * Map Prisma User to our User type.
   */
  private mapToUserType(user: {
    id: string
    email: string
    fullName: string
    role: string
    avatarUrl: string | null
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    lastLoginAt: Date | null
  }): User {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as User['role'],
      avatarUrl: user.avatarUrl ?? undefined,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt ?? undefined,
    }
  }
}

// Export a singleton instance
export const authService = new AuthService()

// Also export the class for testing
export { AuthService }
