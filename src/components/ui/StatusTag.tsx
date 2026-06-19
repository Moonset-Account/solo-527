import * as React from 'react';
import { cn, getStatusColor, getStatusText } from '@/utils';

interface StatusTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string;
  showText?: boolean;
}

export default function StatusTag({
  status,
  showText = true,
  className,
  ...props
}: StatusTagProps) {
  const colorClass = getStatusColor(status);
  const text = getStatusText(status);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border',
        colorClass,
        className
      )}
      {...props}
    >
      {showText ? text : <span className="w-2 h-2 rounded-full bg-current" />}
    </span>
  );
}
