import * as React from 'react';
import { cn } from '@/utils';

type InputType = 'text' | 'number' | 'date' | 'password';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'prefix' | 'suffix'> {
  type?: InputType;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export default function Input({
  className,
  type = 'text',
  error,
  prefix,
  suffix,
  disabled,
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      <div
        className={cn(
          'flex items-center rounded-lg border transition-colors bg-white',
          'focus-within:ring-2 focus-within:ring-primary-400 focus-within:ring-offset-2',
          error
            ? 'border-danger-300 focus-within:border-danger-400 focus-within:ring-danger-400'
            : 'border-neutral-200 focus-within:border-primary-400',
          disabled ? 'bg-neutral-50 cursor-not-allowed' : '',
          className
        )}
      >
        {prefix && <span className="pl-3 text-neutral-500">{prefix}</span>}
        <input
          type={type}
          className={cn(
            'flex-1 h-10 px-3 bg-transparent outline-none text-neutral-900 placeholder:text-neutral-400',
            'disabled:cursor-not-allowed disabled:text-neutral-500',
            prefix ? 'pl-2' : '',
            suffix ? 'pr-2' : ''
          )}
          disabled={disabled}
          {...props}
        />
        {suffix && <span className="pr-3 text-neutral-500">{suffix}</span>}
      </div>
      {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
    </div>
  );
}
