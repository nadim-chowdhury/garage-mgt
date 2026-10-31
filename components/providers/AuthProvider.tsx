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

  const value: AuthContextValue | null = useMemo(() => {
    if (!session) return null;
    return {
      userId: session.userId,
      garageId: session.garageId,
      garageName: session.garageName,
      userName: session.name,
      role: session.role || 'admin',
      isAdmin: !session.role || session.role === 'admin',
      isViewer: session.role === 'viewer',
      canWrite: session.role !== 'viewer',
      logout,
    };
  }, [session, logout]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="" />
      </div>
    );
  }

  // Not authenticated — redirect handled by proxy,
  // but if session expired mid-use, redirect here
  if (isError || !value) {
    router.push('/login');
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

