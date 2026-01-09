import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authService, taskService } from "@/services";
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
    const history = await taskService.getTaskHistory(id);

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Get task history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task history" },
      { status: 500 }
    );
  }
}
