import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase-server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth(request, "ADMIN");
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, role } = await request.json();
    
    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    if (!["ADMIN", "FACULTY", "STUDENT"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { email },
      data: { 
        role: role as any,
        verificationStatus: role === "ADMIN" ? "APPROVED" : "PENDING"
      },
    });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });
  } catch (error: any) {
    console.error("Promote user error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to promote user" 
    }, { status: 500 });
  }
}