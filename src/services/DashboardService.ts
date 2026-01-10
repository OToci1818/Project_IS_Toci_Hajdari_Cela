import { prisma } from '@/lib/prisma'

export interface DashboardStats {
  totalProjects: number
  completedProjects: number
  activeTasks: number
  completedTasks: number
  teamMembersCount: number
}

export interface RecentProject {
  id: string
  title: string
  courseCode?: string
  status: string
  progress: number
  deadlineDate?: Date
}

export interface DashboardData {
  stats: DashboardStats
  recentProjects: RecentProject[]
}

/**
 * DashboardService handles aggregated statistics for the dashboard:
 * - Project counts
 * - Task counts (active and completed)
 * - Team member counts (unique across projects)
 * - Recent projects
 */
class DashboardService {
  /**
   * Get all project IDs accessible to a user.
   */
  private async getAccessibleProjectIds(userId: string): Promise<string[]> {
    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
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
      select: { id: true },
    })

    return projects.map((p) => p.id)
  }

  /**
   * Get aggregated dashboard stats for a user.
   */
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const projectIds = await this.getAccessibleProjectIds(userId)

    if (projectIds.length === 0) {
      return {
        totalProjects: 0,
        completedProjects: 0,
        activeTasks: 0,
        completedTasks: 0,
        teamMembersCount: 0,
      }
    }

    // Get project counts
    const projectCounts = await prisma.project.groupBy({
      by: ['status'],
      where: {
        id: { in: projectIds },
        deletedAt: null,
      },
      _count: { id: true },
    })

    const totalProjects = projectCounts.reduce((sum, p) => sum + p._count.id, 0)
    const completedProjects =
      projectCounts.find((p) => p.status === 'completed')?._count.id ?? 0

    // Get task counts
    const taskCounts = await prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId: { in: projectIds },
        isDeleted: false,
      },
      _count: { id: true },
    })

    const completedTasks = taskCounts.find((t) => t.status === 'done')?._count.id ?? 0
    const activeTasks = taskCounts
      .filter((t) => t.status === 'to_do' || t.status === 'in_progress')
      .reduce((sum, t) => sum + t._count.id, 0)

    // Get unique team members count
    const teamMembers = await prisma.projectUser.findMany({
      where: {
        projectId: { in: projectIds },
        inviteStatus: 'accepted',
      },
      select: { userId: true },
      distinct: ['userId'],
    })

    return {
      totalProjects,
      completedProjects,
      activeTasks,
      completedTasks,
      teamMembersCount: teamMembers.length,
    }
  }

  /**
   * Get recent projects for a user.
   */
  async getRecentProjects(userId: string, limit = 5): Promise<RecentProject[]> {
    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
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
        tasks: {
          where: { isDeleted: false },
          select: { status: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    })

    return projects.map((project) => {
      const total = project.tasks.length
      const done = project.tasks.filter((t) => t.status === 'done').length
      const progress = total > 0 ? Math.round((done / total) * 100) : 0

      return {
        id: project.id,
        title: project.title,
        courseCode: project.courseCode ?? undefined,
        status: project.status,
        progress,
        deadlineDate: project.deadlineDate ?? undefined,
      }
    })
  }

  /**
   * Get full dashboard data in one call.
   */
  async getDashboardData(userId: string): Promise<DashboardData> {
    const [stats, recentProjects] = await Promise.all([
      this.getDashboardStats(userId),
      this.getRecentProjects(userId),
    ])

    return { stats, recentProjects }
  }
}

// Export a singleton instance
export const dashboardService = new DashboardService()

// Also export the class for testing
export { DashboardService }
