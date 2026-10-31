'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import AuthProvider from '@/components/providers/AuthProvider';
import { cn } from '@/lib/utils';

// Routes that should NOT show the AppShell (sidebar/header)
const PUBLIC_ROUTES = ['/login', '/register'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Load saved sidebar state from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('garage_sidebar_collapsed');
      if (saved !== null) {
        setSidebarCollapsed(saved === 'true');
      }
    } catch {
      // Ignore localStorage issues
    }
  }, []);

  const handleToggleCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('garage_sidebar_collapsed', String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  // Public pages render without AppShell or AuthProvider
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return <>{children}</>;
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />

        {/* Main area — animated padding to account for fixed sidebar */}
        <div
          className={cn(
            'transition-[padding] duration-300 ease-in-out',
            sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64',
          )}
        >
          <Header
            onMenuToggle={() => setSidebarOpen(true)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleCollapse}
          />
          <main className="p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </AuthProvider>
  );
}
