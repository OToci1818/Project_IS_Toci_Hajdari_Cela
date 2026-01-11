import { prisma } from '@/lib/prisma'
import { UserRole as PrismaUserRole, InviteStatus as PrismaInviteStatus } from '@prisma/client'
import { notificationService } from './NotificationService'

export type InviteStatus = 'pending' | 'accepted' | 'declined'

export interface ProjectMemberDetails {
  id: string
  userId: string
  projectId: string
  role: string
  inviteStatus: InviteStatus
  joinedAt?: Date
  user: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string
    role: string
  }
  invitedBy?: {
    id: string
    fullName: string
  }
  project?: {
    id: string
    title: string
  }
  taskStats: {
    assigned: number
    completed: number
  }
}

export interface InviteMemberInput {
  projectId: string
  email: string
  role: string
  invitedById: string
}

/**
 * TeamService handles project-scoped team member management:
 * - Get members of a project
 * - Invite members by email
 * - Accept/decline invites
 * - Update member roles
 * - Remove members
 */
class TeamService {
  /**
   * Get all members of a specific project with task stats.
   */
  async getProjectMembers(projectId: string): Promise<ProjectMemberDetails[]> {
    const members = await prisma.projectUser.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        invitedBy: {
          select: { id: true, fullName: true },
        },
      },
    })

    // Get task stats for each member
    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        const taskStats = await prisma.task.groupBy({
          by: ['status'],
          where: {
            projectId,
            assigneeId: member.userId,
            isDeleted: false,
          },
          _count: { id: true },
        })

        const assigned = taskStats.reduce((sum, t) => sum + t._count.id, 0)
        const completed = taskStats.find((t) => t.status === 'done')?._count.id ?? 0

        return {
          id: member.id,
          userId: member.userId,
          projectId: member.projectId,
          role: member.role,
          inviteStatus: member.inviteStatus as InviteStatus,
          joinedAt: member.joinedAt ?? undefined,
          user: {
            id: member.user.id,
            fullName: member.user.fullName,
            email: member.user.email,
            avatarUrl: member.user.avatarUrl ?? undefined,
            role: member.user.role,
          },
          invitedBy: member.invitedBy
            ? {
                id: member.invitedBy.id,
                fullName: member.invitedBy.fullName,
              }
            : undefined,
          taskStats: { assigned, completed },
        }
      })
    )

    return membersWithStats
  }

  /**
   * Invite a user to a project by email.
   */
  async inviteMember(input: InviteMemberInput): Promise<ProjectMemberDetails | null> {
    const { projectId, email, role, invitedById } = input

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return null // User not found
    }

    // Check if already a member
    const existingMember = await prisma.projectUser.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    })

    if (existingMember) {
      // Already a member or has pending invite
      return null
    }

    // Create invite
    const member = await prisma.projectUser.create({
      data: {
        projectId,
        userId: user.id,
        role: role as PrismaUserRole,
        invitedById,
        inviteStatus: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        invitedBy: {
          select: { id: true, fullName: true },
        },
      },
    })

    // Log activity
    await this.logActivity(invitedById, 'invite_member', 'project', projectId, {
      invitedUserId: user.id,
      invitedEmail: email,
    })

    // Get project title for notification
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true },
    })

    // Send notification to invited user
    if (project && member.invitedBy) {
      await notificationService.notifyInviteReceived(
        user.id,
        { id: member.invitedBy.id, fullName: member.invitedBy.fullName },
        { id: project.id, title: project.title }
      )
    }

    return {
      id: member.id,
      userId: member.userId,
      projectId: member.projectId,
      role: member.role,
      inviteStatus: member.inviteStatus as InviteStatus,
      joinedAt: member.joinedAt ?? undefined,
      user: {
        id: member.user.id,
        fullName: member.user.fullName,
        email: member.user.email,
        avatarUrl: member.user.avatarUrl ?? undefined,
        role: member.user.role,
      },
      invitedBy: member.invitedBy
        ? {
            id: member.invitedBy.id,
            fullName: member.invitedBy.fullName,
          }
        : undefined,
      taskStats: { assigned: 0, completed: 0 },
    }
  }

  /**
   * Accept or decline an invite.
   */
  async respondToInvite(
    projectUserId: string,
    userId: string,
    accept: boolean
  ): Promise<ProjectMemberDetails | null> {
    const member = await prisma.projectUser.findUnique({
      where: { id: projectUserId },
    })

    if (!member || member.userId !== userId) {
      return null
    }

    if (member.inviteStatus !== 'pending') {
      return null // Already responded
    }

    const updated = await prisma.projectUser.update({
      where: { id: projectUserId },
      data: {
        inviteStatus: accept ? 'accepted' : 'declined',
        joinedAt: accept ? new Date() : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        invitedBy: {
          select: { id: true, fullName: true },
        },
        project: {
          select: { id: true, title: true },
        },
      },
    })

    // Log activity
    await this.logActivity(userId, accept ? 'accept_invite' : 'decline_invite', 'project', member.projectId)

    // Send notifications
    if (updated.invitedBy && updated.project) {
      const respondingUser = { id: updated.user.id, fullName: updated.user.fullName }
      const project = { id: updated.project.id, title: updated.project.title }

      if (accept) {
        // Notify inviter that invite was accepted
        await notificationService.notifyInviteAccepted(
          updated.invitedBy.id,
          respondingUser,
          project
        )

        // Notify other project members that a new member joined
        const existingMembers = await prisma.projectUser.findMany({
          where: {
            projectId: member.projectId,
            inviteStatus: 'accepted',
            userId: { not: userId },
          },
          select: { userId: true },
        })
        const memberIds = existingMembers.map((m) => m.userId)

        await notificationService.notifyMemberJoined(
          memberIds,
          respondingUser,
          project
        )
      } else {
        // Notify inviter that invite was declined
        await notificationService.notifyInviteDeclined(
          updated.invitedBy.id,
          respondingUser,
          project
        )
      }
    }

    return {
      id: updated.id,
      userId: updated.userId,
      projectId: updated.projectId,
      role: updated.role,
      inviteStatus: updated.inviteStatus as InviteStatus,
      joinedAt: updated.joinedAt ?? undefined,
      user: {
        id: updated.user.id,
        fullName: updated.user.fullName,
        email: updated.user.email,
        avatarUrl: updated.user.avatarUrl ?? undefined,
        role: updated.user.role,
      },
      invitedBy: updated.invitedBy
        ? {
            id: updated.invitedBy.id,
            fullName: updated.invitedBy.fullName,
          }
        : undefined,
      taskStats: { assigned: 0, completed: 0 },
    }
  }

  /**
   * Update a member's role within a project.
   */
  async updateMemberRole(
    projectUserId: string,
    newRole: string,
    updatedById: string
  ): Promise<ProjectMemberDetails | null> {
    const member = await prisma.projectUser.findUnique({
      where: { id: projectUserId },
    })

    if (!member) {
      return null
    }

    const updated = await prisma.projectUser.update({
      where: { id: projectUserId },
      data: {
        role: newRole as PrismaUserRole,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        invitedBy: {
          select: { id: true, fullName: true },
        },
      },
    })

    // Log activity
    await this.logActivity(updatedById, 'update_member_role', 'project', member.projectId, {
      memberId: member.userId,
      newRole,
    })

    // Get task stats
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId: member.projectId,
        assigneeId: member.userId,
        isDeleted: false,
      },
      _count: { id: true },
    })

    const assigned = taskStats.reduce((sum, t) => sum + t._count.id, 0)
    const completed = taskStats.find((t) => t.status === 'done')?._count.id ?? 0

    return {
      id: updated.id,
      userId: updated.userId,
      projectId: updated.projectId,
      role: updated.role,
      inviteStatus: updated.inviteStatus as InviteStatus,
      joinedAt: updated.joinedAt ?? undefined,
      user: {
        id: updated.user.id,
        fullName: updated.user.fullName,
        email: updated.user.email,
        avatarUrl: updated.user.avatarUrl ?? undefined,
        role: updated.user.role,
      },
      invitedBy: updated.invitedBy
        ? {
            id: updated.invitedBy.id,
            fullName: updated.invitedBy.fullName,
          }
        : undefined,
      taskStats: { assigned, completed },
    }
  }

  /**
   * Remove a member from a project.
   */
  async removeMember(projectUserId: string, removedById: string): Promise<boolean> {
    const member = await prisma.projectUser.findUnique({
      where: { id: projectUserId },
      include: {
        user: {
          select: { id: true, fullName: true },
        },
        project: {
          select: { id: true, title: true },
        },
      },
    })

    if (!member) {
      return false
    }

    // Get remaining members before deletion
    const remainingMembers = await prisma.projectUser.findMany({
      where: {
        projectId: member.projectId,
        inviteStatus: 'accepted',
        userId: { notIn: [member.userId] },
      },
      select: { userId: true },
    })

    // Get the remover's info
    const remover = await prisma.user.findUnique({
      where: { id: removedById },
      select: { id: true, fullName: true },
    })

    await prisma.projectUser.delete({
      where: { id: projectUserId },
    })

    // Log activity
    await this.logActivity(removedById, 'remove_member', 'project', member.projectId, {
      removedUserId: member.userId,
    })

    // Send notifications
    if (member.project && remover) {
      const project = { id: member.project.id, title: member.project.title }
      const removedUser = { id: member.user.id, fullName: member.user.fullName }

      // Notify the removed user
      await notificationService.notifyRemovedFromProject(
        member.userId,
        remover,
        project
      )

      // Notify remaining members that someone was removed
      const memberIds = remainingMembers.map((m) => m.userId)
      await notificationService.notifyMemberLeft(
        memberIds,
        removedUser,
        project,
        true // wasRemoved = true
      )
    }

    return true
  }

  /**
   * Get user's pending invites across all projects.
   */
  async getUserPendingInvites(userId: string): Promise<ProjectMemberDetails[]> {
    const invites = await prisma.projectUser.findMany({
      where: {
        userId,
        inviteStatus: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            role: true,
          },
        },
        invitedBy: {
          select: { id: true, fullName: true },
        },
        project: {
          select: { id: true, title: true },
        },
      },
    })

    return invites.map((invite) => ({
      id: invite.id,
      userId: invite.userId,
      projectId: invite.projectId,
      role: invite.role,
      inviteStatus: invite.inviteStatus as InviteStatus,
      joinedAt: invite.joinedAt ?? undefined,
      user: {
        id: invite.user.id,
        fullName: invite.user.fullName,
        email: invite.user.email,
        avatarUrl: invite.user.avatarUrl ?? undefined,
        role: invite.user.role,
      },
      invitedBy: invite.invitedBy
        ? {
            id: invite.invitedBy.id,
            fullName: invite.invitedBy.fullName,
          }
        : undefined,
      project: invite.project
        ? {
            id: invite.project.id,
            title: invite.project.title,
          }
        : undefined,
      taskStats: { assigned: 0, completed: 0 },
    }))
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
          details: details as object | undefined,
        },
      })
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }
}

// Export a singleton instance
export const teamService = new TeamService()

// Also export the class for testing
export { TeamService }
