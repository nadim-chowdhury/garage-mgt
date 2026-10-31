'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Badge from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { Menu, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface HeaderProps {
  onMenuToggle: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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

export default function Header({
  onMenuToggle,
  collapsed = false,
  onToggleCollapse,
}: HeaderProps) {
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
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop collapse toggle */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
      )}

      {/* Garage name */}
      <span className={cn('text-sm font-semibold text-slate-700 truncate', !collapsed && 'lg:hidden')}>
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
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
