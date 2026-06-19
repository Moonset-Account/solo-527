import * as React from 'react';
import { cn } from '@/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export default function Textarea({
  className,
  error,
  disabled,
  rows = 4,
  ...props
}: TextareaProps) {
  return (
    <div className="w-full">
      <textarea
        className={cn(
          'w-full px-3 py-2 rounded-lg border bg-white text-neutral-900 placeholder:text-neutral-400',
          'outline-none transition-colors resize-none',
          'focus:ring-2 focus:ring-primary-400 focus:ring-offset-2',
          error
            ? 'border-danger-300 focus:border-danger-400 focus:ring-danger-400'
            : 'border-neutral-200 focus:border-primary-400',
          disabled ? 'bg-neutral-50 cursor-not-allowed text-neutral-500' : '',
          className
        )}
        disabled={disabled}
        rows={rows}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
    </div>
  );
}
