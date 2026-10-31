import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dues' };
export const instant = false;

export default function DuesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

