@echo off
echo Starting commits...

REM Commit 1: Add new notification types to schema
git add prisma/schema.prisma
git commit -m "feat(schema): add new notification types for project lifecycle events

Add project_status_changed, project_created, project_ready_for_submission,
and deadline_missed to NotificationType enum"

REM Commit 2: Fix task completion to notify all project members
git add src/services/TaskService.ts
git commit -m "fix(notifications): notify all project members on task completion

Changed task completion notification to send to all accepted project members
instead of just creator and team leader. Also added check for 100%% project
completion to notify team leader when ready for submission"

REM Commit 3: Add new notification methods to NotificationService
git add src/services/NotificationService.ts
git commit -m "feat(notifications): add methods for new notification types

Add notifyProjectReadyForSubmission, notifyProjectCreated,
notifyProjectStatusChanged, notifyDeadlineMissed, and
checkProjectDeadlinesMissed methods"

REM Commit 4: Add comment restriction - only assignee can comment
git add src/app/api/tasks/[id]/comments/route.ts
git commit -m "feat(comments): restrict comments to task assignee only

Only the task assignee can now add comments to their assigned task.
Returns 403 error for non-assignees"

REM Commit 5: Add project status changed notification
git add src/services/ProjectService.ts
git commit -m "feat(notifications): notify members on project status change

Send notification to all project members when project status changes
to active, completed, or archived"

REM Commit 6: Add project created notification for professor
git add src/app/api/projects/route.ts
git commit -m "feat(notifications): notify professor when project created in course

When a student creates a project linked to a course, the course
professor receives a notification"

REM Commit 7: Add deadline missed check to scheduled notifications
git add src/app/api/notifications/check-scheduled/route.ts
git commit -m "feat(notifications): add deadline missed check to scheduled job

Add checkProjectDeadlinesMissed to the scheduled notification checks
to notify professors about overdue projects"

REM Commit 8: Add notification count to sidebar
git add src/components/Sidebar.tsx
git commit -m "feat(ui): show notification count badge in sidebar

Add notification count badge next to Notifications menu item in sidebar
for both student and professor views using NotificationContext"

REM Commit 9: Add announcements API for students
git add src/app/api/announcements/route.ts
git commit -m "feat(api): add announcements endpoint for enrolled students

Students can now fetch announcements from courses they are enrolled in"

REM Commit 10: Update seed with sample notifications
git add prisma/seed.ts
git commit -m "feat(seed): add sample notifications for all user types

Add task completion, project status, announcements, project created,
project graded and other notification types to seed data for testing"

REM Commit 11: Fix submission API - BigInt serialization and auto-complete tasks
git add src/app/api/projects/[id]/submission/route.ts
git commit -m "fix(submission): fix BigInt serialization and auto-complete tasks

- Add serializeSubmission helper to convert BigInt sizeBytes to string
- Fix 500 errors on all submission endpoints (GET, POST, PATCH)
- Auto-mark all tasks as done when team leader submits for review"

REM Commit 12: Update project detail page - progress bar improvements
git add src/app/dashboard/projects/[id]/page.tsx
git commit -m "feat(ui): improve progress bar display in project detail

- Show 100%% progress when submission is submitted or approved
- Hide progress bar from professor view"

REM Commit 13: Remove progress from professor projects table
git add src/app/dashboard/professor/projects/page.tsx
git commit -m "feat(ui): remove progress display from professor views

- Remove Progress column from Student Projects table
- Remove progress from review and grade modals"

REM Commit 14: Add migration for new notification types
git add prisma/migrations/
git commit -m "chore(db): add migration for new notification types"

REM Commit 15: Clean up - remove temp files
git add .gitignore
git commit -m "chore: update gitignore" --allow-empty

echo.
echo ========================================
echo All commits completed!
echo ========================================
echo.
git log --oneline -15
echo.
pause
