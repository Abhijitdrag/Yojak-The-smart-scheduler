import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Starting simple seed...");

  // 1) Create departments
  const cse = await db.department.upsert({
    where: { code: "CSE" },
    update: {},
    create: { 
      code: "CSE", 
      name: "Computer Science & Engineering", 
      description: "CSE Department" 
    },
  });

  const ece = await db.department.upsert({
    where: { code: "ECE" },
    update: {},
    create: { 
      code: "ECE", 
      name: "Electronics & Communication", 
      description: "ECE Department" 
    },
  });

  // 2) Create admin user
  const admin = await db.user.upsert({
    where: { email: "admin@college.edu" },
    update: { role: "ADMIN", verificationStatus: "APPROVED", name: "Super Admin" },
    create: { 
      email: "admin@college.edu", 
      role: "ADMIN", 
      verificationStatus: "APPROVED", 
      name: "Super Admin" 
    },
  });

  // 3) Create some faculty
  const facultyEmails = [
    "faculty1@college.edu",
    "faculty2@college.edu", 
    "faculty3@college.edu",
    "faculty4@college.edu",
    "faculty5@college.edu"
  ];

  for (let i = 0; i < facultyEmails.length; i++) {
    const email = facultyEmails[i];
    const user = await db.user.upsert({
      where: { email },
      update: { role: "FACULTY", verificationStatus: "APPROVED", name: `Faculty ${i + 1}` },
      create: { 
        email, 
        role: "FACULTY", 
        verificationStatus: "APPROVED", 
        name: `Faculty ${i + 1}` 
      },
    });

    await db.facultyProfile.upsert({
      where: { userId: user.id },
      update: { 
        departmentId: i % 2 === 0 ? cse.id : ece.id,
        aadhaarNumber: `AAD-${1000 + i}`,
        teacherId: `TCH-${i + 1}`
      },
      create: { 
        userId: user.id, 
        departmentId: i % 2 === 0 ? cse.id : ece.id,
        aadhaarNumber: `AAD-${1000 + i}`,
        teacherId: `TCH-${i + 1}`
      },
    });
  }

  // 4) Create some students
  const studentEmails = [
    "student1@college.edu",
    "student2@college.edu",
    "student3@college.edu",
    "student4@college.edu",
    "student5@college.edu",
    "student6@college.edu",
    "student7@college.edu",
    "student8@college.edu"
  ];

  for (let i = 0; i < studentEmails.length; i++) {
    const email = studentEmails[i];
    const user = await db.user.upsert({
      where: { email },
      update: { role: "STUDENT", verificationStatus: "APPROVED", name: `Student ${i + 1}` },
      create: { 
        email, 
        role: "STUDENT", 
        verificationStatus: "APPROVED", 
        name: `Student ${i + 1}` 
      },
    });

    await db.studentProfile.upsert({
      where: { userId: user.id },
      update: { 
        departmentId: i % 2 === 0 ? cse.id : ece.id,
        semester: (i % 8) + 1,
        enrollmentId: `ENR-${i + 1}`
      },
      create: { 
        userId: user.id, 
        departmentId: i % 2 === 0 ? cse.id : ece.id,
        semester: (i % 8) + 1,
        enrollmentId: `ENR-${i + 1}`
      },
    });
  }

  // 5) Create some subjects
  const subjects = [
    { name: "Data Structures", code: "CSE-101", departmentId: cse.id, weeklyHours: 3, totalHours: 45, semester: 3, isLab: false },
    { name: "Algorithms", code: "CSE-102", departmentId: cse.id, weeklyHours: 3, totalHours: 45, semester: 4, isLab: false },
    { name: "Database Systems", code: "CSE-103", departmentId: cse.id, weeklyHours: 4, totalHours: 60, semester: 5, isLab: true },
    { name: "Digital Electronics", code: "ECE-101", departmentId: ece.id, weeklyHours: 3, totalHours: 45, semester: 2, isLab: false },
    { name: "Microprocessors", code: "ECE-102", departmentId: ece.id, weeklyHours: 4, totalHours: 60, semester: 4, isLab: true },
  ];

  for (const subject of subjects) {
    await db.subject.upsert({
      where: { code: subject.code },
      update: {},
      create: subject,
    });
  }

  // 6) Create some classrooms
  await db.classroom.upsert({
    where: { code: "CLS-101" },
    update: {},
    create: { 
      code: "CLS-101", 
      name: "Lecture Hall 101", 
      capacity: 60, 
      isLab: false, 
      departmentId: cse.id 
    },
  });

  await db.classroom.upsert({
    where: { code: "LAB-201" },
    update: {},
    create: { 
      code: "LAB-201", 
      name: "Computer Lab 201", 
      capacity: 40, 
      isLab: true, 
      departmentId: cse.id 
    },
  });

  console.log("Simple seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
