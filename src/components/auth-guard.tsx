"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/lib/supabase-auth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, session, loading } = useSupabaseAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push('/auth/signin');
    }
  }, [session, loading, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-blue-200"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900">Loading Dashboard</p>
            <p className="text-sm text-gray-600 mt-1">Please wait while we prepare your data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!session || !user) {
    return null;
  }

  // Check role if required
  if (requiredRole && user.user_metadata?.role !== requiredRole) {
    router.push('/dashboard');
    return null;
  }

  return <>{children}</>;
}
