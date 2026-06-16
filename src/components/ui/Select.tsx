'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = '请选择',
  className,
  size = 'md',
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white text-left text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400',
          'disabled:cursor-not-allowed disabled:opacity-50',
          size === 'sm' ? 'h-8 px-2.5' : 'h-10 px-3'
        )}
      >
        <span className={cn(selected ? 'text-gray-900' : 'text-gray-400')}>
          {selected ? (
            <span className="inline-flex items-center gap-2">
              {selected.icon}
              {selected.label}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-gray-200 rounded-lg shadow-card-hover py-1 max-h-60 overflow-y-auto scrollbar-thin animate-slide-down">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange?.(opt.value);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left',
                opt.value === value && 'bg-primary-50 text-primary-600'
              )}
            >
              <span className="inline-flex items-center gap-2">
                {opt.icon}
                {opt.label}
              </span>
              {opt.value === value && <Check className="h-4 w-4 text-primary-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
