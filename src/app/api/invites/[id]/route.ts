import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService, teamService } from "@/services";
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

    const { id } = await params;
    const body = await request.json();
    const { accept } = body;

    if (typeof accept !== "boolean") {
      return NextResponse.json(
        { error: "accept must be a boolean" },
        { status: 400 }
      );
    }

    const result = await teamService.respondToInvite(id, user.id, accept);

    if (!result) {
      return NextResponse.json(
        { error: "Invite not found or already responded" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: accept ? "Invite accepted" : "Invite declined",
      member: result,
    });
  } catch (error) {
    console.error("Respond to invite error:", error);
    return NextResponse.json(
      { error: "Failed to respond to invite" },
      { status: 500 }
    );
  }
}
