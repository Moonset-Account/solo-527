import * as React from 'react';
import { cn } from '@/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 hover:-translate-y-px active:translate-y-0 shadow-sm hover:shadow',
      secondary:
        'bg-white text-primary-600 border border-primary-600 hover:bg-primary-50 focus:ring-primary-500',
      danger:
        'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500 hover:-translate-y-px active:translate-y-0 shadow-sm hover:shadow',
      ghost:
        'text-slate-600 hover:bg-slate-100 focus:ring-slate-500',
      outline:
        'border border-slate-300 text-slate-700 hover:bg-slate-50 focus:ring-primary-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
