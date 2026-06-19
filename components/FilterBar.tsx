'use client';

import type { ReactNode } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  children?: ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
}

export function FilterBar({
  children,
  searchPlaceholder = '搜索...',
  searchValue,
  onSearchChange,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'card p-4 mb-4 flex flex-wrap items-center gap-3',
        className,
      )}
    >
      {searchValue !== undefined && onSearchChange && (
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="input pl-9 pr-9"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className, children, ...rest }: SelectProps) {
  return (
    <select
      className={cn(
        'input appearance-none pr-8 bg-no-repeat bg-[right_0.6rem_center]',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")",
        backgroundSize: '20px 20px',
      }}
      {...rest}
    >
      {children}
    </select>
  );
}
