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
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { garageName } = useAuth();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const sidebar = (
    <aside
      className={cn(
        'flex h-full w-64 flex-col bg-white border-r border-slate-200',
      )}
    >
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white text-lg font-bold">
          G
        </div>
        <div className="leading-tight min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{garageName}</p>
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
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive(item.href)
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
      {/* Desktop sidebar — always visible */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:w-64">
        {sidebar}
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
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}
