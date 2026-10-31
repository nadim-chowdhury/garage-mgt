import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Income' };
export const instant = false;

export default function IncomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}

