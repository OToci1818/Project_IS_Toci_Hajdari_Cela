import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService, fileService, fileStorageService } from "@/services";
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
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { key } = await params;

    // Get file metadata
    const file = await fileService.getFileByKey(key);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Read file from storage
    const buffer = await fileStorageService.read(key);
    if (!buffer) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Return file with proper headers (convert Buffer to Uint8Array for NextResponse)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Download file error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { key } = await params;

    // Get file metadata
    const file = await fileService.getFileByKey(key);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete file
    const deleted = await fileService.deleteFile(file.id, user.id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Cannot delete file. You may not be the owner." },
        { status: 403 }
      );
    }

    return NextResponse.json({ message: "File deleted" });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
