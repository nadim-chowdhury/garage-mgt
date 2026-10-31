'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  showSearchButton?: boolean;
  onSearch?: (value: string) => void;
  id?: string;
  autoFocus?: boolean;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
  showSearchButton = true,
  onSearch,
  id,
  autoFocus,
}: SearchInputProps) {
  const [query, setQuery] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep internal state in sync if parent resets value externally
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const triggerChange = useCallback(
    (newVal: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      onChange(newVal);
      onSearch?.(newVal);
    },
    [onChange, onSearch],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setQuery(nextVal);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      onChange(nextVal);
      onSearch?.(nextVal);
    }, debounceMs);
  };

  const handleClear = () => {
    setQuery('');
    triggerChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerChange(query);
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={cn('relative flex items-center', className)}>
      <div className="relative flex-1">
        {/* Left Search Icon */}
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

        {/* Input */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            'block w-full h-[38px] rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm text-slate-900',
            'placeholder:text-slate-400',
            'transition-colors',
            'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
            showSearchButton && 'rounded-r-none border-r-0',
          )}
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Clear search"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Right Search Button */}
      {showSearchButton && (
        <button
          type="button"
          onClick={() => triggerChange(query)}
          className={cn(
            'h-[38px] inline-flex items-center gap-1.5 rounded-r-lg border border-indigo-600 bg-indigo-600 px-3.5 text-sm font-medium text-white transition-colors',
            'hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
            'shrink-0',
          )}
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
        </button>
      )}
    </div>
  );
}

