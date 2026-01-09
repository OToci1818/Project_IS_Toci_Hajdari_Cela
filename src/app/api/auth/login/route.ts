import { NextResponse } from "next/server";
import { authService } from "@/services";
import crypto from "crypto";

// Hardcoded test credentials - Remove in production!
const HARDCODED_USERS = {
  "test@fti.edu.al": {
    id: "test-user-1",
    email: "test@fti.edu.al",
    password: "password123",
    firstName: "Test",
    lastName: "User",
    role: "admin",
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check hardcoded users first (for testing without DB)
    const hardcodedUser =
      HARDCODED_USERS[email as keyof typeof HARDCODED_USERS];
    if (hardcodedUser && hardcodedUser.password === password) {
      // Generate a mock session ID
      const sessionId = crypto.randomBytes(32).toString("hex");

      const response = NextResponse.json({
        user: {
          id: hardcodedUser.id,
          email: hardcodedUser.email,
          firstName: hardcodedUser.firstName,
          lastName: hardcodedUser.lastName,
          role: hardcodedUser.role,
        },
        message: "Login successful",
      });

      response.cookies.set("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return response;
    }

    // Fall back to database authentication
    const result = await authService.login(email, password);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Set session cookie
    const response = NextResponse.json({
      user: result.user,
      message: "Login successful",
    });

    response.cookies.set("sessionId", result.sessionId!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
