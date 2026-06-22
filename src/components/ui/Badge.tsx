import * as React from 'react';
import { cn } from '@/utils';
import { STATUS_COLORS, STATUS_LABELS } from '@/types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  status,
  variant,
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-700',
    danger: 'bg-danger-100 text-danger-700',
    info: 'bg-blue-100 text-blue-700',
  };

  const statusColor = status ? STATUS_COLORS[status] : '';
  const label = status ? STATUS_LABELS[status] : children;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium',
        statusColor || (variant ? variants[variant] : variants.default),
        className
      )}
      {...props}
    >
      {label}
    </span>
  );
};
