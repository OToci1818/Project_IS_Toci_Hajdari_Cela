import { prisma } from '@/lib/prisma'
import { Task, TaskStatus, TaskPriority } from '@/types'
import { TaskStatus as PrismaTaskStatus, TaskPriority as PrismaTaskPriority } from '@prisma/client'
import { notificationService } from './NotificationService'

export interface CreateTaskInput {
  projectId: string
  title: string
  description?: string
  priority?: TaskPriority
  assigneeId?: string
  dueDate?: Date
  createdById: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  priority?: TaskPriority
  dueDate?: Date | null
  ordinal?: number
}

export interface TaskWithAssignee extends Omit<Task, 'assignee'> {
  assignee?: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string
  }
  createdBy?: {
    id: string
    fullName: string
  }
  project?: {
    id: string
    title: string
  }
}

export interface TaskHistoryEntry {
  id: string
  taskId: string
  changedById: string
  changedBy: {
    id: string
    fullName: string
  }
  previousStatus?: TaskStatus
  newStatus?: TaskStatus
  previousAssignee?: string
  newAssignee?: string
  comment?: string
  createdAt: Date
}

/**
 * TaskService handles all task-related business logic:
 * - CRUD operations for tasks
 * - Status changes with automatic history tracking
 * - Task assignments with history
 * - Fetching tasks by project or user
 */
class TaskService {
  /**
   * Create a new task within a project.
   */
  async createTask(input: CreateTaskInput): Promise<Task> {
    const { projectId, title, description, priority, assigneeId, dueDate, createdById } = input

    // Get the highest ordinal for this project to place the new task at the end
    const lastTask = await prisma.task.findFirst({
      where: { projectId, isDeleted: false },
      orderBy: { ordinal: 'desc' },
      select: { ordinal: true },
    })

    const newOrdinal = (lastTask?.ordinal ?? -1) + 1

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        priority: (priority as PrismaTaskPriority) ?? 'medium',
        assigneeId,
        dueDate,
        createdById,
        ordinal: newOrdinal,
      },
      include: {
        assignee: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
    })

    // Log initial task creation in history
    await this.recordHistory(task.id, createdById, {
      comment: 'Task created',
      newStatus: task.status as TaskStatus,
      newAssignee: assigneeId,
    })

    // Log activity
    await this.logActivity(createdById, 'create_task', 'task', task.id, { title })

    // Send notification if task is assigned to someone other than the creator
    if (assigneeId && assigneeId !== createdById) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, title: true },
      })
      const creator = await prisma.user.findUnique({
        where: { id: createdById },
        select: { id: true, fullName: true },
      })

      if (project && creator) {
        await notificationService.notifyTaskAssigned(
          assigneeId,
          creator,
          { id: task.id, title: task.title },
          project
        )
      }
    }

    return this.mapToTaskType(task)
  }

  /**
   * Update task details (not status or assignee - use dedicated methods for those).
   */
  async updateTask(
    taskId: string,
    input: UpdateTaskInput,
    updatedById: string
  ): Promise<TaskWithAssignee | null> {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId, isDeleted: false },
    })

    if (!existingTask) {
      return null
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority as PrismaTaskPriority | undefined,
        dueDate: input.dueDate,
        ordinal: input.ordinal,
      },
      include: {
        assignee: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
    })

    // Log activity
    await this.logActivity(updatedById, 'update_task', 'task', taskId, {
      changes: input,
    })

    return this.mapToTaskType(task)
  }

  /**
   * Change task status with history tracking.
   */
  async changeTaskStatus(
    taskId: string,
    newStatus: TaskStatus,
    changedById: string,
    comment?: string
  ): Promise<TaskWithAssignee | null> {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId, isDeleted: false },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            teamLeaderId: true,
            courseId: true,
            members: {
              where: { inviteStatus: 'accepted' },
              select: { userId: true },
            },
          },
        },
      },
    })

    if (!existingTask) {
      return null
    }

    const previousStatus = existingTask.status as TaskStatus

    // Don't update if status is the same
    if (previousStatus === newStatus) {
      return this.getTaskById(taskId)
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus as PrismaTaskStatus },
      include: {
        assignee: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
    })

    // Record status change in history
    await this.recordHistory(taskId, changedById, {
      previousStatus,
      newStatus,
      comment,
    })

    // Log activity
    await this.logActivity(changedById, 'change_task_status', 'task', taskId, {
      previousStatus,
      newStatus,
    })

    // Send notifications
    const changer = await prisma.user.findUnique({
      where: { id: changedById },
      select: { id: true, fullName: true },
    })

    if (changer && existingTask.project) {
      const project = { id: existingTask.project.id, title: existingTask.project.title }
      const taskInfo = { id: task.id, title: task.title }

      // Collect ALL project members as recipients (team leader + accepted members)
      const allMemberIds = [
        existingTask.project.teamLeaderId,
        ...existingTask.project.members.map((m) => m.userId),
      ]
      // Remove duplicates and exclude the person who made the change
      const recipientIds = Array.from(new Set(allMemberIds)).filter(
        (id) => id && id !== changedById
      )

      if (newStatus === 'done') {
        // Task completed notification
        await notificationService.notifyTaskCompleted(
          recipientIds,
          changer,
          taskInfo,
          project
        )

        // Check if project is now 100% complete and notify team leader
        await this.checkAndNotifyProjectComplete(existingTask.project.id, existingTask.project.teamLeaderId)
      } else {
        // General status change notification
        await notificationService.notifyTaskStatusChanged(
          recipientIds,
          changer,
          taskInfo,
          project,
          newStatus
        )
      }
    }

    return this.mapToTaskType(task)
  }

  /**
   * Assign or reassign a task to a user with history tracking.
   */
  async assignTask(
    taskId: string,
    assigneeId: string | null,
    changedById: string,
    comment?: string
  ): Promise<TaskWithAssignee | null> {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId, isDeleted: false },
      include: {
        project: {
          select: { id: true, title: true },
        },
      },
    })

    if (!existingTask) {
      return null
    }

    const previousAssignee = existingTask.assigneeId

    // Don't update if assignee is the same
    if (previousAssignee === assigneeId) {
      return this.getTaskById(taskId)
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId },
      include: {
        assignee: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
      },
    })

    // Record assignment change in history
    await this.recordHistory(taskId, changedById, {
      previousAssignee: previousAssignee ?? undefined,
      newAssignee: assigneeId ?? undefined,
      comment,
    })

    // Log activity
    await this.logActivity(changedById, 'assign_task', 'task', taskId, {
      previousAssignee,
      newAssignee: assigneeId,
    })

    // Send notification to new assignee (if different from the person making the change)
    if (assigneeId && assigneeId !== changedById && existingTask.project) {
      const assigner = await prisma.user.findUnique({
        where: { id: changedById },
        select: { id: true, fullName: true },
      })

      if (assigner) {
        await notificationService.notifyTaskAssigned(
          assigneeId,
          assigner,
          { id: task.id, title: task.title },
          { id: existingTask.project.id, title: existingTask.project.title }
        )
      }
    }

    return this.mapToTaskType(task)
  }

  /**
   * Soft delete a task.
   */
  async deleteTask(taskId: string, deletedById: string): Promise<boolean> {
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId, isDeleted: false },
    })

    if (!existingTask) {
      return false
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'archived' as PrismaTaskStatus,
      },
    })

    // Record deletion in history
    await this.recordHistory(taskId, deletedById, {
      comment: 'Task deleted',
      previousStatus: existingTask.status as TaskStatus,
      newStatus: 'archived',
    })

    // Log activity
    await this.logActivity(deletedById, 'delete_task', 'task', taskId)

    return true
  }

  /**
   * Get a single task by ID.
   */
  async getTaskById(taskId: string): Promise<TaskWithAssignee | null> {
    const task = await prisma.task.findUnique({
      where: { id: taskId, isDeleted: false },
      include: {
        assignee: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, fullName: true },
        },
      },
    })

    if (!task) return null

    return {
      ...this.mapToTaskType(task),
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            fullName: task.assignee.fullName,
            email: task.assignee.email,
            avatarUrl: task.assignee.avatarUrl ?? undefined,
          }
        : undefined,
      createdBy: task.createdBy
        ? {
            id: task.createdBy.id,
            fullName: task.createdBy.fullName,
          }
        : undefined,
    }
  }

  /**
   * Get all tasks for a project, optionally filtered by status.
   */
  async getTasksByProject(
    projectId: string,
    status?: TaskStatus
  ): Promise<TaskWithAssignee[]> {
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        isDeleted: false,
        ...(status && { status: status as PrismaTaskStatus }),
      },
      include: {
        assignee: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: [{ status: 'asc' }, { ordinal: 'asc' }],
    })

    return tasks.map((task) => ({
      ...this.mapToTaskType(task),
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            fullName: task.assignee.fullName,
            email: task.assignee.email,
            avatarUrl: task.assignee.avatarUrl ?? undefined,
          }
        : undefined,
      createdBy: task.createdBy
        ? {
            id: task.createdBy.id,
            fullName: task.createdBy.fullName,
          }
        : undefined,
    }))
  }

  /**
   * Get all tasks assigned to a user across all projects.
   */
  async getTasksByUser(
    userId: string,
    includeCompleted = false
  ): Promise<TaskWithAssignee[]> {
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        isDeleted: false,
        ...(!includeCompleted && {
          status: { not: 'done' as PrismaTaskStatus },
        }),
      },
      include: {
        assignee: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        createdBy: {
          select: { id: true, fullName: true },
        },
        project: {
          select: { id: true, title: true },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
    })

    return tasks.map((task) => ({
      ...this.mapToTaskType(task),
      assignee: task.assignee
        ? {
            id: task.assignee.id,
            fullName: task.assignee.fullName,
            email: task.assignee.email,
            avatarUrl: task.assignee.avatarUrl ?? undefined,
          }
        : undefined,
      createdBy: task.createdBy
        ? {
            id: task.createdBy.id,
            fullName: task.createdBy.fullName,
          }
        : undefined,
      project: task.project
        ? {
            id: task.project.id,
            title: task.project.title,
          }
        : undefined,
    }))
  }

  /**
   * Get the full history of a task.
   */
  async getTaskHistory(taskId: string): Promise<TaskHistoryEntry[]> {
    const history = await prisma.taskHistory.findMany({
      where: { taskId },
      include: {
        changedBy: {
          select: { id: true, fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return history.map((entry) => ({
      id: entry.id,
      taskId: entry.taskId,
      changedById: entry.changedById,
      changedBy: {
        id: entry.changedBy.id,
        fullName: entry.changedBy.fullName,
      },
      previousStatus: entry.previousStatus as TaskStatus | undefined,
      newStatus: entry.newStatus as TaskStatus | undefined,
      previousAssignee: entry.previousAssignee ?? undefined,
      newAssignee: entry.newAssignee ?? undefined,
      comment: entry.comment ?? undefined,
      createdAt: entry.createdAt,
    }))
  }

  /**
   * Reorder tasks within a project (for drag-and-drop).
   */
  async reorderTasks(
    projectId: string,
    taskIds: string[],
    reorderedById: string
  ): Promise<void> {
    // Update ordinals based on the new order
    await prisma.$transaction(
      taskIds.map((taskId, index) =>
        prisma.task.update({
          where: { id: taskId },
          data: { ordinal: index },
        })
      )
    )

    await this.logActivity(reorderedById, 'reorder_tasks', 'project', projectId)
  }

  /**
   * Record a change in task history.
   */
  private async recordHistory(
    taskId: string,
    changedById: string,
    data: {
      previousStatus?: TaskStatus
      newStatus?: TaskStatus
      previousAssignee?: string
      newAssignee?: string
      comment?: string
    }
  ) {
    await prisma.taskHistory.create({
      data: {
        taskId,
        changedById,
        previousStatus: data.previousStatus as PrismaTaskStatus | undefined,
        newStatus: data.newStatus as PrismaTaskStatus | undefined,
        previousAssignee: data.previousAssignee,
        newAssignee: data.newAssignee,
        comment: data.comment,
      },
    })
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

  /**
   * Map Prisma Task to our Task type.
   */
  private mapToTaskType(task: {
    id: string
    projectId: string
    title: string
    description: string | null
    priority: string
    status: string
    assigneeId: string | null
    ordinal: number
    createdById: string
    createdAt: Date
    updatedAt: Date
    dueDate: Date | null
  }): Task {
    return {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description ?? undefined,
      priority: task.priority as TaskPriority,
      status: task.status as TaskStatus,
      assigneeId: task.assigneeId ?? undefined,
      ordinal: task.ordinal,
      createdById: task.createdById,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      dueDate: task.dueDate ?? undefined,
    }
  }

  /**
   * Check if project is 100% complete and notify team leader
   */
  private async checkAndNotifyProjectComplete(
    projectId: string,
    teamLeaderId: string
  ): Promise<void> {
    try {
      // Get all tasks for the project
      const tasks = await prisma.task.findMany({
        where: { projectId, isDeleted: false },
        select: { status: true },
      })

      if (tasks.length === 0) return

      const doneTasks = tasks.filter((t) => t.status === 'done').length
      const progress = Math.round((doneTasks / tasks.length) * 100)

      // If project is 100% complete, notify team leader
      if (progress === 100) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { id: true, title: true },
        })

        if (project) {
          await notificationService.notifyProjectReadyForSubmission(
            teamLeaderId,
            project
          )
        }
      }
    } catch (error) {
      console.error('Failed to check project completion:', error)
    }
  }
}

// Export a singleton instance
export const taskService = new TaskService()

// Also export the class for testing
export { TaskService }
