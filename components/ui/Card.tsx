import { cn } from '@/lib/utils';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export default function Card({
  title,
  children,
  className,
  footer,
  noPadding = false,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden min-w-0 w-full',
        className,
      )}
    >
      {title && (
        <div className="border-b border-slate-200 px-6 py-4 min-w-0">
          <h3 className="text-base font-semibold text-slate-900 truncate" title={title}>
            {title}
          </h3>
        </div>
      )}
      <div className={cn(!noPadding && 'px-6 py-5', 'w-full min-w-0')}>{children}</div>
      {footer && (
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50/50 rounded-b-xl min-w-0">
          {footer}
        </div>
      )}
    </div>
  );
}

