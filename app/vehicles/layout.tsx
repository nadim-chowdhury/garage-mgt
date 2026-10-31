import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Vehicles' };
export const instant = false;

export default function VehiclesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

