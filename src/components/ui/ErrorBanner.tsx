import { AlertTriangle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string | null;
  safetyNote?: string | null;
  onDismiss: () => void;
}

export default function ErrorBanner({ message, safetyNote, onDismiss }: ErrorBannerProps) {
  if (!message) return null;
  return (
    <div className="absolute top-0 left-0 right-0 z-50 animate-slideDown">
      <div className="bg-gradient-to-r from-red-900/95 to-red-800/95 backdrop-blur-sm border-b border-red-500/50 p-3 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5 animate-pulse" />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium">{message}</p>
          {safetyNote && (
            <p className="text-red-200/80 text-xs mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              安全提示：{safetyNote}
            </p>
          )}
        </div>
        <button onClick={onDismiss} className="text-red-300 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
