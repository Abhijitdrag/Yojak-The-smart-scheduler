"use client";

import { useSupabaseAuth } from "@/lib/supabase-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { user, session, loading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (!session) {
      router.push("/auth/signin");
    } else {
      router.push("/dashboard");
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-blue-200"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Loading Application</p>
            <p className="text-sm text-gray-600 mt-1">Please wait while we prepare your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}