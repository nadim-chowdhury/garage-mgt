'use client';

import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useGetMeQuery, useLogoutMutation } from '@/store/api/authApi';
import type { UserRole } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// ── Auth Context ──────────────────────────────────────────

interface AuthContextValue {
  userId: string;
  garageId: string;
  garageName: string;
  userName: string;
  role: UserRole;
  isAdmin: boolean;
  isViewer: boolean;
  canWrite: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Hook ──────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

// ── Provider ──────────────────────────────────────────────

export default function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, isLoading, isError } = useGetMeQuery();
  const [logoutMutation] = useLogoutMutation();

  const logout = useCallback(async () => {
    await logoutMutation();
    router.push('/login');
  }, [logoutMutation, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated — redirect handled by proxy,
  // but if session expired mid-use, redirect here
  if (isError || !session) {
    router.push('/login');
    return null;
  }

  const value: AuthContextValue = useMemo(
    () => ({
      userId: session.userId,
      garageId: session.garageId,
      garageName: session.garageName,
      userName: session.name,
      role: session.role,
      isAdmin: session.role === 'admin',
      isViewer: session.role === 'viewer',
      canWrite: session.role !== 'viewer',
      logout,
    }),
    [session, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

