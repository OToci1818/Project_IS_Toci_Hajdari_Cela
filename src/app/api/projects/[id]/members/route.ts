import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService, projectService, teamService } from "@/services";
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

    const { id: projectId } = await params;

    // Check if user can access this project
    const canAccess = await projectService.canUserAccessProject(projectId, user.id);
    if (!canAccess) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const members = await teamService.getProjectMembers(projectId);

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Get members error:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Check if user can access this project
    const canAccess = await projectService.canUserAccessProject(projectId, user.id);
    if (!canAccess) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const member = await teamService.inviteMember({
      projectId,
      email,
      role: role || "student",
      invitedById: user.id,
    });

    if (!member) {
      return NextResponse.json(
        { error: "User not found or already a member" },
        { status: 400 }
      );
    }

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error("Invite member error:", error);
    return NextResponse.json(
      { error: "Failed to invite member" },
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

    const { id: projectId } = await params;

    // Check if user can access this project
    const canAccess = await projectService.canUserAccessProject(projectId, user.id);
    if (!canAccess) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    const deleted = await teamService.removeMember(memberId, user.id);

    if (!deleted) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Member removed" });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
