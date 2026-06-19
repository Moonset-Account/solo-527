import * as React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-success-500" />,
  error: <XCircle className="w-5 h-5 text-danger-500" />,
  warning: <AlertCircle className="w-5 h-5 text-warning-500" />,
  info: <Info className="w-5 h-5 text-primary-500" />,
};

const bgMap: Record<ToastType, string> = {
  success: 'border-success-200 bg-success-50',
  error: 'border-danger-200 bg-danger-50',
  warning: 'border-warning-200 bg-warning-50',
  info: 'border-primary-200 bg-primary-50',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const showToast = React.useCallback((options: ToastOptions) => {
    const { type, message, duration = 3000 } = options;
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg',
              'animate-in slide-in-from-right fade-in duration-300',
              bgMap[toast.type]
            )}
          >
            {iconMap[toast.type]}
            <span className="text-sm text-neutral-800">{toast.message}</span>
            <button
              className="ml-2 p-0.5 rounded text-neutral-400 hover:text-neutral-600 transition-colors"
              onClick={() => removeToast(toast.id)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default ToastContext;
