import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    ) as { userId: string; email: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })
    return user ?? null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const days = parseInt(searchParams.get('days') || '30', 10)

    // Get projects where user is team leader
    const projects = await prisma.project.findMany({
      where: {
        teamLeaderId: user.id,
        deletedAt: null,
      },
      select: { id: true, title: true },
    })

    if (projects.length === 0) {
      return NextResponse.json({
        projects: [],
        taskCompletionTrend: [],
        tasksByStatus: [],
        memberPerformance: [],
        deadlineAdherence: { onTime: 0, overdue: 0 },
        projectProgress: [],
      })
    }

    // Filter by project if specified
    const projectIds = projectId ? [projectId] : projects.map((p) => p.id)

    // 1. Task completion trend (configurable days)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const completedTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        isDeleted: false,
        status: 'done',
        updatedAt: { gte: startDate },
      },
      select: { updatedAt: true },
    })

    // Group by date
    const completionByDate: Record<string, number> = {}
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      completionByDate[dateStr] = 0
    }

    completedTasks.forEach((task) => {
      const dateStr = task.updatedAt.toISOString().split('T')[0]
      if (completionByDate[dateStr] !== undefined) {
        completionByDate[dateStr]++
      }
    })

    const taskCompletionTrend = Object.entries(completionByDate).map(([date, count]) => ({
      date,
      completed: count,
    }))

    // 2. Tasks by status
    const tasksByStatusRaw = await prisma.task.groupBy({
      by: ['status'],
      where: {
        projectId: { in: projectIds },
        isDeleted: false,
      },
      _count: { id: true },
    })

    const statusLabels: Record<string, string> = {
      to_do: 'To Do',
      in_progress: 'In Progress',
      done: 'Done',
    }

    const tasksByStatus = tasksByStatusRaw.map((item) => ({
      status: statusLabels[item.status] || item.status,
      count: item._count.id,
    }))

    // 3. Member performance (tasks completed per member)
    const memberTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        isDeleted: false,
        assigneeId: { not: null },
      },
      select: {
        status: true,
        assignee: {
          select: { id: true, fullName: true },
        },
      },
    })

    const memberStats: Record<string, { name: string; completed: number; total: number }> = {}
    memberTasks.forEach((task) => {
      if (task.assignee) {
        if (!memberStats[task.assignee.id]) {
          memberStats[task.assignee.id] = {
            name: task.assignee.fullName,
            completed: 0,
            total: 0,
          }
        }
        memberStats[task.assignee.id].total++
        if (task.status === 'done') {
          memberStats[task.assignee.id].completed++
        }
      }
    })

    const memberPerformance = Object.values(memberStats).map((member) => ({
      name: member.name,
      completed: member.completed,
      pending: member.total - member.completed,
    }))

    // 4. Deadline adherence
    const allTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        isDeleted: false,
        status: 'done',
        dueDate: { not: null },
      },
      select: { dueDate: true, updatedAt: true },
    })

    let onTime = 0
    let overdue = 0
    allTasks.forEach((task) => {
      if (task.dueDate) {
        if (task.updatedAt <= task.dueDate) {
          onTime++
        } else {
          overdue++
        }
      }
    })

    // 5. Project progress
    const projectsWithTasks = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        deletedAt: null,
      },
      include: {
        tasks: {
          where: { isDeleted: false },
          select: { status: true },
        },
      },
    })

    const projectProgress = projectsWithTasks.map((project) => {
      const total = project.tasks.length
      const done = project.tasks.filter((t) => t.status === 'done').length
      const progress = total > 0 ? Math.round((done / total) * 100) : 0
      return {
        name: project.title,
        progress,
        total,
        done,
      }
    })

    return NextResponse.json({
      projects,
      taskCompletionTrend,
      tasksByStatus,
      memberPerformance,
      deadlineAdherence: { onTime, overdue },
      projectProgress,
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
