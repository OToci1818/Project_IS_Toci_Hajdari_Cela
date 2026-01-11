import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService, taskService, projectService } from "@/services";
import { TaskPriority } from "@/types";
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
    const projectId = searchParams.get("projectId");

    let tasks;
    if (projectId) {
      tasks = await taskService.getTasksByProject(projectId);
    } else {
      tasks = await taskService.getTasksByUser(user.id, true);
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
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
    const { projectId, title, description, priority, assigneeId, dueDate } =
      body;

    if (!projectId || !title) {
      return NextResponse.json(
        { error: "Project ID and title are required" },
        { status: 400 }
      );
    }

    if (!assigneeId) {
      return NextResponse.json(
        { error: "Assignee is required" },
        { status: 400 }
      );
    }

    // Check if user is the team leader of the project
    const project = await projectService.getProjectById(projectId);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.teamLeaderId !== user.id) {
      return NextResponse.json(
        { error: "Only the team leader can create tasks" },
        { status: 403 }
      );
    }

    const task = await taskService.createTask({
      projectId,
      title,
      description,
      priority: priority as TaskPriority,
      assigneeId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdById: user.id,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
