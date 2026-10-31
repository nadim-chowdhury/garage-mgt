import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Daily Vehicle Entries' };
export const instant = false;

export default function DailyEntriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

