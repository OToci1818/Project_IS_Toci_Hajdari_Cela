import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService, notificationService } from "@/services";
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

export async function PATCH() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const count = await notificationService.markAllAsRead(user.id);

    return NextResponse.json({
      message: "All notifications marked as read",
      count,
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
