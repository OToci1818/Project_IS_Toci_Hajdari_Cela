import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService } from "@/services";
import { projectService, ProjectStatus, ProjectType } from "@/services/ProjectService";
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user can access this project
    const canAccess = await projectService.canUserAccessProject(id, user.id);
    if (!canAccess) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = await projectService.getProjectById(id);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user can access this project
    const canAccess = await projectService.canUserAccessProject(id, user.id);
    if (!canAccess) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, courseCode, projectType, status, deadlineDate } = body;

    const project = await projectService.updateProject(
      id,
      {
        title,
        description,
        courseCode,
        projectType: projectType as ProjectType | undefined,
        status: status as ProjectStatus | undefined,
        deadlineDate: deadlineDate ? new Date(deadlineDate) : deadlineDate,
      },
      user.id
    );

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user can access this project
    const canAccess = await projectService.canUserAccessProject(id, user.id);
    if (!canAccess) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const deleted = await projectService.deleteProject(id, user.id);

    if (!deleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Project deleted" });
  } catch (error) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
