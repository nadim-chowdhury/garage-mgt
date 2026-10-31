import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Tenants' };
export const instant = false;

export default function TenantsLayout({ children }: { children: React.ReactNode }) {
  return children;
}

