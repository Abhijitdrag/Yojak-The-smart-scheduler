import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase-server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  const { user } = await requireAuth(request, "FACULTY");
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { subjectId, classroomId, dayOfWeek, start, end } = await request.json();
  if (!subjectId || !classroomId || !dayOfWeek || !start || !end) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const faculty = await db.facultyProfile.findFirst({ where: { userId: user.id } });
  if (!faculty) return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 });

  const today = new Date();
  const [sh, sm] = String(start).split(":").map(Number);
  const [eh, em] = String(end).split(":").map(Number);
  const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sh, sm, 0, 0);
  const endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), eh, em, 0, 0);

  const entry = await db.timetableEntry.create({
    data: {
      subjectId,
      facultyId: faculty.id,
      classroomId,
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      classType: "LECTURE",
      createdById: user.id,
    }
  });

  return NextResponse.json({ entry });
}


