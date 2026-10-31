'use client';

import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterPillsProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export default function FilterPills({
  options,
  value,
  onChange,
  label,
  className,
}: FilterPillsProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <span className="block text-sm font-medium text-slate-700">
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'h-[38px] inline-flex items-center justify-center rounded-lg px-3.5 text-sm font-medium transition-colors',
              value === option.value
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
