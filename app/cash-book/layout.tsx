import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Cash Book' };
export const instant = false;

export default function CashBookLayout({ children }: { children: React.ReactNode }) {
  return children;
}

