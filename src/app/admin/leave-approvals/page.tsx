"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/lib/supabase-auth";

interface LeaveReq {
  id: string;
  date: string;
  reason?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  faculty: { user: { name: string | null; email: string }; department: { name: string } };
}

export default function LeaveApprovalsPage() {
  const { session, user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [rows, setRows] = useState<LeaveReq[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    const role = (user?.user_metadata?.role as string) || "STUDENT";
    if (!session || role !== "ADMIN") {
      router.push("/auth/signin");
      return;
    }
    load();
  }, [session, loading, user, router]);

  const load = async () => {
    const res = await fetch("/api/admin/leave", { headers: { Authorization: `Bearer ${session?.access_token ?? ""}` } });
    if (res.ok) setRows((await res.json()).requests);
  };

  const act = async (id: string, action: "APPROVE" | "REJECT") => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Leave Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rows.length === 0 ? (
              <p>No leave requests.</p>
            ) : (
              rows.map(r => (
                <div key={r.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{r.faculty.user.name || r.faculty.user.email} — {r.faculty.department.name}</div>
                    <div className="text-sm text-gray-600">{new Date(r.date).toLocaleDateString()} • {r.reason || "No reason"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{r.status}</span>
                    {r.status === "PENDING" && (
                      <>
                        <Button disabled={busy===r.id} onClick={()=>act(r.id, "APPROVE")}>Approve</Button>
                        <Button variant="destructive" disabled={busy===r.id} onClick={()=>act(r.id, "REJECT")}>Reject</Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


