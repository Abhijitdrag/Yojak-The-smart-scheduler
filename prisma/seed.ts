import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const facultyNames = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace"];
const studentNames = ["John", "Jane", "Tom", "Emma", "Liam", "Olivia", "Noah", "Sophia", "Mia", "Lucas"];

async function main() {
  // 1) Departments
  const departments = await Promise.all([
    db.department.upsert({ where: { code: "CSE" }, update: {}, create: { code: "CSE", name: "Computer Science & Engineering", description: "CSE Department" } }),
    db.department.upsert({ where: { code: "ECE" }, update: {}, create: { code: "ECE", name: "Electronics & Communication", description: "ECE Department" } }),
    db.department.upsert({ where: { code: "ME" }, update: {}, create: { code: "ME", name: "Mechanical Engineering", description: "ME Department" } }),
  ]);
  const [cse, ece, mech] = departments;

  // 2) Admin
  const admin = await db.user.upsert({
    where: { email: "admin@college.edu" },
    update: { role: "ADMIN", verificationStatus: "APPROVED", name: "Super Admin" },
    create: { email: "admin@college.edu", role: "ADMIN", verificationStatus: "APPROVED", name: "Super Admin" },
  });

  // 3) Faculty
  const allFaculty: any[] = [];
  for (const dept of departments) {
    for (let i = 0; i < 5; i++) {
      const name = facultyNames[i % facultyNames.length] + `_${dept.code}`;
      const email = `${name.toLowerCase()}@college.edu`;
      const user = await db.user.upsert({
        where: { email },
        update: { role: "FACULTY", verificationStatus: "APPROVED", name },
        create: { email, role: "FACULTY", verificationStatus: "APPROVED", name },
      });
      const prof = await db.facultyProfile.upsert({
        where: { userId: user.id },
        update: { departmentId: dept.id, aadhaarNumber: `AAD-${rand(1000,9999)}-${rand(1000,9999)}`, teacherId: `TCH-${dept.code}-${i+1}` },
        create: { userId: user.id, departmentId: dept.id, aadhaarNumber: `AAD-${rand(1000,9999)}-${rand(1000,9999)}`, teacherId: `TCH-${dept.code}-${i+1}` },
      });
      allFaculty.push(prof);
    }
  }

  // 4) Students
  const allStudents: any[] = [];
  for (const dept of departments) {
    for (let i = 0; i < 10; i++) {
      const name = studentNames[i % studentNames.length] + `_${dept.code}`;
      const email = `${name.toLowerCase()}@college.edu`;
      const user = await db.user.upsert({
        where: { email },
        update: { role: "STUDENT", verificationStatus: "APPROVED", name },
        create: { email, role: "STUDENT", verificationStatus: "APPROVED", name },
      });
      const profile = await db.studentProfile.upsert({
        where: { userId: user.id },
        update: { departmentId: dept.id, semester: rand(1, 8), enrollmentId: `ENR-${dept.code}-${i+1}` },
        create: { userId: user.id, departmentId: dept.id, semester: rand(1, 8), enrollmentId: `ENR-${dept.code}-${i+1}` },
      });
      allStudents.push(profile);
    }
  }

  // 5) Classrooms
  const cls1 = await db.classroom.upsert({ where: { code: "CLS-101" }, update: {}, create: { code: "CLS-101", name: "Lecture 101", capacity: 60, isLab: false, departmentId: cse.id } });
  const cls2 = await db.classroom.upsert({ where: { code: "CLS-102" }, update: {}, create: { code: "CLS-102", name: "Lecture 102", capacity: 60, isLab: false, departmentId: cse.id } });
  const lab1 = await db.classroom.upsert({ where: { code: "LAB-201" }, update: {}, create: { code: "LAB-201", name: "Lab 201", capacity: 40, isLab: true, departmentId: cse.id } });

  // 6) Subjects
  const allSubjects: any[] = [];
  for (const dept of departments) {
    for (let i = 1; i <= 5; i++) {
      const code = `${dept.code}-SUB${i}`;
      const subj = await db.subject.upsert({
        where: { code },
        update: {},
        create: { name: `Subject ${i} ${dept.code}`, code, departmentId: dept.id, weeklyHours: rand(2,4), totalHours: rand(20,50), semester: rand(1,8), isLab: i%2===0 },
      });
      allSubjects.push(subj);
    }
  }

  // 7) Map subjects to random faculty
  for (const subj of allSubjects) {
    const fac = allFaculty.filter(f => f.departmentId === subj.departmentId);
    const assigned = fac[rand(0, fac.length-1)];
    await db.subjectFaculty.upsert({
      where: { subjectId_facultyId: { subjectId: subj.id, facultyId: assigned.id } },
      update: {},
      create: { subjectId: subj.id, facultyId: assigned.id },
    });
  }

  // 8) Timetable
  for (const subj of allSubjects) {
    const fac = await db.subjectFaculty.findFirst({ where: { subjectId: subj.id } });
    if (!fac) continue;
    const room = subj.isLab ? lab1 : (rand(0,1)? cls1: cls2);
    const day = rand(1,5);
    const start = rand(8,14);
    const end = start + (subj.isLab?2:1);
    await db.timetableEntry.create({
      data: {
        subjectId: subj.id,
        facultyId: fac.facultyId,
        classroomId: room.id,
        dayOfWeek: day,
        startTime: new Date(new Date().setHours(start,0,0,0)),
        endTime: new Date(new Date().setHours(end,0,0,0)),
        classType: subj.isLab?"LAB":"LECTURE",
        createdById: admin.id,
      },
    });
  }

  // 9) Syllabus progress
  for (const subj of allSubjects) {
    const fac = await db.subjectFaculty.findFirst({ where: { subjectId: subj.id } });
    if (!fac) continue;
    await db.syllabusProgress.upsert({
      where: { facultyId_subjectId: { facultyId: fac.facultyId, subjectId: subj.id } },
      update: { coveredPercent: rand(20,100), remarks: "Random progress" },
      create: { facultyId: fac.facultyId, subjectId: subj.id, coveredPercent: rand(20,100), remarks: "Random progress" },
    });
  }

  // 10) Attendance
  const today = new Date();
  for (let d = 1; d <= 7; d++) {
    const date = new Date(today);
    date.setDate(today.getDate()-d);
    for (const fac of allFaculty) {
      await db.attendance.upsert({
        where: { facultyId_date: { facultyId: fac.id, date } },
        update: { status: rand(0,1)? "PRESENT":"LEAVE" },
        create: { facultyId: fac.id, date, status: rand(0,1)? "PRESENT":"LEAVE" },
      });
    }
  }

  // 11) NEP compliance
  const lastMonday = new Date();
  lastMonday.setDate(lastMonday.getDate() - ((lastMonday.getDay()+6)%7));
  lastMonday.setHours(0,0,0,0);

  for (const fac of allFaculty) {
    const subjects = await db.syllabusProgress.findMany({ where: { facultyId: fac.id } });
    const total = subjects.length;
    const compliant = subjects.filter(s => s.coveredPercent>=50).length;
    await db.nepCompliance.upsert({
      where: { facultyId_week: { facultyId: fac.id, week: lastMonday } },
      update: { isCompliant: compliant === total, notes: `${total - compliant} subjects behind` },
      create: { facultyId: fac.id, week: lastMonday, isCompliant: compliant === total, notes: `${total - compliant} subjects behind` },
    });
  }

  console.log("Random seed complete.");
}

main().finally(async () => { await db.$disconnect(); });
