import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService, commentService } from "@/services";
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: commentId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const comment = await commentService.updateComment(
      commentId,
      content.trim(),
      user.id
    );

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found or you are not the author" },
        { status: 404 }
      );
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Update comment error:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
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

    const { id: commentId } = await params;
    const deleted = await commentService.deleteComment(commentId, user.id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Comment not found or you are not the author" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
