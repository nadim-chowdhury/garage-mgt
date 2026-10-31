'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuToggle: () => void;
}

const roleBadgeVariant = {
  admin: 'info',
  operator: 'success',
  viewer: 'neutral',
} as const;

const roleLabel = {
  admin: 'Admin',
  operator: 'Operator',
  viewer: 'Viewer',
} as const;

export default function Header({ onMenuToggle }: HeaderProps) {
  const { userName, garageName, role, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const now = new Date().toLocaleDateString('en-GB', {
      timeZone: 'Asia/Dhaka',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    setCurrentDate(now);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors lg:hidden"
        aria-label="Toggle menu"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Garage name - mobile */}
      <span className="text-sm font-semibold text-slate-700 lg:hidden truncate">
        {garageName}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Date */}
      <div className="hidden sm:block text-sm text-slate-500">
        {currentDate}
      </div>

      {/* Divider */}
      <div className="hidden sm:block h-6 w-px bg-slate-200" />

      {/* User info + logout */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-medium text-slate-700 leading-tight">
            {userName}
          </span>
          <span className="text-[11px] text-slate-400 leading-tight">
            {garageName}
          </span>
        </div>

        <Badge variant={roleBadgeVariant[role]} size="sm">
          {roleLabel[role]}
        </Badge>

        <button
          onClick={logout}
          className={cn(
            'rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600',
            'transition-colors',
          )}
          title="Logout"
          aria-label="Logout"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
        </button>
      </div>
    </header>
  );
}
