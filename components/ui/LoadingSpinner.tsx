import { cn } from '@/lib/utils';

const sizeStyles = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
} as const;

const textSizeStyles = {
  sm: 'text-xs mt-1.5',
  md: 'text-sm mt-2',
  lg: 'text-sm mt-3',
} as const;

interface LoadingSpinnerProps {
  size?: keyof typeof sizeStyles;
  className?: string;
  text?: string;
}

export default function LoadingSpinner({
  size = 'md',
  className,
  text = 'Loading...',
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-2" role="status">
      <div
        className={cn(
          'animate-spin rounded-full border-indigo-600 border-t-transparent',
          sizeStyles[size],
          className,
        )}
        aria-label={text || 'Loading'}
      />
      {text && (
        <p className={cn('font-medium text-slate-500 animate-pulse select-none', textSizeStyles[size])}>
          {text}
        </p>
      )}
    </div>
  );
}

