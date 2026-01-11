import { prisma } from '@/lib/prisma'

export interface DashboardStats {
  totalProjects: number
  completedProjects: number
  activeTasks: number
  completedTasks: number
  totalTasks: number
}

export interface RecentProject {
  id: string
  title: string
  courseCode?: string
  status: string
  progress: number
  deadlineDate?: Date
  grade?: {
    gradeType: 'numeric' | 'letter'
    numericGrade?: number
    letterGrade?: string
  }
}

export interface DashboardData {
  stats: DashboardStats
  recentProjects: RecentProject[]
}

// Professor-specific interfaces
export interface ProfessorDashboardStats {
  totalCourses: number
  activeCourses: number
  totalStudents: number
  totalProjects: number
  pendingSubmissions: number
  gradedProjects: number
}

export interface ProfessorCourse {
  id: string
  title: string
  code: string
  semester: string
  year: number
  studentCount: number
  projectCount: number
  pendingSubmissions: number
}

export interface RecentActivity {
  id: string
  type: 'graded' | 'reviewed' | 'submission_received'
  projectTitle: string
  projectId: string
  studentName: string
  courseName: string
  timestamp: Date
  details?: string
}

export interface ProfessorDashboardData {
  stats: ProfessorDashboardStats
  courses: ProfessorCourse[]
  recentActivity: RecentActivity[]
}

/**
 * DashboardService handles aggregated statistics for the dashboard:
 * - Project counts
 * - Task counts (active, completed, and total)
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
        totalTasks: 0,
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

    return {
      totalProjects,
      completedProjects,
      activeTasks,
      completedTasks,
      totalTasks: activeTasks + completedTasks,
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
        grade: true,
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
        grade: project.grade ? {
          gradeType: project.grade.gradeType as 'numeric' | 'letter',
          numericGrade: project.grade.numericGrade ?? undefined,
          letterGrade: project.grade.letterGrade ?? undefined,
        } : undefined,
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

  // Professor-specific methods

  /**
   * Get professor dashboard stats.
   */
  async getProfessorDashboardStats(professorId: string): Promise<ProfessorDashboardStats> {
    // Get all courses for this professor
    const courses = await prisma.course.findMany({
      where: { professorId },
      include: {
        enrollments: true,
        projects: {
          where: { deletedAt: null },
          include: {
            grade: true,
            finalSubmission: true,
          },
        },
      },
    })

    const totalCourses = courses.length
    const activeCourses = courses.filter(c => c.isActive).length

    // Count unique students across all courses
    const studentIds = new Set<string>()
    courses.forEach(course => {
      course.enrollments.forEach(e => studentIds.add(e.studentId))
    })
    const totalStudents = studentIds.size

    // Count projects
    let totalProjects = 0
    let pendingSubmissions = 0
    let gradedProjects = 0

    courses.forEach(course => {
      totalProjects += course.projects.length
      course.projects.forEach(project => {
        if (project.finalSubmission?.status === 'submitted') {
          pendingSubmissions++
        }
        if (project.grade) {
          gradedProjects++
        }
      })
    })

    return {
      totalCourses,
      activeCourses,
      totalStudents,
      totalProjects,
      pendingSubmissions,
      gradedProjects,
    }
  }

  /**
   * Get professor's courses with stats.
   */
  async getProfessorCourses(professorId: string): Promise<ProfessorCourse[]> {
    const courses = await prisma.course.findMany({
      where: { professorId },
      include: {
        enrollments: true,
        projects: {
          where: { deletedAt: null },
          include: {
            finalSubmission: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { semester: 'asc' },
      ],
    })

    return courses.map(course => ({
      id: course.id,
      title: course.title,
      code: course.code,
      semester: course.semester,
      year: course.year,
      studentCount: course.enrollments.length,
      projectCount: course.projects.length,
      pendingSubmissions: course.projects.filter(
        p => p.finalSubmission?.status === 'submitted'
      ).length,
    }))
  }

  /**
   * Get recent activity for professor (grades, reviews).
   */
  async getProfessorRecentActivity(professorId: string, limit = 10): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = []

    // Get recent grades by this professor
    const recentGrades = await prisma.projectGrade.findMany({
      where: { professorId },
      include: {
        project: {
          include: {
            course: true,
            teamLeader: true,
          },
        },
      },
      orderBy: { gradedAt: 'desc' },
      take: limit,
    })

    recentGrades.forEach(grade => {
      activities.push({
        id: `grade-${grade.id}`,
        type: 'graded',
        projectTitle: grade.project.title,
        projectId: grade.projectId,
        studentName: grade.project.teamLeader?.fullName || 'Unknown',
        courseName: grade.project.course?.title || 'No Course',
        timestamp: grade.gradedAt,
        details: grade.gradeType === 'numeric'
          ? `Grade: ${grade.numericGrade}/100`
          : `Grade: ${grade.letterGrade}`,
      })
    })

    // Get recent submission reviews by this professor
    const recentReviews = await prisma.finalSubmission.findMany({
      where: {
        reviewedById: professorId,
        reviewedAt: { not: null },
      },
      include: {
        project: {
          include: {
            course: true,
            teamLeader: true,
          },
        },
      },
      orderBy: { reviewedAt: 'desc' },
      take: limit,
    })

    recentReviews.forEach(submission => {
      activities.push({
        id: `review-${submission.id}`,
        type: 'reviewed',
        projectTitle: submission.project.title,
        projectId: submission.projectId,
        studentName: submission.project.teamLeader?.fullName || 'Unknown',
        courseName: submission.project.course?.title || 'No Course',
        timestamp: submission.reviewedAt!,
        details: submission.status === 'approved' ? 'Approved' : 'Needs Revision',
      })
    })

    // Get pending submissions (received but not yet reviewed)
    const pendingSubmissions = await prisma.finalSubmission.findMany({
      where: {
        status: 'submitted',
        project: {
          course: {
            professorId,
          },
        },
      },
      include: {
        project: {
          include: {
            course: true,
            teamLeader: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: limit,
    })

    pendingSubmissions.forEach(submission => {
      activities.push({
        id: `pending-${submission.id}`,
        type: 'submission_received',
        projectTitle: submission.project.title,
        projectId: submission.projectId,
        studentName: submission.project.teamLeader?.fullName || 'Unknown',
        courseName: submission.project.course?.title || 'No Course',
        timestamp: submission.submittedAt!,
        details: 'Awaiting Review',
      })
    })

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Get full professor dashboard data in one call.
   */
  async getProfessorDashboardData(professorId: string): Promise<ProfessorDashboardData> {
    const [stats, courses, recentActivity] = await Promise.all([
      this.getProfessorDashboardStats(professorId),
      this.getProfessorCourses(professorId),
      this.getProfessorRecentActivity(professorId),
    ])

    return { stats, courses, recentActivity }
  }
}

// Export a singleton instance
export const dashboardService = new DashboardService()

// Also export the class for testing
export { DashboardService }
