import { prisma } from '@/lib/prisma'
import { ProjectStatus as PrismaProjectStatus, ProjectType as PrismaProjectType } from '@prisma/client'
import { notificationService } from './NotificationService'

export type ProjectStatus = 'active' | 'completed' | 'archived'
export type ProjectType = 'individual' | 'group'

export interface CreateProjectInput {
  title: string
  description?: string
  courseCode?: string
  courseId?: string
  projectType?: ProjectType
  deadlineDate?: Date
  createdById: string
}

export interface UpdateProjectInput {
  title?: string
  description?: string
  courseCode?: string
  courseId?: string
  projectType?: ProjectType
  status?: ProjectStatus
  deadlineDate?: Date | null
}

export interface ProjectListItem {
  id: string
  title: string
  description?: string
  courseCode?: string
  courseId?: string
  course?: {
    id: string
    title: string
    code: string
  }
  projectType: ProjectType
  status: ProjectStatus
  deadlineDate?: Date
  teamLeaderId: string
  memberCount: number
  taskStats: { total: number; done: number }
  progress: number
  createdAt: Date
  updatedAt: Date
}

export interface ProjectMemberInfo {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
}

export interface ProjectWithMembers {
  id: string
  title: string
  description?: string
  courseCode?: string
  courseId?: string
  course?: {
    id: string
    title: string
    code: string
  }
  projectType: ProjectType
  status: ProjectStatus
  deadlineDate?: Date
  teamLeaderId: string
  teamLeader: ProjectMemberInfo
  members: {
    id: string
    userId: string
    role: string
    inviteStatus: string
    user: ProjectMemberInfo
  }[]
  taskStats: { total: number; done: number }
  progress: number
  createdAt: Date
  updatedAt: Date
}

/**
 * ProjectService handles all project-related business logic:
 * - CRUD operations for projects
 * - Access control (team leader or accepted member)
 * - Task statistics aggregation
 */
class ProjectService {
  /**
   * Create a new project. The creator becomes the team leader and is auto-added as a member.
   */
  async createProject(input: CreateProjectInput): Promise<ProjectWithMembers> {
    const { title, description, courseCode, courseId, projectType, deadlineDate, createdById } = input

    // Create project and add creator as team leader member in a transaction
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          title,
          description,
          courseCode,
          courseId,
          projectType: (projectType as PrismaProjectType) ?? 'group',
          deadlineDate,
          teamLeaderId: createdById,
        },
      })

      // Add team leader as an accepted member
      await tx.projectUser.create({
        data: {
          projectId: newProject.id,
          userId: createdById,
          role: 'team_leader',
          inviteStatus: 'accepted',
          joinedAt: new Date(),
        },
      })

      return newProject
    })

    // Log activity
    await this.logActivity(createdById, 'create_project', 'project', project.id, { title })

    // Return full project with members
    return this.getProjectById(project.id) as Promise<ProjectWithMembers>
  }

  /**
   * Get all projects accessible to a user (user is team leader OR accepted member).
   */
  async getProjectsByUser(userId: string, status?: ProjectStatus): Promise<ProjectListItem[]> {
    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        ...(status && { status: status as PrismaProjectStatus }),
        OR: [
          { teamLeaderId: userId },
          {
            members: {
              some: {
                userId,
                inviteStatus: 'accepted',
              },
            },
          },
        ],
      },
      include: {
        members: {
          where: { inviteStatus: 'accepted' },
        },
        tasks: {
          where: { isDeleted: false },
          select: { status: true },
        },
        course: {
          select: { id: true, title: true, code: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return projects.map((project) => {
      const total = project.tasks.length
      const done = project.tasks.filter((t) => t.status === 'done').length
      const progress = total > 0 ? Math.round((done / total) * 100) : 0

      return {
        id: project.id,
        title: project.title,
        description: project.description ?? undefined,
        courseCode: project.courseCode ?? undefined,
        courseId: project.courseId ?? undefined,
        course: project.course ?? undefined,
        projectType: project.projectType as ProjectType,
        status: project.status as ProjectStatus,
        deadlineDate: project.deadlineDate ?? undefined,
        teamLeaderId: project.teamLeaderId,
        memberCount: project.members.length,
        taskStats: { total, done },
        progress,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }
    })
  }

  /**
   * Get a single project by ID with full member list.
   */
  async getProjectById(projectId: string): Promise<ProjectWithMembers | null> {
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      include: {
        teamLeader: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true },
            },
          },
        },
        tasks: {
          where: { isDeleted: false },
          select: { status: true },
        },
        course: {
          select: { id: true, title: true, code: true },
        },
      },
    })

    if (!project) return null

    const total = project.tasks.length
    const done = project.tasks.filter((t) => t.status === 'done').length
    const progress = total > 0 ? Math.round((done / total) * 100) : 0

    return {
      id: project.id,
      title: project.title,
      description: project.description ?? undefined,
      courseCode: project.courseCode ?? undefined,
      courseId: project.courseId ?? undefined,
      course: project.course ?? undefined,
      projectType: project.projectType as ProjectType,
      status: project.status as ProjectStatus,
      deadlineDate: project.deadlineDate ?? undefined,
      teamLeaderId: project.teamLeaderId,
      teamLeader: {
        id: project.teamLeader.id,
        fullName: project.teamLeader.fullName,
        email: project.teamLeader.email,
        avatarUrl: project.teamLeader.avatarUrl ?? undefined,
      },
      members: project.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        inviteStatus: m.inviteStatus,
        user: {
          id: m.user.id,
          fullName: m.user.fullName,
          email: m.user.email,
          avatarUrl: m.user.avatarUrl ?? undefined,
        },
      })),
      taskStats: { total, done },
      progress,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }
  }

  /**
   * Update project details.
   */
  async updateProject(
    projectId: string,
    input: UpdateProjectInput,
    updatedById: string
  ): Promise<ProjectWithMembers | null> {
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      include: {
        members: {
          where: { inviteStatus: 'accepted' },
          select: { userId: true },
        },
      },
    })

    if (!existingProject) {
      return null
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        title: input.title,
        description: input.description,
        courseCode: input.courseCode,
        courseId: input.courseId,
        projectType: input.projectType as PrismaProjectType | undefined,
        status: input.status as PrismaProjectStatus | undefined,
        deadlineDate: input.deadlineDate,
      },
    })

    // Log activity
    await this.logActivity(updatedById, 'update_project', 'project', projectId, {
      changes: input,
    })

    // Send notification if project status changed
    if (input.status && input.status !== existingProject.status) {
      const updater = await prisma.user.findUnique({
        where: { id: updatedById },
        select: { id: true, fullName: true },
      })

      if (updater) {
        const memberIds = existingProject.members.map((m) => m.userId)

        // Use specific notification for 'completed' status
        if (input.status === 'completed') {
          await notificationService.notifyProjectCompleted(
            memberIds,
            updater,
            { id: projectId, title: existingProject.title }
          )
        }

        // Also send general status change notification
        await notificationService.notifyProjectStatusChanged(
          memberIds.filter((id) => id !== updatedById),
          updater,
          { id: projectId, title: existingProject.title },
          input.status
        )
      }
    }

    return this.getProjectById(projectId)
  }

  /**
   * Soft delete a project.
   */
  async deleteProject(projectId: string, deletedById: string): Promise<boolean> {
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
    })

    if (!existingProject) {
      return false
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        deletedAt: new Date(),
        status: 'archived' as PrismaProjectStatus,
      },
    })

    // Log activity
    await this.logActivity(deletedById, 'delete_project', 'project', projectId)

    return true
  }

  /**
   * Check if a user can access a project (is team leader, accepted member, or course professor).
   */
  async canUserAccessProject(projectId: string, userId: string): Promise<boolean> {
    const project = await prisma.project.findUnique({
      where: { id: projectId, deletedAt: null },
      include: {
        members: {
          where: { userId, inviteStatus: 'accepted' },
        },
        course: {
          select: { professorId: true },
        },
      },
    })

    if (!project) return false

    // Team leader can access
    if (project.teamLeaderId === userId) return true
    // Accepted member can access
    if (project.members.length > 0) return true
    // Course professor can access
    if (project.course?.professorId === userId) return true

    return false
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
export const projectService = new ProjectService()

// Also export the class for testing
export { ProjectService }
