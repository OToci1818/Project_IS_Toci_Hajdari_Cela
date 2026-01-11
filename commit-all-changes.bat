@echo off
echo Starting commits for all changes...
echo.

REM Commit 1: Database migrations
git add prisma/migrations/
git commit -m "chore(db): add migration for new notification types"

REM Commit 2: Seed data updates
git add prisma/seed.ts
git commit -m "feat(seed): add sample notifications for all user types"

REM Commit 3: Package updates
git add package.json package-lock.json
git commit -m "chore(deps): update package dependencies"

REM Commit 4: Submission API fixes
git add src/app/api/projects/[id]/submission/route.ts
git commit -m "fix(submission): serialize BigInt and auto-complete tasks on submit"

REM Commit 5: Submission files API
git add src/app/api/projects/[id]/submission/files/
git commit -m "feat(api): add submission files upload endpoint"

REM Commit 6: Announcements API
git add src/app/api/announcements/
git commit -m "feat(api): add announcements endpoint for enrolled students"

REM Commit 7: Workload API
git add src/app/api/dashboard/workload/route.ts
git commit -m "feat(api): update workload endpoint"

REM Commit 8: Dashboard service
git add src/services/DashboardService.ts
git commit -m "feat(services): update dashboard service"

REM Commit 9: Main dashboard page
git add src/app/dashboard/page.tsx
git commit -m "feat(ui): update main dashboard page"

REM Commit 10: Analytics page
git add src/app/dashboard/analytics/page.tsx
git commit -m "feat(ui): add analytics page"

REM Commit 11: Courses page
git add src/app/dashboard/courses/page.tsx
git commit -m "feat(ui): add courses page"

REM Commit 12: Project detail page
git add src/app/dashboard/projects/[id]/page.tsx
git commit -m "feat(ui): show 100%% progress after submission and hide from professor"

REM Commit 13: Professor projects page
git add src/app/dashboard/professor/projects/page.tsx
git commit -m "feat(ui): remove progress column from professor projects view"

REM Commit 14: Professor announcements page
git add src/app/dashboard/professor/announcements/page.tsx
git commit -m "feat(ui): update professor announcements page"

REM Commit 15: SubmissionTab component
git add src/components/SubmissionTab.tsx
git commit -m "feat(components): add SubmissionTab component"

REM Commit 16: Components index
git add src/components/index.ts
git commit -m "chore(components): update components index exports"

REM Commit 17: Jest configuration
git add jest.config.js jest.setup.js
git commit -m "chore(tests): add Jest configuration"

REM Commit 18: Test files
git add src/__tests__/
git commit -m "test: add unit tests"

REM Commit 19: Documentation generators
git add generate_architecture_pdf.py generate_er_diagram.py generate_testing_pdf.py generate_tests_documentation.py
git commit -m "docs: add documentation generation scripts"

REM Commit 20: ER diagram
git add er_diagram.pdf
git commit -m "docs: add ER diagram PDF"

REM Commit 21: Professor features doc
git add professor-features.md
git commit -m "docs: add professor features documentation"

REM Commit 22: Test output
git add test_output.txt
git commit -m "chore: add test output file"

REM Commit 23: Uploads folder
git add uploads/
git commit -m "chore: add uploaded files"

REM Commit 24: Cleanup temp files
git add 1 nul commit.bat commit-all.bat commit-changes.bat
git commit -m "chore: cleanup temp batch files"

echo.
echo ========================================
echo All commits completed!
echo ========================================
echo.
git log --oneline -24
echo.
pause
