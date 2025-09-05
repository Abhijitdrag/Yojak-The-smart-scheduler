"use client";

import { useSupabaseAuth } from "@/lib/supabase-auth";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignOutPage() {
  const { signOut } = useSupabaseAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/signin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold">Sign out</h1>
        <Button onClick={handleSignOut} size="lg">
          Sign out
        </Button>
      </div>
    </div>
  );
}


