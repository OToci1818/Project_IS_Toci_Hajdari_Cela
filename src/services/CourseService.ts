import { prisma } from '@/lib/prisma'

export interface CreateCourseInput {
  title: string
  code: string
  description?: string
  semester: string
  year: number
  professorId: string
}

export interface UpdateCourseInput {
  title?: string
  code?: string
  description?: string
  semester?: string
  year?: number
  isActive?: boolean
}

export interface CourseWithDetails {
  id: string
  title: string
  code: string
  description: string | null
  semester: string
  year: number
  professorId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  professor: {
    id: string
    fullName: string
    email: string
  }
  _count: {
    enrollments: number
    projects: number
  }
}

export interface EnrolledStudent {
  id: string
  fullName: string
  email: string
  enrolledAt: Date
}

class CourseService {
  /**
   * Create a new course
   */
  async createCourse(input: CreateCourseInput) {
    return prisma.course.create({
      data: {
        title: input.title,
        code: input.code.toUpperCase(),
        description: input.description,
        semester: input.semester,
        year: input.year,
        professorId: input.professorId,
      },
      include: {
        professor: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { enrollments: true, projects: true },
        },
      },
    })
  }

  /**
   * Get course by ID with details
   */
  async getCourseById(courseId: string): Promise<CourseWithDetails | null> {
    return prisma.course.findUnique({
      where: { id: courseId },
      include: {
        professor: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { enrollments: true, projects: true },
        },
      },
    })
  }

  /**
   * Get all courses for a professor
   */
  async getCoursesByProfessor(professorId: string) {
    return prisma.course.findMany({
      where: { professorId },
      include: {
        professor: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { enrollments: true, projects: true },
        },
      },
      orderBy: [{ year: 'desc' }, { semester: 'asc' }, { title: 'asc' }],
    })
  }

  /**
   * Get all courses a student is enrolled in
   */
  async getEnrolledCourses(studentId: string) {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            professor: {
              select: { id: true, fullName: true, email: true },
            },
            _count: {
              select: { enrollments: true, projects: true },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    })

    return enrollments.map((e) => ({
      ...e.course,
      enrolledAt: e.enrolledAt,
    }))
  }

  /**
   * Get all available courses (for students to browse/enroll)
   */
  async getAvailableCourses(studentId: string) {
    // Get courses student is not enrolled in
    const enrolledCourseIds = await prisma.courseEnrollment.findMany({
      where: { studentId },
      select: { courseId: true },
    })

    return prisma.course.findMany({
      where: {
        isActive: true,
        id: { notIn: enrolledCourseIds.map((e) => e.courseId) },
      },
      include: {
        professor: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { enrollments: true, projects: true },
        },
      },
      orderBy: [{ year: 'desc' }, { semester: 'asc' }, { title: 'asc' }],
    })
  }

  /**
   * Update a course
   */
  async updateCourse(courseId: string, input: UpdateCourseInput) {
    return prisma.course.update({
      where: { id: courseId },
      data: {
        ...input,
        code: input.code?.toUpperCase(),
      },
      include: {
        professor: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { enrollments: true, projects: true },
        },
      },
    })
  }

  /**
   * Delete a course (sets isActive to false)
   */
  async deleteCourse(courseId: string) {
    return prisma.course.update({
      where: { id: courseId },
      data: { isActive: false },
    })
  }

  /**
   * Enroll a student in a course
   */
  async enrollStudent(courseId: string, studentId: string) {
    return prisma.courseEnrollment.create({
      data: {
        courseId,
        studentId,
      },
      include: {
        course: {
          select: { id: true, title: true, code: true },
        },
        student: {
          select: { id: true, fullName: true, email: true },
        },
      },
    })
  }

  /**
   * Unenroll a student from a course
   */
  async unenrollStudent(courseId: string, studentId: string) {
    return prisma.courseEnrollment.delete({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        },
      },
    })
  }

  /**
   * Check if a student is enrolled in a course
   */
  async isStudentEnrolled(courseId: string, studentId: string): Promise<boolean> {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        },
      },
    })
    return !!enrollment
  }

  /**
   * Get all enrolled students for a course
   */
  async getEnrolledStudents(courseId: string): Promise<EnrolledStudent[]> {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { student: { fullName: 'asc' } },
    })

    return enrollments.map((e) => ({
      id: e.student.id,
      fullName: e.student.fullName,
      email: e.student.email,
      enrolledAt: e.enrolledAt,
    }))
  }

  /**
   * Get all projects in a course
   */
  async getCourseProjects(courseId: string) {
    return prisma.project.findMany({
      where: {
        courseId,
        deletedAt: null,
      },
      include: {
        teamLeader: {
          select: { id: true, fullName: true, email: true },
        },
        members: {
          where: { inviteStatus: 'accepted' },
          include: {
            user: {
              select: { id: true, fullName: true },
            },
          },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Check if user can access course (professor owns it or student is enrolled)
   */
  async canUserAccessCourse(
    courseId: string,
    userId: string,
    userRole: string
  ): Promise<boolean> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          where: { studentId: userId },
        },
      },
    })

    if (!course) return false

    // Professors can access their own courses
    if (userRole === 'professor' && course.professorId === userId) return true

    // Admins can access all
    if (userRole === 'admin') return true

    // Students can access if enrolled
    return course.enrollments.length > 0
  }

  /**
   * Get course statistics for professor dashboard
   */
  async getCourseStatistics(courseId: string) {
    const [course, projects, enrollments] = await Promise.all([
      prisma.course.findUnique({
        where: { id: courseId },
      }),
      prisma.project.findMany({
        where: { courseId, deletedAt: null },
        include: {
          tasks: {
            where: { isDeleted: false },
            select: { status: true },
          },
          grade: true,
          finalSubmission: true,
        },
      }),
      prisma.courseEnrollment.count({
        where: { courseId },
      }),
    ])

    if (!course) return null

    // Calculate statistics
    const totalProjects = projects.length
    const completedProjects = projects.filter((p) => p.status === 'completed').length
    const gradedProjects = projects.filter((p) => p.grade).length

    // Submission status counts
    const submissionStats = {
      draft: 0,
      submitted: 0,
      approved: 0,
      needs_revision: 0,
      none: 0,
    }

    projects.forEach((p) => {
      if (p.finalSubmission) {
        submissionStats[p.finalSubmission.status]++
      } else {
        submissionStats.none++
      }
    })

    // Grade distribution
    const gradeDistribution: Record<string, number> = {}
    projects.forEach((p) => {
      if (p.grade) {
        if (p.grade.gradeType === 'letter' && p.grade.letterGrade) {
          gradeDistribution[p.grade.letterGrade] =
            (gradeDistribution[p.grade.letterGrade] || 0) + 1
        } else if (p.grade.gradeType === 'numeric' && p.grade.numericGrade !== null) {
          // Group numeric grades by range
          const grade = p.grade.numericGrade
          let range = 'F'
          if (grade >= 90) range = 'A'
          else if (grade >= 80) range = 'B'
          else if (grade >= 70) range = 'C'
          else if (grade >= 60) range = 'D'
          gradeDistribution[range] = (gradeDistribution[range] || 0) + 1
        }
      }
    })

    // Task completion rate
    let totalTasks = 0
    let completedTasks = 0
    projects.forEach((p) => {
      totalTasks += p.tasks.length
      completedTasks += p.tasks.filter((t) => t.status === 'done').length
    })

    return {
      courseId,
      enrolledStudents: enrollments,
      totalProjects,
      completedProjects,
      gradedProjects,
      submissionStats,
      gradeDistribution,
      taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalTasks,
      completedTasks,
    }
  }
}

export const courseService = new CourseService()
export { CourseService }
