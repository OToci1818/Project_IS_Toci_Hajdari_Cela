import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService, fileService, projectService } from "@/services";
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

    const files = await fileService.getFilesByProject(projectId);

    // Convert BigInt to string for JSON serialization
    const serializedFiles = files.map((file) => ({
      ...file,
      sizeBytes: file.sizeBytes.toString(),
      formattedSize: fileService.formatFileSize(file.sizeBytes),
    }));

    return NextResponse.json({ files: serializedFiles });
  } catch (error) {
    console.error("Get project files error:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}
