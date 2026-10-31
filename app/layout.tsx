import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense } from 'react';
import StoreProvider from '@/store/provider';
import ToastProvider from '@/components/ui/Toast';
import AppShell from '@/components/layout/AppShell';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'গ্যারেজ ম্যানেজমেন্ট সিস্টেম',
    template: '%s | গ্যারেজ ম্যানেজমেন্ট',
  },
  description:
    'গ্যারেজের দৈনিক গাড়ি জমা, মাসিক ভাড়া, আয়-ব্যয়, বকেয়া ও লাভ-ক্ষতির হিসাব',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="bn"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full" suppressHydrationWarning>
        <Suspense>
          <StoreProvider>
            <ToastProvider>
              <AppShell>{children}</AppShell>
            </ToastProvider>
          </StoreProvider>
        </Suspense>
      </body>
    </html>
  );
}
