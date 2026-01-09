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
    console.log("🌱 Seeding database...");

    // Delete existing demo users
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["student@fti.edu.al", "professor@fti.edu.al"],
        },
      },
    });

    // Create a demo student
    const passwordHash = hashPassword("password123");
    const demoStudent = await prisma.user.create({
      data: {
        email: "student@fti.edu.al",
        passwordHash: passwordHash,
        fullName: "Demo Student",
        role: "student",
        isActive: true,
      },
    });

    console.log("✅ Demo student created:");
    console.log(`   Email: ${demoStudent.email}`);
    console.log(`   Password: password123`);
    console.log(`   Role: ${demoStudent.role}`);

    // Create a demo professor
    const professorHash = hashPassword("professor123");
    const demoProfessor = await prisma.user.create({
      data: {
        email: "professor@fti.edu.al",
        passwordHash: professorHash,
        fullName: "Demo Professor",
        role: "professor",
        isActive: true,
      },
    });

    console.log("\n✅ Demo professor created:");
    console.log(`   Email: ${demoProfessor.email}`);
    console.log(`   Password: professor123`);
    console.log(`   Role: ${demoProfessor.role}`);

    console.log("\n🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
