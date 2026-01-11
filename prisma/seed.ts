import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  try {
    console.log("🌱 Seeding database with realistic data...\n");

    // Demo user emails for cleanup
    const demoEmails = [
      "ana.marku@fti.edu.al",
      "bledi.hoxha@fti.edu.al",
      "dea.krasniqi@fti.edu.al",
      "erion.shehu@fti.edu.al",
      "fatjon.leka@fti.edu.al",
      "prof.ahmeti@fti.edu.al",
      // Also clean up old demo users if they exist
      "student@fti.edu.al",
      "professor@fti.edu.al",
    ];

    // Get existing demo users for cleanup
    const existingUsers = await prisma.user.findMany({
      where: { email: { in: demoEmails } },
      select: { id: true },
    });
    const existingUserIds = existingUsers.map((u) => u.id);

    if (existingUserIds.length > 0) {
      // Get projects led by these users
      const existingProjects = await prisma.project.findMany({
        where: { teamLeaderId: { in: existingUserIds } },
        select: { id: true },
      });
      const existingProjectIds = existingProjects.map((p) => p.id);

      // Delete announcements
      await prisma.announcement.deleteMany({
        where: {
          course: {
            professorId: { in: existingUserIds },
          },
        },
      });

      // Delete project reviews
      await prisma.projectReview.deleteMany({
        where: {
          OR: [
            { projectId: { in: existingProjectIds } },
            { professorId: { in: existingUserIds } },
          ],
        },
      });

      // Delete final submission files
      await prisma.finalSubmissionFile.deleteMany({
        where: {
          submission: {
            projectId: { in: existingProjectIds },
          },
        },
      });

      // Delete final submissions
      await prisma.finalSubmission.deleteMany({
        where: {
          projectId: { in: existingProjectIds },
        },
      });

      // Delete project grades
      await prisma.projectGrade.deleteMany({
        where: {
          OR: [
            { projectId: { in: existingProjectIds } },
            { professorId: { in: existingUserIds } },
          ],
        },
      });

      // Delete course enrollments
      await prisma.courseEnrollment.deleteMany({
        where: {
          OR: [
            { studentId: { in: existingUserIds } },
            { course: { professorId: { in: existingUserIds } } },
          ],
        },
      });

      // Delete courses
      await prisma.course.deleteMany({
        where: { professorId: { in: existingUserIds } },
      });

      // Delete notifications
      await prisma.notification.deleteMany({
        where: {
          OR: [
            { projectId: { in: existingProjectIds } },
            { userId: { in: existingUserIds } },
            { actorId: { in: existingUserIds } },
          ],
        },
      });

      // Delete comments
      await prisma.comment.deleteMany({
        where: {
          OR: [
            { task: { projectId: { in: existingProjectIds } } },
            { authorId: { in: existingUserIds } },
          ],
        },
      });

      // Delete files
      await prisma.file.deleteMany({
        where: {
          OR: [
            { task: { projectId: { in: existingProjectIds } } },
            { uploadedBy: { in: existingUserIds } },
          ],
        },
      });

      // Delete task history
      await prisma.taskHistory.deleteMany({
        where: {
          OR: [
            { task: { projectId: { in: existingProjectIds } } },
            { changedById: { in: existingUserIds } },
          ],
        },
      });

      // Delete tasks
      await prisma.task.deleteMany({
        where: {
          OR: [
            { projectId: { in: existingProjectIds } },
            { createdById: { in: existingUserIds } },
          ],
        },
      });

      // Nullify assignee references
      await prisma.task.updateMany({
        where: { assigneeId: { in: existingUserIds } },
        data: { assigneeId: null },
      });

      // Delete project memberships
      await prisma.projectUser.deleteMany({
        where: {
          OR: [
            { projectId: { in: existingProjectIds } },
            { userId: { in: existingUserIds } },
            { invitedById: { in: existingUserIds } },
          ],
        },
      });

      // Delete projects
      await prisma.project.deleteMany({
        where: { teamLeaderId: { in: existingUserIds } },
      });

      // Delete activity logs
      await prisma.activityLog.deleteMany({
        where: { userId: { in: existingUserIds } },
      });

      // Delete sessions
      await prisma.session.deleteMany({
        where: { userId: { in: existingUserIds } },
      });
    }

    // Delete existing demo users
    await prisma.user.deleteMany({
      where: { email: { in: demoEmails } },
    });

    console.log("🧹 Cleaned up existing demo data\n");

    // ============================================
    // CREATE USERS
    // ============================================
    const studentPassword = hashPassword("student123");
    const professorPassword = hashPassword("professor123");

    const ana = await prisma.user.create({
      data: {
        email: "ana.marku@fti.edu.al",
        passwordHash: studentPassword,
        fullName: "Ana Marku",
        role: "student",
        isActive: true,
      },
    });

    const bledi = await prisma.user.create({
      data: {
        email: "bledi.hoxha@fti.edu.al",
        passwordHash: studentPassword,
        fullName: "Bledi Hoxha",
        role: "student",
        isActive: true,
      },
    });

    const dea = await prisma.user.create({
      data: {
        email: "dea.krasniqi@fti.edu.al",
        passwordHash: studentPassword,
        fullName: "Dea Krasniqi",
        role: "student",
        isActive: true,
      },
    });

    const erion = await prisma.user.create({
      data: {
        email: "erion.shehu@fti.edu.al",
        passwordHash: studentPassword,
        fullName: "Erion Shehu",
        role: "team_leader",
        isActive: true,
      },
    });

    const fatjon = await prisma.user.create({
      data: {
        email: "fatjon.leka@fti.edu.al",
        passwordHash: studentPassword,
        fullName: "Fatjon Leka",
        role: "student",
        isActive: true,
      },
    });

    const professor = await prisma.user.create({
      data: {
        email: "prof.ahmeti@fti.edu.al",
        passwordHash: professorPassword,
        fullName: "Prof. Artan Ahmeti",
        role: "professor",
        isActive: true,
      },
    });

    console.log("✅ Created 6 users:");
    console.log("   Students (password: student123):");
    console.log("   - ana.marku@fti.edu.al (Ana Marku)");
    console.log("   - bledi.hoxha@fti.edu.al (Bledi Hoxha)");
    console.log("   - dea.krasniqi@fti.edu.al (Dea Krasniqi)");
    console.log("   - erion.shehu@fti.edu.al (Erion Shehu) [Team Leader]");
    console.log("   - fatjon.leka@fti.edu.al (Fatjon Leka)");
    console.log("   Professor (password: professor123):");
    console.log("   - prof.ahmeti@fti.edu.al (Prof. Artan Ahmeti)\n");

    // ============================================
    // CREATE COURSES
    // ============================================
    const cs401 = await prisma.course.create({
      data: {
        title: "Advanced Software Engineering",
        code: "CS401",
        description: "Advanced concepts in software engineering including architecture, testing, and DevOps.",
        semester: "Spring",
        year: 2026,
        professorId: professor.id,
        isActive: true,
      },
    });

    const cs350 = await prisma.course.create({
      data: {
        title: "Web Development",
        code: "CS350",
        description: "Full-stack web development with modern frameworks and databases.",
        semester: "Spring",
        year: 2026,
        professorId: professor.id,
        isActive: true,
      },
    });

    const cs480 = await prisma.course.create({
      data: {
        title: "Machine Learning",
        code: "CS480",
        description: "Introduction to machine learning algorithms and practical applications.",
        semester: "Fall",
        year: 2025,
        professorId: professor.id,
        isActive: true,
      },
    });

    console.log("✅ Created 3 courses: CS401, CS350, CS480\n");

    // ============================================
    // CREATE COURSE ENROLLMENTS
    // ============================================
    // CS401 (E-Commerce) - All students except Fatjon
    await prisma.courseEnrollment.createMany({
      data: [
        { courseId: cs401.id, studentId: ana.id },
        { courseId: cs401.id, studentId: bledi.id },
        { courseId: cs401.id, studentId: dea.id },
        { courseId: cs401.id, studentId: erion.id },
      ],
    });

    // CS350 (Student Portal) - Ana, Bledi, Fatjon
    await prisma.courseEnrollment.createMany({
      data: [
        { courseId: cs350.id, studentId: ana.id },
        { courseId: cs350.id, studentId: bledi.id },
        { courseId: cs350.id, studentId: fatjon.id },
      ],
    });

    // CS480 (ML Project) - Dea, Erion
    await prisma.courseEnrollment.createMany({
      data: [
        { courseId: cs480.id, studentId: dea.id },
        { courseId: cs480.id, studentId: erion.id },
      ],
    });

    console.log("✅ Created course enrollments for all students\n");

    // ============================================
    // CREATE PROJECTS
    // ============================================

    // Project 1: E-Commerce Platform (Erion as leader, Ana/Bledi/Dea as members)
    const ecommerce = await prisma.project.create({
      data: {
        title: "E-Commerce Platform",
        description:
          "Build a full-stack e-commerce platform with product catalog, shopping cart, checkout process, and admin dashboard. Uses React frontend with Node.js backend and PostgreSQL database.",
        courseCode: "CS401",
        courseId: cs401.id,
        projectType: "group",
        status: "active",
        teamLeaderId: erion.id,
        deadlineDate: new Date("2026-02-28"),
      },
    });

    // Add members to E-Commerce project
    await prisma.projectUser.createMany({
      data: [
        {
          projectId: ecommerce.id,
          userId: erion.id,
          role: "team_leader",
          inviteStatus: "accepted",
          invitedById: erion.id,
          joinedAt: new Date(),
        },
        {
          projectId: ecommerce.id,
          userId: ana.id,
          role: "student",
          inviteStatus: "accepted",
          invitedById: erion.id,
          joinedAt: new Date(),
        },
        {
          projectId: ecommerce.id,
          userId: bledi.id,
          role: "student",
          inviteStatus: "accepted",
          invitedById: erion.id,
          joinedAt: new Date(),
        },
        {
          projectId: ecommerce.id,
          userId: dea.id,
          role: "student",
          inviteStatus: "accepted",
          invitedById: erion.id,
          joinedAt: new Date(),
        },
      ],
    });

    // Project 2: Student Portal (Ana as leader, Bledi/Fatjon as members)
    const portal = await prisma.project.create({
      data: {
        title: "Student Portal",
        description:
          "A web portal for students to view grades, manage course registrations, and communicate with professors. Features real-time notifications and calendar integration.",
        courseCode: "CS350",
        courseId: cs350.id,
        projectType: "group",
        status: "active",
        teamLeaderId: ana.id,
        deadlineDate: new Date("2026-03-15"),
      },
    });

    // Add members to Student Portal project
    await prisma.projectUser.createMany({
      data: [
        {
          projectId: portal.id,
          userId: ana.id,
          role: "team_leader",
          inviteStatus: "accepted",
          invitedById: ana.id,
          joinedAt: new Date(),
        },
        {
          projectId: portal.id,
          userId: bledi.id,
          role: "student",
          inviteStatus: "accepted",
          invitedById: ana.id,
          joinedAt: new Date(),
        },
        {
          projectId: portal.id,
          userId: fatjon.id,
          role: "student",
          inviteStatus: "accepted",
          invitedById: ana.id,
          joinedAt: new Date(),
        },
      ],
    });

    // Project 3: Machine Learning Model (Dea as leader, Erion as member) - COMPLETED
    const mlProject = await prisma.project.create({
      data: {
        title: "Machine Learning Model",
        description:
          "Develop a machine learning model for sentiment analysis on Albanian social media text. Includes data collection, preprocessing, model training, and API deployment.",
        courseCode: "CS480",
        courseId: cs480.id,
        projectType: "group",
        status: "completed",
        teamLeaderId: dea.id,
        deadlineDate: new Date("2025-12-20"),
      },
    });

    // Add members to ML project
    await prisma.projectUser.createMany({
      data: [
        {
          projectId: mlProject.id,
          userId: dea.id,
          role: "team_leader",
          inviteStatus: "accepted",
          invitedById: dea.id,
          joinedAt: new Date(),
        },
        {
          projectId: mlProject.id,
          userId: erion.id,
          role: "student",
          inviteStatus: "accepted",
          invitedById: dea.id,
          joinedAt: new Date(),
        },
      ],
    });

    console.log("✅ Created 3 projects:");
    console.log("   - E-Commerce Platform (CS401) - Active, led by Erion");
    console.log("   - Student Portal (CS350) - Active, led by Ana");
    console.log("   - Machine Learning Model (CS480) - Completed, led by Dea\n");

    // ============================================
    // CREATE TASKS
    // ============================================

    // E-Commerce Platform Tasks (5 tasks)
    await prisma.task.createMany({
      data: [
        {
          projectId: ecommerce.id,
          title: "Design database schema",
          description:
            "Create ERD and implement PostgreSQL schema for products, users, orders, and payments.",
          status: "done",
          priority: "high",
          assigneeId: erion.id,
          createdById: erion.id,
          dueDate: new Date("2026-01-20"),
        },
        {
          projectId: ecommerce.id,
          title: "Implement user authentication",
          description:
            "Set up JWT-based authentication with login, register, and password reset functionality.",
          status: "done",
          priority: "high",
          assigneeId: bledi.id,
          createdById: erion.id,
          dueDate: new Date("2026-01-25"),
        },
        {
          projectId: ecommerce.id,
          title: "Build product catalog UI",
          description:
            "Create responsive product listing page with filters, search, and pagination.",
          status: "in_progress",
          priority: "high",
          assigneeId: ana.id,
          createdById: erion.id,
          dueDate: new Date("2026-02-05"),
        },
        {
          projectId: ecommerce.id,
          title: "Shopping cart functionality",
          description:
            "Implement add to cart, update quantity, remove items, and persist cart in local storage.",
          status: "to_do",
          priority: "medium",
          assigneeId: dea.id,
          createdById: erion.id,
          dueDate: new Date("2026-02-15"),
        },
        {
          projectId: ecommerce.id,
          title: "Payment integration",
          description:
            "Integrate Stripe payment gateway for secure checkout process.",
          status: "to_do",
          priority: "medium",
          assigneeId: bledi.id,
          createdById: erion.id,
          dueDate: new Date("2026-02-25"),
        },
      ],
    });

    // Student Portal Tasks (5 tasks)
    await prisma.task.createMany({
      data: [
        {
          projectId: portal.id,
          title: "Set up Next.js project structure",
          description:
            "Initialize project with TypeScript, Tailwind CSS, and folder structure for components and pages.",
          status: "done",
          priority: "high",
          assigneeId: ana.id,
          createdById: ana.id,
          dueDate: new Date("2026-01-15"),
        },
        {
          projectId: portal.id,
          title: "Create grades display component",
          description:
            "Build a table component to display student grades with sorting and filtering options.",
          status: "in_progress",
          priority: "high",
          assigneeId: bledi.id,
          createdById: ana.id,
          dueDate: new Date("2026-02-01"),
        },
        {
          projectId: portal.id,
          title: "Implement course registration",
          description:
            "Allow students to browse available courses and register for upcoming semester.",
          status: "to_do",
          priority: "medium",
          assigneeId: fatjon.id,
          createdById: ana.id,
          dueDate: new Date("2026-02-20"),
        },
        {
          projectId: portal.id,
          title: "Build messaging system",
          description:
            "Create a messaging interface for students to communicate with professors.",
          status: "to_do",
          priority: "low",
          assigneeId: ana.id,
          createdById: ana.id,
          dueDate: new Date("2026-03-01"),
        },
        {
          projectId: portal.id,
          title: "Calendar integration",
          description:
            "Add calendar view showing class schedule, assignment due dates, and exam dates.",
          status: "to_do",
          priority: "medium",
          assigneeId: bledi.id,
          createdById: ana.id,
          dueDate: new Date("2026-03-10"),
        },
      ],
    });

    // Machine Learning Project Tasks (5 tasks - all completed)
    await prisma.task.createMany({
      data: [
        {
          projectId: mlProject.id,
          title: "Collect training data",
          description:
            "Scrape Albanian social media posts and label them for sentiment (positive, negative, neutral).",
          status: "done",
          priority: "high",
          assigneeId: dea.id,
          createdById: dea.id,
          dueDate: new Date("2025-11-01"),
        },
        {
          projectId: mlProject.id,
          title: "Data preprocessing pipeline",
          description:
            "Clean text data, handle Albanian characters, remove stopwords, and tokenize.",
          status: "done",
          priority: "high",
          assigneeId: dea.id,
          createdById: dea.id,
          dueDate: new Date("2025-11-15"),
        },
        {
          projectId: mlProject.id,
          title: "Train ML model",
          description:
            "Experiment with different models (BERT, LSTM) and tune hyperparameters for best accuracy.",
          status: "done",
          priority: "high",
          assigneeId: erion.id,
          createdById: dea.id,
          dueDate: new Date("2025-12-01"),
        },
        {
          projectId: mlProject.id,
          title: "Build REST API",
          description:
            "Create Flask API endpoint to serve predictions from trained model.",
          status: "done",
          priority: "medium",
          assigneeId: erion.id,
          createdById: dea.id,
          dueDate: new Date("2025-12-10"),
        },
        {
          projectId: mlProject.id,
          title: "Write documentation",
          description:
            "Document API usage, model architecture, and create README for GitHub repository.",
          status: "done",
          priority: "low",
          assigneeId: dea.id,
          createdById: dea.id,
          dueDate: new Date("2025-12-18"),
        },
      ],
    });

    console.log("✅ Created 15 tasks across all projects:");
    console.log("   E-Commerce Platform: 2 done, 1 in progress, 2 to do");
    console.log("   Student Portal: 1 done, 1 in progress, 3 to do");
    console.log("   Machine Learning Model: 5 done (completed project)\n");

    // ============================================
    // CREATE PROJECT GRADES
    // ============================================
    await prisma.projectGrade.create({
      data: {
        projectId: mlProject.id,
        professorId: professor.id,
        gradeType: "numeric",
        numericGrade: 92,
        feedback: "Excellent work on the sentiment analysis model. The data preprocessing pipeline was particularly well-designed, and the API documentation was thorough. Minor improvements could be made in model interpretability.",
      },
    });

    console.log("✅ Created grade for ML Project: 92/100\n");

    // ============================================
    // CREATE FINAL SUBMISSIONS
    // ============================================
    await prisma.finalSubmission.create({
      data: {
        projectId: mlProject.id,
        description: "Final submission for Albanian Sentiment Analysis ML Model. Includes trained model, API documentation, and source code.",
        status: "approved",
        submittedAt: new Date("2025-12-18"),
        submittedById: dea.id,
        reviewedAt: new Date("2025-12-20"),
        reviewedById: professor.id,
        reviewComment: "Well-documented and professionally presented. The model shows good accuracy on the test set.",
      },
    });

    console.log("✅ Created final submission for ML Project\n");

    // ============================================
    // CREATE ANNOUNCEMENTS
    // ============================================
    await prisma.announcement.createMany({
      data: [
        {
          courseId: cs401.id,
          professorId: professor.id,
          title: "Project Deadline Reminder",
          content: "Reminder: The E-Commerce Platform project is due on February 28th. Make sure all team members have committed their code and the final submission is ready.",
          isPinned: true,
        },
        {
          courseId: cs350.id,
          professorId: professor.id,
          title: "Office Hours Change",
          content: "Office hours for this week will be moved from Wednesday 2-4pm to Thursday 3-5pm due to a faculty meeting.",
          isPinned: false,
        },
        {
          courseId: cs480.id,
          professorId: professor.id,
          title: "Grades Posted",
          content: "Final grades for the Machine Learning project have been posted. Great work everyone! Feel free to schedule a meeting to discuss your feedback.",
          isPinned: true,
        },
      ],
    });

    console.log("✅ Created 3 announcements\n");

    // ============================================
    // CREATE PROJECT REVIEWS
    // ============================================
    await prisma.projectReview.create({
      data: {
        projectId: mlProject.id,
        professorId: professor.id,
        content: "Overall, this project demonstrates a strong understanding of NLP concepts and practical ML implementation. The team showed excellent collaboration and met all milestones on time. Recommendations for future work: consider fine-tuning with more Albanian-specific data and implementing a simple web interface for demonstration.",
      },
    });

    console.log("✅ Created project review for ML Project\n");

    // ============================================
    // CREATE NOTIFICATIONS
    // ============================================

    // Task completion notifications (for Ana - she'll see task completed by others)
    await prisma.notification.createMany({
      data: [
        // Task completed notification - Bledi completed auth task, Ana gets notified
        {
          userId: ana.id,
          type: "task_completed",
          title: "Task Completed",
          message: "Bledi Hoxha completed 'Implement user authentication' in E-Commerce Platform",
          projectId: ecommerce.id,
          actorId: bledi.id,
          isRead: false,
          metadata: { taskTitle: "Implement user authentication" },
        },
        // Task completed notification - Erion completed DB schema, Ana gets notified
        {
          userId: ana.id,
          type: "task_completed",
          title: "Task Completed",
          message: "Erion Shehu completed 'Design database schema' in E-Commerce Platform",
          projectId: ecommerce.id,
          actorId: erion.id,
          isRead: false,
          metadata: { taskTitle: "Design database schema" },
        },
        // Task assigned notification for Ana
        {
          userId: ana.id,
          type: "task_assigned",
          title: "New Task Assigned",
          message: "Erion Shehu assigned you 'Build product catalog UI' in E-Commerce Platform",
          projectId: ecommerce.id,
          actorId: erion.id,
          isRead: false,
          metadata: { taskTitle: "Build product catalog UI" },
        },
        // Announcement notification for Ana (CS401)
        {
          userId: ana.id,
          type: "announcement_posted",
          title: "New Announcement",
          message: "Prof. Artan Ahmeti posted 'Project Deadline Reminder' in CS401",
          actorId: professor.id,
          isRead: false,
          metadata: { courseCode: "CS401", announcementTitle: "Project Deadline Reminder" },
        },
        // Announcement notification for Ana (CS350)
        {
          userId: ana.id,
          type: "announcement_posted",
          title: "New Announcement",
          message: "Prof. Artan Ahmeti posted 'Office Hours Change' in CS350",
          actorId: professor.id,
          isRead: false,
          metadata: { courseCode: "CS350", announcementTitle: "Office Hours Change" },
        },
      ],
    });

    // Notifications for Erion (team leader of E-Commerce)
    await prisma.notification.createMany({
      data: [
        // Task completed by Bledi
        {
          userId: erion.id,
          type: "task_completed",
          title: "Task Completed",
          message: "Bledi Hoxha completed 'Implement user authentication' in E-Commerce Platform",
          projectId: ecommerce.id,
          actorId: bledi.id,
          isRead: false,
          metadata: { taskTitle: "Implement user authentication" },
        },
        // Project status changed notification (ML project completed)
        {
          userId: erion.id,
          type: "project_status_changed",
          title: "Project Status Changed",
          message: "Dea Krasniqi changed 'Machine Learning Model' status to completed",
          projectId: mlProject.id,
          actorId: dea.id,
          isRead: false,
          metadata: { newStatus: "completed" },
        },
        // Announcement for CS401
        {
          userId: erion.id,
          type: "announcement_posted",
          title: "New Announcement",
          message: "Prof. Artan Ahmeti posted 'Project Deadline Reminder' in CS401",
          actorId: professor.id,
          isRead: false,
          metadata: { courseCode: "CS401", announcementTitle: "Project Deadline Reminder" },
        },
      ],
    });

    // Notifications for Professor
    await prisma.notification.createMany({
      data: [
        // Project created notification
        {
          userId: professor.id,
          type: "project_created",
          title: "New Project Created",
          message: "Erion Shehu created 'E-Commerce Platform' in CS401",
          projectId: ecommerce.id,
          actorId: erion.id,
          isRead: false,
          metadata: { courseCode: "CS401" },
        },
        // Another project created
        {
          userId: professor.id,
          type: "project_created",
          title: "New Project Created",
          message: "Ana Marku created 'Student Portal' in CS350",
          projectId: portal.id,
          actorId: ana.id,
          isRead: false,
          metadata: { courseCode: "CS350" },
        },
        // Project ready for submission
        {
          userId: professor.id,
          type: "project_ready_for_submission",
          title: "Project Ready for Review",
          message: "'Machine Learning Model' is 100% complete and ready for final submission",
          projectId: mlProject.id,
          actorId: dea.id,
          isRead: true, // This one is read since project was graded
          metadata: { projectTitle: "Machine Learning Model" },
        },
        // Project completed notification
        {
          userId: professor.id,
          type: "project_completed",
          title: "Project Completed",
          message: "Dea Krasniqi marked 'Machine Learning Model' as completed",
          projectId: mlProject.id,
          actorId: dea.id,
          isRead: true,
          metadata: {},
        },
      ],
    });

    // Notifications for Dea (team leader of ML project)
    await prisma.notification.createMany({
      data: [
        // Task completed by Erion in ML project
        {
          userId: dea.id,
          type: "task_completed",
          title: "Task Completed",
          message: "Erion Shehu completed 'Train ML model' in Machine Learning Model",
          projectId: mlProject.id,
          actorId: erion.id,
          isRead: true,
          metadata: { taskTitle: "Train ML model" },
        },
        // Project graded notification
        {
          userId: dea.id,
          type: "project_graded",
          title: "Project Graded",
          message: "Prof. Artan Ahmeti graded 'Machine Learning Model': 92/100",
          projectId: mlProject.id,
          actorId: professor.id,
          isRead: false,
          metadata: { grade: 92, feedback: "Excellent work!" },
        },
        // Announcement for CS480
        {
          userId: dea.id,
          type: "announcement_posted",
          title: "New Announcement",
          message: "Prof. Artan Ahmeti posted 'Grades Posted' in CS480",
          actorId: professor.id,
          isRead: false,
          metadata: { courseCode: "CS480", announcementTitle: "Grades Posted" },
        },
      ],
    });

    // Notifications for Bledi
    await prisma.notification.createMany({
      data: [
        // Task assigned
        {
          userId: bledi.id,
          type: "task_assigned",
          title: "New Task Assigned",
          message: "Erion Shehu assigned you 'Payment integration' in E-Commerce Platform",
          projectId: ecommerce.id,
          actorId: erion.id,
          isRead: false,
          metadata: { taskTitle: "Payment integration" },
        },
        // Task due approaching
        {
          userId: bledi.id,
          type: "task_due_approaching",
          title: "Task Due Soon",
          message: "'Create grades display component' is due in 3 days",
          projectId: portal.id,
          isRead: false,
          metadata: { taskTitle: "Create grades display component", daysUntilDue: 3 },
        },
        // Announcement for CS350
        {
          userId: bledi.id,
          type: "announcement_posted",
          title: "New Announcement",
          message: "Prof. Artan Ahmeti posted 'Office Hours Change' in CS350",
          actorId: professor.id,
          isRead: false,
          metadata: { courseCode: "CS350", announcementTitle: "Office Hours Change" },
        },
      ],
    });

    console.log("✅ Created notifications for all users\n");

    // ============================================
    // SUMMARY
    // ============================================
    console.log("🎉 Database seeding completed successfully!");
    console.log("\n📋 Quick Login Reference:");
    console.log("┌─────────────────────────────────────────────────────────┐");
    console.log("│ Email                        │ Password     │ Role      │");
    console.log("├─────────────────────────────────────────────────────────┤");
    console.log("│ ana.marku@fti.edu.al         │ student123   │ student   │");
    console.log("│ bledi.hoxha@fti.edu.al       │ student123   │ student   │");
    console.log("│ dea.krasniqi@fti.edu.al      │ student123   │ student   │");
    console.log("│ erion.shehu@fti.edu.al       │ student123   │ team_leader│");
    console.log("│ fatjon.leka@fti.edu.al       │ student123   │ student   │");
    console.log("│ prof.ahmeti@fti.edu.al       │ professor123 │ professor │");
    console.log("└─────────────────────────────────────────────────────────┘");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
