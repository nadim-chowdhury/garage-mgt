import { cn } from '@/lib/utils';

const colorStyles = {
  primary: 'border-l-indigo-500 bg-indigo-50/40',
  success: 'border-l-emerald-500 bg-emerald-50/40',
  warning: 'border-l-amber-500 bg-amber-50/40',
  danger: 'border-l-red-500 bg-red-50/40',
  neutral: 'border-l-slate-400 bg-slate-50/40',
} as const;

const iconBg = {
  primary: 'bg-indigo-100 text-indigo-600',
  success: 'bg-emerald-100 text-emerald-600',
  warning: 'bg-amber-100 text-amber-600',
  danger: 'bg-red-100 text-red-600',
  neutral: 'bg-slate-100 text-slate-600',
} as const;

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { direction: 'up' | 'down' | 'neutral'; percentage: number };
  color?: keyof typeof colorStyles;
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white shadow-sm border-l-4 p-5',
        colorStyles[color],
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {trend && (
            <p
              className={cn(
                'text-xs font-medium flex items-center gap-1',
                trend.direction === 'up' && 'text-emerald-600',
                trend.direction === 'down' && 'text-red-600',
                trend.direction === 'neutral' && 'text-slate-500',
              )}
            >
              {trend.direction === 'up' && '↑'}
              {trend.direction === 'down' && '↓'}
              {trend.direction === 'neutral' && '→'}
              {trend.percentage}%
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg text-lg',
              iconBg[color],
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

