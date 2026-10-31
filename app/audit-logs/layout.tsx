import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Activity Logs' };
export const instant = false;

export default function AuditLogsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

