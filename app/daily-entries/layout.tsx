import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Daily Vehicle Entries' };

export default function DailyEntriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

