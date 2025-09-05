"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseAuth } from "@/lib/supabase-auth";

interface FacultyRow {
  id: string;
  email: string;
  name: string | null;
}

export default function FacultyPage() {
  const { session, user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [rows, setRows] = useState<FacultyRow[]>([]);
  const [departments, setDepartments] = useState<{id:string;name:string;code:string}[]>([]);
  const [form, setForm] = useState({ email: "", name: "", departmentId: "" });
  const [edit, setEdit] = useState<{ userId: string; name: string; departmentId: string } | null>(null);

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
    const [fRes, dRes] = await Promise.all([
      fetch("/api/admin/faculty", { headers: { Authorization: `Bearer ${session?.access_token ?? ""}` } }),
      fetch("/api/admin/departments", { headers: { Authorization: `Bearer ${session?.access_token ?? ""}` } }),
    ]);
    if (fRes.ok) setRows((await fRes.json()).faculty);
    if (dRes.ok) setDepartments((await dRes.json()).departments);
  };

  const createFaculty = async () => {
    if (!form.email || !form.departmentId) return;
    const res = await fetch("/api/admin/faculty", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ email: "", name: "", departmentId: "" });
      await load();
    }
  };

  const updateFaculty = async () => {
    if (!edit) return;
    const res = await fetch("/api/admin/faculty", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
      body: JSON.stringify({ userId: edit.userId, name: edit.name, departmentId: edit.departmentId })
    });
    if (res.ok) {
      setEdit(null);
      await load();
    }
  };

  const deleteFaculty = async (userId: string) => {
    const res = await fetch(`/api/admin/faculty?userId=${userId}`, { method: "DELETE", headers: { Authorization: `Bearer ${session?.access_token ?? ""}` } });
    if (res.ok) await load();
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Faculty</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <Input placeholder="Faculty Email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} />
            <Input placeholder="Name (optional)" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} />
            <Select onValueChange={(v)=>setForm({...form, departmentId:v})} value={form.departmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(d=> (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={createFaculty} className="h-10 sm:h-11">Add</Button>
          </div>
          <div className="space-y-2">
            {rows.length === 0 ? (
              <p className="text-sm sm:text-base text-center py-4">No faculty found.</p>
            ) : (
              rows.map((r) => (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded p-3 gap-2 sm:gap-4">
                  {edit?.userId === r.id ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input value={edit.name} onChange={(e)=>setEdit({ ...edit, name: e.target.value })} placeholder="Name" />
                      <Select value={edit.departmentId} onValueChange={(v)=>setEdit({ ...edit, departmentId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button onClick={updateFaculty} size="sm">Save</Button>
                        <Button variant="ghost" onClick={()=>setEdit(null)} size="sm">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">{r.name || r.email}</div>
                      <div className="text-xs sm:text-sm text-gray-600">{r.email}</div>
                    </div>
                  )}
                  {edit?.userId !== r.id && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={()=>setEdit({ userId: r.id, name: r.name || "", departmentId: departments[0]?.id || "" })} size="sm" className="text-xs sm:text-sm">Edit</Button>
                      <Button variant="destructive" onClick={()=>deleteFaculty(r.id)} size="sm" className="text-xs sm:text-sm">Delete</Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
