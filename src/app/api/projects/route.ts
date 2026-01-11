import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService, notificationService } from "@/services";
import { projectService, ProjectStatus, ProjectType } from "@/services/ProjectService";
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

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ProjectStatus | null;

    const projects = await projectService.getProjectsByUser(
      user.id,
      status ?? undefined
    );

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Get projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, courseCode, courseId, projectType, deadlineDate } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Check if course has projects enabled
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { projectsEnabled: true },
      });

      if (course && !course.projectsEnabled) {
        return NextResponse.json(
          { error: "Projects are disabled for this course" },
          { status: 403 }
        );
      }
    }

    const project = await projectService.createProject({
      title,
      description,
      courseCode,
      courseId,
      projectType: projectType as ProjectType,
      deadlineDate: deadlineDate ? new Date(deadlineDate) : undefined,
      createdById: user.id,
    });

    // Notify professor if project is linked to a course
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, code: true, professorId: true },
      });

      if (course && course.professorId) {
        await notificationService.notifyProjectCreated(
          course.professorId,
          { id: user.id, fullName: user.fullName },
          { id: project.id, title: project.title },
          { id: course.id, title: course.title, code: course.code }
        );
      }
    }

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Create project error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
