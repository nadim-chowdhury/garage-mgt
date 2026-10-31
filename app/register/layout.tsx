import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register',
};
export const instant = false;

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100 flex items-center justify-center p-4">
      {children}
    </div>
  );
}

