'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  message: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  show: (opts: Omit<ToastItem, 'id'>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, { wrapper: string; icon: ReactNode; iconColor: string }> = {
  success: {
    wrapper: 'border-success-200 bg-success-50 text-success-900',
    icon: <CheckCircle className="w-5 h-5" />,
    iconColor: 'text-success-500',
  },
  error: {
    wrapper: 'border-danger-200 bg-danger-50 text-danger-900',
    icon: <XCircle className="w-5 h-5" />,
    iconColor: 'text-danger-500',
  },
  warning: {
    wrapper: 'border-warning-200 bg-warning-50 text-warning-900',
    icon: <AlertCircle className="w-5 h-5" />,
    iconColor: 'text-warning-500',
  },
  info: {
    wrapper: 'border-primary-200 bg-primary-50 text-primary-900',
    icon: <Info className="w-5 h-5" />,
    iconColor: 'text-primary-500',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (opts: Omit<ToastItem, 'id'>): string => {
      const id = `toast_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const duration = opts.duration ?? 4500;
      setToasts((prev) => [...prev, { id, ...opts }]);
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
      return id;
    },
    []
  );

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
        {toasts.map((toast, idx) => {
          const style = variantStyles[toast.variant];
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'pointer-events-auto relative rounded-xl border shadow-lg p-4 pr-10 backdrop-blur-sm',
                style.wrapper,
                'animate-slide-in-right'
              )}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <button
                onClick={() => dismiss(toast.id)}
                className="absolute top-3 right-3 p-1 rounded-md hover:bg-black/5 text-current opacity-70 hover:opacity-100 transition-opacity"
                aria-label="关闭"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex gap-3">
                <div className={cn('flex-shrink-0 mt-0.5', style.iconColor)}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-5">{toast.message}</p>
                  {toast.description && (
                    <p className="mt-1 text-xs opacity-80 leading-4">{toast.description}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    const fallback: ToastContextValue = {
      show: (opts) => {
        console.log('[Toast]', opts.variant, opts.message, opts.description || '');
        return 'fallback';
      },
      dismiss: () => {},
    };
    return fallback;
  }
  return ctx;
}

export default ToastProvider;
