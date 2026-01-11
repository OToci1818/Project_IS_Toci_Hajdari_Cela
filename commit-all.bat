@echo off

echo Commit 1: Package updates
git add package.json package-lock.json
git commit -m "chore: update package dependencies"

echo Commit 2: Prisma schema and seed updates
git add prisma/schema.prisma prisma/seed.ts
git commit -m "feat(db): update prisma schema and seed data"

echo Commit 3: Project and task API routes
git add src/app/api/projects/route.ts src/app/api/tasks/route.ts
git commit -m "feat(api): update projects and tasks API routes"

echo Commit 4: New API routes - avatars, courses, search, users
git add src/app/api/avatars/ src/app/api/courses/ src/app/api/search/ src/app/api/users/
git commit -m "feat(api): add avatars, courses, search, and users API routes"

echo Commit 5: New API routes - dashboard, notifications, professor, grades, submissions
git add src/app/api/dashboard/ src/app/api/notifications/ src/app/api/professor/ src/app/api/projects/[id]/grade/ src/app/api/projects/[id]/submission/
git commit -m "feat(api): add dashboard analytics, notifications, professor, and grading API routes"

echo Commit 6: Components updates
git add src/components/Sidebar.tsx src/components/TaskDetailModal.tsx src/components/SearchBar.tsx src/components/index.ts
git commit -m "feat(components): update sidebar, task modal, and add search bar"

echo Commit 7: Services updates
git add src/services/DashboardService.ts src/services/NotificationService.ts src/services/ProjectService.ts src/services/CourseService.ts src/services/index.ts
git commit -m "feat(services): update dashboard, notification, project services and add course service"

echo Commit 8: Contexts updates
git add src/contexts/NotificationContext.tsx
git commit -m "feat(contexts): update notification context"

echo Commit 9: Dashboard pages updates
git add src/app/dashboard/page.tsx src/app/dashboard/invites/page.tsx src/app/dashboard/my-tasks/page.tsx src/app/dashboard/projects/page.tsx src/app/dashboard/projects/[id]/page.tsx
git commit -m "feat(pages): update dashboard and project pages"

echo Commit 10: New dashboard pages
git add src/app/dashboard/analytics/ src/app/dashboard/calendar/ src/app/dashboard/courses/ src/app/dashboard/professor/ src/app/dashboard/settings/ src/app/dashboard/workload/
git commit -m "feat(pages): add analytics, calendar, courses, professor, settings, and workload pages"

echo All commits completed!
pause
