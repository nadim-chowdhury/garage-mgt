import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'User Management' };
export const instant = false;

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
