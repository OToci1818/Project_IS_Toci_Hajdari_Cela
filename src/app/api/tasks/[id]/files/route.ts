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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: taskId } = await params;
    const files = await fileService.getFilesByTask(taskId);

    // Convert BigInt to string for JSON serialization
    const serializedFiles = files.map((file) => ({
      ...file,
      sizeBytes: file.sizeBytes.toString(),
      formattedSize: fileService.formatFileSize(file.sizeBytes),
    }));

    return NextResponse.json({ files: serializedFiles });
  } catch (error) {
    console.error("Get files error:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
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

    const { id: taskId } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file size
    const maxSize = fileStorageService.getMaxFileSize();
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${maxSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to storage
    const uploadResult = await fileStorageService.upload(
      buffer,
      file.name,
      file.type
    );

    // Create database record
    const fileRecord = await fileService.createFile({
      taskId,
      uploadedById: user.id,
      filename: file.name,
      key: uploadResult.key,
      size: uploadResult.size,
      mimeType: file.type,
    });

    return NextResponse.json(
      {
        file: {
          ...fileRecord,
          sizeBytes: fileRecord.sizeBytes.toString(),
          formattedSize: fileService.formatFileSize(fileRecord.sizeBytes),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
