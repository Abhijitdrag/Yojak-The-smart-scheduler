import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, { auth: { persistSession: false } });
}

async function requireAdmin(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return false;
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return false;
  const role = (data.user.user_metadata as any)?.role;
  return role === "ADMIN";
}

export async function GET(request: Request) {
  const ok = await requireAdmin(request);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const students = await db.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, email: true, name: true, studentProfile: true }
  });
  return NextResponse.json({ students });
}

export async function POST(request: Request) {
  const ok = await requireAdmin(request);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, name, departmentId, semester } = await request.json();
  if (!email || !departmentId || !semester) {
    return NextResponse.json({ error: "email, departmentId, semester are required" }, { status: 400 });
  }

  const user = await db.user.upsert({
    where: { email },
    update: { role: "STUDENT", verificationStatus: "APPROVED", name },
    create: { email, name, role: "STUDENT", verificationStatus: "APPROVED" }
  });

  await db.studentProfile.upsert({
    where: { userId: user.id },
    update: { departmentId, semester: Number(semester) },
    create: { userId: user.id, departmentId, semester: Number(semester) }
  });

  return NextResponse.json({ userId: user.id });
}

export async function PUT(request: Request) {
  const ok = await requireAdmin(request);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId, name, departmentId, semester } = await request.json();
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  if (name !== undefined) {
    await db.user.update({ where: { id: userId }, data: { name } });
  }

  if (departmentId || semester !== undefined) {
    await db.studentProfile.upsert({
      where: { userId },
      update: {
        ...(departmentId ? { departmentId } : {}),
        ...(semester !== undefined ? { semester: Number(semester) } : {}),
      },
      create: {
        userId,
        departmentId: departmentId!,
        semester: Number(semester ?? 1)
      }
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const ok = await requireAdmin(request);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  await db.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}


