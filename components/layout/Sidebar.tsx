'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  LayoutDashboard,
  Car,
  Home,
  Users,
  Truck,
  TrendingUp,
  TrendingDown,
  BookOpen,
  ClipboardList,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

// ── Navigation structure ───────────────────────────────────
interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    title: 'Main',
    items: [{ label: 'Dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Daily Entries', href: '/daily-entries', icon: Car },
      { label: 'Monthly Rent', href: '/monthly-rent', icon: Home },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Tenants', href: '/tenants', icon: Users },
      { label: 'Vehicles', href: '/vehicles', icon: Truck },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Income', href: '/income', icon: TrendingUp },
      { label: 'Expenses', href: '/expenses', icon: TrendingDown },
      { label: 'Cash Book', href: '/cash-book', icon: BookOpen },
    ],
  },
  {
    title: 'Tracking',
    items: [{ label: 'Dues', href: '/dues', icon: ClipboardList }],
  },
  {
    title: 'Analytics',
    items: [{ label: 'Reports', href: '/reports', icon: BarChart3 }],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  open,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { garageName } = useAuth();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  // Content for desktop (supports collapsed mode)
  const renderDesktopSidebar = () => (
    <aside
      className={cn(
        'flex h-full flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out',
        collapsed ? 'w-20' : 'w-64',
      )}
    >
      {/* Logo / Brand */}
      <div
        className={cn(
          'flex h-16 items-center border-b border-slate-200 transition-all',
          collapsed ? 'justify-center px-2' : 'gap-3 px-5',
        )}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white text-lg font-bold"
          title={garageName}
        >
          G
        </div>
        {!collapsed && (
          <div className="leading-tight min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {garageName}
            </p>
            <p className="text-[11px] text-slate-400">Garage Management</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 overflow-y-auto py-4 space-y-6', collapsed ? 'px-2' : 'px-3')}>
        {navigation.map((group) => (
          <div key={group.title}>
            {!collapsed ? (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.title}
              </p>
            ) : (
              <div className="my-2 border-t border-slate-100" />
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'flex items-center rounded-lg transition-colors font-medium text-sm',
                        collapsed
                          ? 'justify-center p-2.5'
                          : 'gap-3 px-3 py-2',
                        active
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )}
                    >
                      <Icon className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-[18px] w-[18px]')} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className={cn(
          'border-t border-slate-200 transition-all',
          collapsed ? 'p-2 flex flex-col items-center gap-2' : 'px-4 py-3 flex items-center justify-between',
        )}
      >
        {!collapsed && (
          <p className="text-[11px] text-slate-400">v0.3.0 • Garage MGT</p>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors',
              collapsed ? 'h-9 w-9' : 'h-8 w-8',
            )}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </aside>
  );

  // Content for mobile drawer (always full width, no collapsed mode)
  const renderMobileSidebar = () => (
    <aside className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white text-lg font-bold">
          G
        </div>
        <div className="leading-tight min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">
            {garageName}
          </p>
          <p className="text-[11px] text-slate-400">Garage Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigation.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 px-5 py-3">
        <p className="text-[11px] text-slate-400">v0.3.0 • Garage MGT</p>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex transition-[width] duration-300 ease-in-out',
          collapsed ? 'lg:w-20' : 'lg:w-64',
        )}
      >
        {renderDesktopSidebar()}
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 shadow-xl">
            {renderMobileSidebar()}
          </div>
        </div>
      )}
    </>
  );
}
