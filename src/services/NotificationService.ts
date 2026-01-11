import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  projectId?: string
  taskId?: string
  actorId?: string
  metadata?: Record<string, unknown>
}

export interface NotificationWithDetails {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  projectId?: string
  taskId?: string
  createdAt: Date
  readAt?: Date
  actor?: {
    id: string
    fullName: string
    avatarUrl?: string
  }
  project?: {
    id: string
    title: string
  }
  task?: {
    id: string
    title: string
  }
}

/**
 * NotificationService handles all notification-related operations:
 * - Creating notifications (single and bulk)
 * - Fetching user notifications
 * - Marking notifications as read
 * - Scheduled notification checks for due dates
 */
class NotificationService {
  /**
   * Create a single notification
   */
  async createNotification(input: CreateNotificationInput): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        projectId: input.projectId,
        taskId: input.taskId,
        actorId: input.actorId,
        metadata: input.metadata as object | undefined,
      },
    })
  }

  /**
   * Create notifications for multiple users (bulk)
   */
  async createBulkNotifications(
    userIds: string[],
    data: Omit<CreateNotificationInput, 'userId'>
  ): Promise<void> {
    if (userIds.length === 0) return

    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        projectId: data.projectId,
        taskId: data.taskId,
        actorId: data.actorId,
        metadata: data.metadata as object | undefined,
      })),
    })
  }

  /**
   * Get notifications for a user with pagination
   */
  async getUserNotifications(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ): Promise<{ notifications: NotificationWithDetails[]; unreadCount: number }> {
    const { limit = 20, offset = 0, unreadOnly = false } = options

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
          ...(unreadOnly && { isRead: false }),
        },
        include: {
          actor: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          project: {
            select: { id: true, title: true },
          },
          task: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ])

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        projectId: n.projectId ?? undefined,
        taskId: n.taskId ?? undefined,
        createdAt: n.createdAt,
        readAt: n.readAt ?? undefined,
        actor: n.actor
          ? {
              id: n.actor.id,
              fullName: n.actor.fullName,
              avatarUrl: n.actor.avatarUrl ?? undefined,
            }
          : undefined,
        project: n.project
          ? { id: n.project.id, title: n.project.title }
          : undefined,
        task: n.task
          ? { id: n.task.id, title: n.task.title }
          : undefined,
      })),
      unreadCount,
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    })
    return result.count > 0
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })
    return result.count
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    })
  }

  /**
   * Delete old notifications (for cleanup)
   */
  async deleteOldNotifications(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    })
    return result.count
  }

  /**
   * Delete a single notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    const result = await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    })
    return result.count > 0
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: { userId },
    })
    return result.count
  }

  // ==========================================
  // HELPER METHODS FOR SPECIFIC NOTIFICATION TYPES
  // ==========================================

  /**
   * Notify when invite is accepted
   */
  async notifyInviteAccepted(
    inviterId: string,
    acceptingUser: { id: string; fullName: string },
    project: { id: string; title: string }
  ): Promise<void> {
    await this.createNotification({
      userId: inviterId,
      type: 'invite_accepted',
      title: 'Invite Accepted',
      message: `${acceptingUser.fullName} accepted your invite to join "${project.title}"`,
      projectId: project.id,
      actorId: acceptingUser.id,
    })
  }

  /**
   * Notify when invite is declined
   */
  async notifyInviteDeclined(
    inviterId: string,
    decliningUser: { id: string; fullName: string },
    project: { id: string; title: string }
  ): Promise<void> {
    await this.createNotification({
      userId: inviterId,
      type: 'invite_declined',
      title: 'Invite Declined',
      message: `${decliningUser.fullName} declined your invite to join "${project.title}"`,
      projectId: project.id,
      actorId: decliningUser.id,
    })
  }

  /**
   * Notify when new invite is received
   */
  async notifyInviteReceived(
    invitedUserId: string,
    inviter: { id: string; fullName: string },
    project: { id: string; title: string }
  ): Promise<void> {
    await this.createNotification({
      userId: invitedUserId,
      type: 'invite_received',
      title: 'New Project Invite',
      message: `${inviter.fullName} invited you to join "${project.title}"`,
      projectId: project.id,
      actorId: inviter.id,
    })
  }

  /**
   * Notify when task is assigned
   */
  async notifyTaskAssigned(
    assigneeId: string,
    assigner: { id: string; fullName: string },
    task: { id: string; title: string },
    project: { id: string; title: string }
  ): Promise<void> {
    await this.createNotification({
      userId: assigneeId,
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `${assigner.fullName} assigned you the task "${task.title}" in "${project.title}"`,
      projectId: project.id,
      taskId: task.id,
      actorId: assigner.id,
    })
  }

  /**
   * Notify when task is completed
   */
  async notifyTaskCompleted(
    recipientIds: string[],
    completedBy: { id: string; fullName: string },
    task: { id: string; title: string },
    project: { id: string; title: string }
  ): Promise<void> {
    // Filter out the person who completed the task
    const filteredRecipients = recipientIds.filter((id) => id !== completedBy.id)

    if (filteredRecipients.length === 0) return

    await this.createBulkNotifications(filteredRecipients, {
      type: 'task_completed',
      title: 'Task Completed',
      message: `${completedBy.fullName} completed the task "${task.title}" in "${project.title}"`,
      projectId: project.id,
      taskId: task.id,
      actorId: completedBy.id,
    })
  }

  /**
   * Notify when task status changes
   */
  async notifyTaskStatusChanged(
    recipientIds: string[],
    changedBy: { id: string; fullName: string },
    task: { id: string; title: string },
    project: { id: string; title: string },
    newStatus: string
  ): Promise<void> {
    const filteredRecipients = recipientIds.filter((id) => id !== changedBy.id)

    if (filteredRecipients.length === 0) return

    const statusDisplay = newStatus.replace('_', ' ')
    await this.createBulkNotifications(filteredRecipients, {
      type: 'task_status_changed',
      title: 'Task Status Updated',
      message: `${changedBy.fullName} changed "${task.title}" status to ${statusDisplay}`,
      projectId: project.id,
      taskId: task.id,
      actorId: changedBy.id,
      metadata: { newStatus },
    })
  }

  /**
   * Notify when task due date is approaching (1 day before)
   */
  async notifyTaskDueApproaching(
    assigneeId: string,
    task: { id: string; title: string; dueDate: Date },
    project: { id: string; title: string }
  ): Promise<void> {
    await this.createNotification({
      userId: assigneeId,
      type: 'task_due_approaching',
      title: 'Task Due Tomorrow',
      message: `The task "${task.title}" in "${project.title}" is due tomorrow`,
      projectId: project.id,
      taskId: task.id,
      metadata: { dueDate: task.dueDate.toISOString() },
    })
  }

  /**
   * Notify when task is due today
   */
  async notifyTaskDueToday(
    assigneeId: string,
    task: { id: string; title: string; dueDate: Date },
    project: { id: string; title: string }
  ): Promise<void> {
    await this.createNotification({
      userId: assigneeId,
      type: 'task_due_approaching',
      title: 'Task Due Today',
      message: `The task "${task.title}" in "${project.title}" is due today!`,
      projectId: project.id,
      taskId: task.id,
      metadata: { dueDate: task.dueDate.toISOString(), dueToday: true },
    })
  }

  /**
   * Notify when task is overdue
   */
  async notifyTaskOverdue(
    recipientIds: string[],
    task: { id: string; title: string; dueDate: Date },
    project: { id: string; title: string }
  ): Promise<void> {
    await this.createBulkNotifications(recipientIds, {
      type: 'task_overdue',
      title: 'Task Overdue',
      message: `The task "${task.title}" in "${project.title}" is overdue`,
      projectId: project.id,
      taskId: task.id,
      metadata: { dueDate: task.dueDate.toISOString() },
    })
  }

  /**
   * Notify when project deadline is approaching
   */
  async notifyProjectDeadlineApproaching(
    memberIds: string[],
    project: { id: string; title: string; deadlineDate: Date }
  ): Promise<void> {
    await this.createBulkNotifications(memberIds, {
      type: 'project_deadline_approaching',
      title: 'Project Deadline Approaching',
      message: `The project "${project.title}" deadline is in 3 days`,
      projectId: project.id,
      metadata: { deadlineDate: project.deadlineDate.toISOString() },
    })
  }

  /**
   * Notify when project is completed
   */
  async notifyProjectCompleted(
    memberIds: string[],
    completedBy: { id: string; fullName: string },
    project: { id: string; title: string }
  ): Promise<void> {
    const filteredMembers = memberIds.filter((id) => id !== completedBy.id)

    if (filteredMembers.length === 0) return

    await this.createBulkNotifications(filteredMembers, {
      type: 'project_completed',
      title: 'Project Completed',
      message: `${completedBy.fullName} marked the project "${project.title}" as completed`,
      projectId: project.id,
      actorId: completedBy.id,
    })
  }

  /**
   * Notify when user is removed from project
   */
  async notifyRemovedFromProject(
    removedUserId: string,
    removedBy: { id: string; fullName: string },
    project: { id: string; title: string }
  ): Promise<void> {
    await this.createNotification({
      userId: removedUserId,
      type: 'removed_from_project',
      title: 'Removed from Project',
      message: `You have been removed from the project "${project.title}"`,
      projectId: project.id,
      actorId: removedBy.id,
    })
  }

  /**
   * Notify when new member joins
   */
  async notifyMemberJoined(
    memberIds: string[],
    newMember: { id: string; fullName: string },
    project: { id: string; title: string }
  ): Promise<void> {
    const filteredMembers = memberIds.filter((id) => id !== newMember.id)

    if (filteredMembers.length === 0) return

    await this.createBulkNotifications(filteredMembers, {
      type: 'member_joined',
      title: 'New Team Member',
      message: `${newMember.fullName} joined the project "${project.title}"`,
      projectId: project.id,
      actorId: newMember.id,
    })
  }

  /**
   * Notify when member leaves/removed
   */
  async notifyMemberLeft(
    memberIds: string[],
    leftMember: { id: string; fullName: string },
    project: { id: string; title: string },
    wasRemoved: boolean = false
  ): Promise<void> {
    const filteredMembers = memberIds.filter((id) => id !== leftMember.id)

    if (filteredMembers.length === 0) return

    await this.createBulkNotifications(filteredMembers, {
      type: 'member_left',
      title: wasRemoved ? 'Member Removed' : 'Member Left',
      message: `${leftMember.fullName} ${wasRemoved ? 'was removed from' : 'left'} the project "${project.title}"`,
      projectId: project.id,
      metadata: { wasRemoved },
    })
  }

  /**
   * Notify when project is graded
   */
  async notifyProjectGraded(
    memberIds: string[],
    professor: { id: string; fullName: string },
    project: { id: string; title: string },
    grade: string
  ): Promise<void> {
    await this.createBulkNotifications(memberIds, {
      type: 'project_graded',
      title: 'Project Graded',
      message: `Professor ${professor.fullName} graded your project "${project.title}": ${grade}`,
      projectId: project.id,
      actorId: professor.id,
      metadata: { grade },
    })
  }

  /**
   * Notify when submission is reviewed
   */
  async notifySubmissionReviewed(
    memberIds: string[],
    professor: { id: string; fullName: string },
    project: { id: string; title: string },
    status: 'approved' | 'needs_revision',
    comment?: string
  ): Promise<void> {
    const statusText = status === 'approved' ? 'approved' : 'requires revision'
    await this.createBulkNotifications(memberIds, {
      type: 'submission_reviewed',
      title: status === 'approved' ? 'Submission Approved' : 'Revision Requested',
      message: `Professor ${professor.fullName} ${statusText} your submission for "${project.title}"${comment ? `: "${comment}"` : ''}`,
      projectId: project.id,
      actorId: professor.id,
      metadata: { status, comment },
    })
  }

  /**
   * Notify professor when submission is submitted
   */
  async notifySubmissionReceived(
    professorId: string,
    submitter: { id: string; fullName: string },
    project: { id: string; title: string },
    course: { id: string; title: string }
  ): Promise<void> {
    await this.createNotification({
      userId: professorId,
      type: 'submission_received',
      title: 'New Submission',
      message: `${submitter.fullName} submitted "${project.title}" from ${course.title} for review`,
      projectId: project.id,
      actorId: submitter.id,
    })
  }

  /**
   * Notify when professor posts a review
   */
  async notifyReviewPosted(
    memberIds: string[],
    professor: { id: string; fullName: string },
    project: { id: string; title: string }
  ): Promise<void> {
    await this.createBulkNotifications(memberIds, {
      type: 'review_posted',
      title: 'New Review',
      message: `Professor ${professor.fullName} posted a review on "${project.title}"`,
      projectId: project.id,
      actorId: professor.id,
    })
  }

  /**
   * Notify when professor posts an announcement
   */
  async notifyAnnouncementPosted(
    studentIds: string[],
    professor: { id: string; fullName: string },
    course: { id: string; title: string },
    announcementTitle: string
  ): Promise<void> {
    await this.createBulkNotifications(studentIds, {
      type: 'announcement_posted',
      title: 'New Announcement',
      message: `Professor ${professor.fullName} posted an announcement in ${course.title}: "${announcementTitle}"`,
      actorId: professor.id,
    })
  }

  // ==========================================
  // SCHEDULED NOTIFICATION HELPERS
  // ==========================================

  /**
   * Find tasks due today and create notifications
   * (To be called by cron job or on-login check)
   */
  async checkTasksDueToday(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const tasksDueToday = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
        status: { not: 'done' },
        isDeleted: false,
        assigneeId: { not: null },
      },
      include: {
        project: { select: { id: true, title: true } },
      },
    })

    let notificationCount = 0

    // Check for existing notifications to avoid duplicates
    for (const task of tasksDueToday) {
      if (!task.assigneeId || !task.dueDate) continue

      // Check for existing "due today" notification (with dueToday flag)
      const existingNotifications = await prisma.notification.findMany({
        where: {
          userId: task.assigneeId,
          taskId: task.id,
          type: 'task_due_approaching',
          createdAt: { gte: today },
        },
      })

      // Find notification that has dueToday=true
      const existingNotification = existingNotifications.find(
        (n) => (n.metadata as Record<string, unknown>)?.dueToday === true
      )

      if (!existingNotification) {
        await this.notifyTaskDueToday(
          task.assigneeId,
          { id: task.id, title: task.title, dueDate: task.dueDate },
          { id: task.project.id, title: task.project.title }
        )
        notificationCount++
      }
    }

    return notificationCount
  }

  /**
   * Find tasks due tomorrow and create notifications
   * (To be called by cron job or on-login check)
   */
  async checkTasksDueApproaching(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    const tasksDueTomorrow = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        status: { not: 'done' },
        isDeleted: false,
        assigneeId: { not: null },
      },
      include: {
        project: { select: { id: true, title: true } },
      },
    })

    let notificationCount = 0

    // Check for existing notifications to avoid duplicates
    for (const task of tasksDueTomorrow) {
      if (!task.assigneeId || !task.dueDate) continue

      // Check for existing "due tomorrow" notification created today
      const existingNotifications = await prisma.notification.findMany({
        where: {
          userId: task.assigneeId,
          taskId: task.id,
          type: 'task_due_approaching',
          createdAt: { gte: today },
        },
      })

      // Filter out notifications that have dueToday=true (those are for today, not tomorrow)
      const existingNotification = existingNotifications.find(
        (n) => !(n.metadata as Record<string, unknown>)?.dueToday
      )

      if (!existingNotification) {
        await this.notifyTaskDueApproaching(
          task.assigneeId,
          { id: task.id, title: task.title, dueDate: task.dueDate },
          { id: task.project.id, title: task.project.title }
        )
        notificationCount++
      }
    }

    return notificationCount
  }

  /**
   * Find overdue tasks and create notifications
   */
  async checkTasksOverdue(): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: today },
        status: { not: 'done' },
        isDeleted: false,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            teamLeaderId: true,
          },
        },
      },
    })

    let notificationCount = 0
    for (const task of overdueTasks) {
      if (!task.dueDate) continue

      // Check if we already sent an overdue notification today
      const existingNotification = await prisma.notification.findFirst({
        where: {
          taskId: task.id,
          type: 'task_overdue',
          createdAt: { gte: today },
        },
      })

      if (!existingNotification) {
        const recipientIds: string[] = []
        if (task.assigneeId) recipientIds.push(task.assigneeId)
        if (task.project.teamLeaderId && task.project.teamLeaderId !== task.assigneeId) {
          recipientIds.push(task.project.teamLeaderId)
        }

        if (recipientIds.length > 0) {
          await this.notifyTaskOverdue(
            recipientIds,
            { id: task.id, title: task.title, dueDate: task.dueDate },
            { id: task.project.id, title: task.project.title }
          )
          notificationCount++
        }
      }
    }

    return notificationCount
  }

  /**
   * Find projects with approaching deadlines (3 days)
   */
  async checkProjectDeadlinesApproaching(): Promise<number> {
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    threeDaysFromNow.setHours(0, 0, 0, 0)

    const fourDaysFromNow = new Date(threeDaysFromNow)
    fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 1)

    const projectsApproachingDeadline = await prisma.project.findMany({
      where: {
        deadlineDate: {
          gte: threeDaysFromNow,
          lt: fourDaysFromNow,
        },
        status: 'active',
        deletedAt: null,
      },
      include: {
        members: {
          where: { inviteStatus: 'accepted' },
          select: { userId: true },
        },
      },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let notificationCount = 0
    for (const project of projectsApproachingDeadline) {
      if (!project.deadlineDate) continue

      const existingNotification = await prisma.notification.findFirst({
        where: {
          projectId: project.id,
          type: 'project_deadline_approaching',
          createdAt: { gte: today },
        },
      })

      if (!existingNotification) {
        const memberIds = project.members.map((m) => m.userId)
        if (memberIds.length > 0) {
          await this.notifyProjectDeadlineApproaching(memberIds, {
            id: project.id,
            title: project.title,
            deadlineDate: project.deadlineDate,
          })
          notificationCount++
        }
      }
    }

    return notificationCount
  }
}

// Export a singleton instance
export const notificationService = new NotificationService()

// Also export the class for testing
export { NotificationService }
