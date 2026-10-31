import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Monthly Rent' };
export const instant = false;

export default function MonthlyRentLayout({ children }: { children: React.ReactNode }) {
  return children;
}

