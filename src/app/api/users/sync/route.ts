import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db } from "@/lib/db";

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  try {
    const auth = request.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const u = data.user;

    // Get existing user to preserve role and verificationStatus
    const existingUser = await db.user.findUnique({ where: { email: u.email! } });

    // Determine role for new users
    let defaultRole = "STUDENT";
    let defaultStatus = "PENDING";
    
    // Check if this should be an admin user
    if (u.email?.includes("admin") || u.email?.includes("administrator")) {
      defaultRole = "ADMIN";
      defaultStatus = "APPROVED";
    }

    const user = await db.user.upsert({
      where: { email: u.email! },
      update: {
        name: (u.user_metadata as any)?.full_name ?? u.user_metadata?.name ?? null,
        image: (u.user_metadata as any)?.avatar_url ?? null,
        role: existingUser?.role ?? defaultRole, // Preserve existing role or use default
        verificationStatus: existingUser?.verificationStatus ?? defaultStatus, // Preserve existing status or use default
      },
      create: {
        email: u.email!,
        name: (u.user_metadata as any)?.full_name ?? u.user_metadata?.name ?? null,
        image: (u.user_metadata as any)?.avatar_url ?? null,
        role: defaultRole, // Use determined role for new users
        verificationStatus: defaultStatus, // Use determined status for new users
      },
    });

    return NextResponse.json({ user });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
