"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseAuth } from "@/lib/supabase-auth";

interface PendingUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  verificationStatus: string;
  createdAt: string;
}

export default function ApprovalsPage() {
  const { session, user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [roleMap, setRoleMap] = useState<Record<string, string>>({});
  const [loadingAction, setLoadingAction] = useState(false);

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
    const res = await fetch("/api/admin/approvals", {
      headers: {
        Authorization: `Bearer ${session?.access_token ?? ""}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      setPending(data.pending);
    }
  };

  const approve = async (userId: string) => {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({ userId, role: roleMap[userId] || "STUDENT" })
      });
      if (res.ok) {
        await load();
      }
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg sm:text-xl">User Management</CardTitle>
            <Button variant="outline" onClick={() => router.push("/admin/leave-approvals")} className="w-full sm:w-auto">
              Leave Approvals
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-sm sm:text-base text-center py-4">No pending users.</p>
            ) : (
              pending.map((u) => (
                <div key={u.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded p-3 gap-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm sm:text-base">{u.name || u.email}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{u.email}</div>
                    <div className="text-xs text-gray-500">Status: {u.verificationStatus}</div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <Select
                      onValueChange={(val) => setRoleMap((m) => ({ ...m, [u.id]: val }))}
                      defaultValue={u.role}
                    >
                      <SelectTrigger className="w-full sm:w-36">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STUDENT">STUDENT</SelectItem>
                        <SelectItem value="FACULTY">FACULTY</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button disabled={loadingAction} onClick={() => approve(u.id)} size="sm" className="w-full sm:w-auto">
                      {loadingAction ? "Processing..." : "Approve"}
                    </Button>
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


