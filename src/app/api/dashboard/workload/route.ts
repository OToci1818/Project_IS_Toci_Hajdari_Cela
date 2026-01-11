import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService } from "@/services";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key-change-in-production"
    ) as { userId: string; email: string };

    const user = await authService.getUserById(decoded.userId);
    return user ?? null;
  } catch {
    return null;
  }
}

export interface TeamMemberWorkload {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    inReview: number;
    done: number;
    overdue: number;
  };
}

export interface ProjectWorkload {
  id: string;
  title: string;
  members: TeamMemberWorkload[];
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get all projects where the user is a team leader
    const projects = await prisma.project.findMany({
      where: {
        teamLeaderId: user.id,
        deletedAt: null,
      },
      include: {
        members: {
          where: {
            inviteStatus: "accepted",
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const workloadData: ProjectWorkload[] = await Promise.all(
      projects.map(async (project) => {
        const membersWorkload: TeamMemberWorkload[] = await Promise.all(
          project.members.map(async (member) => {
            // Get task counts for this member in this project
            const tasks = await prisma.task.findMany({
              where: {
                projectId: project.id,
                assigneeId: member.user.id,
                isDeleted: false,
              },
              select: {
                status: true,
                dueDate: true,
              },
            });

            const taskCounts = {
              total: tasks.length,
              todo: tasks.filter((t) => t.status === "todo").length,
              inProgress: tasks.filter((t) => t.status === "in_progress").length,
              inReview: tasks.filter((t) => t.status === "in_review").length,
              done: tasks.filter((t) => t.status === "done").length,
              overdue: tasks.filter(
                (t) =>
                  t.dueDate &&
                  new Date(t.dueDate) < today &&
                  t.status !== "done"
              ).length,
            };

            return {
              id: member.user.id,
              fullName: member.user.fullName,
              email: member.user.email,
              avatarUrl: member.user.avatarUrl ?? undefined,
              tasks: taskCounts,
            };
          })
        );

        return {
          id: project.id,
          title: project.title,
          members: membersWorkload,
        };
      })
    );

    // Also calculate overall workload across all projects
    const allMembersMap = new Map<string, TeamMemberWorkload>();

    workloadData.forEach((project) => {
      project.members.forEach((member) => {
        const existing = allMembersMap.get(member.id);
        if (existing) {
          existing.tasks.total += member.tasks.total;
          existing.tasks.todo += member.tasks.todo;
          existing.tasks.inProgress += member.tasks.inProgress;
          existing.tasks.inReview += member.tasks.inReview;
          existing.tasks.done += member.tasks.done;
          existing.tasks.overdue += member.tasks.overdue;
        } else {
          allMembersMap.set(member.id, { ...member });
        }
      });
    });

    const overallWorkload = Array.from(allMembersMap.values()).sort(
      (a, b) => b.tasks.total - a.tasks.total
    );

    return NextResponse.json({
      projects: workloadData,
      overall: overallWorkload,
    });
  } catch (error) {
    console.error("Get workload error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workload data" },
      { status: 500 }
    );
  }
}
