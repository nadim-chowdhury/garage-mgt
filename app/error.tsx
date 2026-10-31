'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[App Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
        <AlertTriangle className="h-7 w-7 text-red-600" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        An unexpected error occurred. Please try again or contact support if the issue persists.
      </p>
      {error.message && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-xs text-red-600 font-mono max-w-lg truncate">
          {error.message}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" onClick={() => window.location.href = '/'}>
          Go Home
        </Button>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}

