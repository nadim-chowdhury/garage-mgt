import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reports' };
export const instant = false;

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

