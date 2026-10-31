'use client';

import Button from './Button';
import { Printer } from 'lucide-react';

interface PrintButtonProps {
  className?: string;
}

export default function PrintButton({ className }: PrintButtonProps) {
  return (
    <Button
      variant="secondary"
      size="sm"
      className={className}
      onClick={() => window.print()}
      data-no-print
    >
      <Printer className="h-4 w-4 mr-1.5" />
      Print
    </Button>
  );
}
