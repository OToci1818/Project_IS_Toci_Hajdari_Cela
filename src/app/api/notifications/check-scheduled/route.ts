import { NextResponse } from "next/server";
import { notificationService } from "@/services";

// This can be called by a cron job or triggered on user login/dashboard load
export async function POST(request: Request) {
  try {
    // Optional: Add API key protection for cron jobs
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, require authentication
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [tasksDue, tasksOverdue, projectDeadlines, projectDeadlinesMissed] = await Promise.all([
      notificationService.checkTasksDueApproaching(),
      notificationService.checkTasksOverdue(),
      notificationService.checkProjectDeadlinesApproaching(),
      notificationService.checkProjectDeadlinesMissed(),
    ]);

    return NextResponse.json({
      message: "Scheduled notifications checked",
      results: {
        tasksDueApproaching: tasksDue,
        tasksOverdue: tasksOverdue,
        projectDeadlinesApproaching: projectDeadlines,
        projectDeadlinesMissed: projectDeadlinesMissed,
      },
    });
  } catch (error) {
    console.error("Check scheduled notifications error:", error);
    return NextResponse.json(
      { error: "Failed to check scheduled notifications" },
      { status: 500 }
    );
  }
}
