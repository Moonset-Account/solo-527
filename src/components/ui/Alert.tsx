'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AlertType;
  title?: string;
  onClose?: () => void;
  dismissible?: boolean;
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, type = 'info', title, children, onClose, dismissible, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const Icon = icons[type];

    const styles = {
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      warning: 'bg-amber-50 border-amber-200 text-amber-800',
      error: 'bg-red-50 border-red-200 text-red-800',
    };

    const iconStyles = {
      info: 'text-blue-500',
      success: 'text-green-500',
      warning: 'text-amber-500',
      error: 'text-red-500',
    };

    const handleClose = () => {
      setIsVisible(false);
      onClose?.();
    };

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex items-start gap-3 p-4 rounded-lg border',
          styles[type],
          className
        )}
        role="alert"
        {...props}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconStyles[type])} />
        <div className="flex-1">
          {title && <p className="font-medium mb-1">{title}</p>}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export { Alert };
