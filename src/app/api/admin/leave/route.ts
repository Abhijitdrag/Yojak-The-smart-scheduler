import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { user } = await requireAuth(request, "ADMIN");
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await db.leaveRequest.findMany({
    orderBy: { date: "desc" },
    include: { faculty: { include: { user: true, department: true } } },
  });
  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const { user } = await requireAuth(request, "ADMIN");
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, action } = await request.json();
  if (!id || !["APPROVE", "REJECT"].includes(action)) {
    return NextResponse.json({ error: "id and valid action are required" }, { status: 400 });
  }

  const lr = await db.leaveRequest.update({
    where: { id },
    data: {
      status: action === "APPROVE" ? "APPROVED" : "REJECTED",
      reviewedAt: new Date(),
      reviewedBy: user.id,
    }
  });

  if (lr.status === "APPROVED") {
    // Mark attendance as leave for the approved date
    await db.attendance.upsert({
      where: { facultyId_date: { facultyId: lr.facultyId, date: lr.date } },
      update: { status: "LEAVE", notes: lr.reason || undefined },
      create: { facultyId: lr.facultyId, date: lr.date, status: "LEAVE", notes: lr.reason || undefined }
    });
  }

  return NextResponse.json({ ok: true });
}


