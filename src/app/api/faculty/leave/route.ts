import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "FACULTY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const faculty = await db.facultyProfile.findFirst({ where: { userId: session.user.id } });
    if (!faculty) return NextResponse.json({ requests: [] });

    const requests = await db.leaveRequest.findMany({ where: { facultyId: faculty.id }, orderBy: { date: "desc" } });
    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Faculty leave fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch leave requests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "FACULTY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date, reason } = body;

    const faculty = await db.facultyProfile.findFirst({ where: { userId: session.user.id } });
    if (!faculty) return NextResponse.json({ error: "Faculty profile not found" }, { status: 404 });

    const requestRow = await db.leaveRequest.upsert({
      where: { facultyId_date: { facultyId: faculty.id, date: new Date(date) } },
      update: { reason, status: "PENDING" },
      create: { facultyId: faculty.id, date: new Date(date), reason, status: "PENDING" }
    });

    return NextResponse.json(requestRow);
  } catch (error) {
    console.error("Faculty leave creation error:", error);
    return NextResponse.json({ error: "Failed to create leave request" }, { status: 500 });
  }
}