'use client';

import Button from './Button';

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
      🖨️ Print
    </Button>
  );
}

