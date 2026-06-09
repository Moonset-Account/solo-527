import SceneManager from '@/core/SceneManager';
import { useUINotificationStore } from '@/core/UIStateStore';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function NotificationToast() {
  const notifications = useUINotificationStore((s) => s.notifications);
  const removeNotification = useUINotificationStore((s) => s.removeNotification);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {notifications.map((n) => {
        const colors: Record<string, string> = {
          info: 'border-circuit-current/60 bg-circuit-panel',
          success: 'border-circuit-switchOn/60 bg-circuit-panel',
          warning: 'border-circuit-bulb/60 bg-circuit-panel',
          error: 'border-circuit-error/60 bg-circuit-panel',
        };
        const icons: Record<string, JSX.Element> = {
          info: <Info className="w-5 h-5 text-circuit-current" />,
          success: <CheckCircle2 className="w-5 h-5 text-circuit-switchOn" />,
          warning: <AlertCircle className="w-5 h-5 text-circuit-bulb" />,
          error: <XCircle className="w-5 h-5 text-circuit-error" />,
        };
        const createdAgo = Date.now() - n.createdAt;
        const pct = Math.max(0, 1 - createdAgo / n.duration);
        return (
          <div
            key={n.id}
            className={cn(
              'pointer-events-auto min-w-[280px] max-w-[420px] rounded-lg border-2 shadow-neon backdrop-blur-sm',
              'flex items-start gap-3 p-3 animate-slideIn',
              colors[n.type]
            )}
            style={{
              animation: 'slideIn 0.28s cubic-bezier(.2,.8,.2,1)',
            }}
          >
            <div className="mt-0.5">{icons[n.type]}</div>
            <div className="flex-1 text-sm text-white/90 leading-relaxed">{n.message}</div>
            <button
              onClick={() => removeNotification(n.id)}
              className="text-white/40 hover:text-white/90 transition-colors p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
            <div
              className="absolute left-0 right-0 bottom-0 h-0.5 rounded-b-lg bg-white/20 overflow-hidden"
              style={{ pointerEvents: 'none' }}
            >
              <div
                className={cn(
                  'h-full transition-all',
                  n.type === 'success' && 'bg-circuit-switchOn',
                  n.type === 'warning' && 'bg-circuit-bulb',
                  n.type === 'error' && 'bg-circuit-error',
                  n.type === 'info' && 'bg-circuit-current'
                )}
                style={{ width: `${pct * 100}%` }}
              />
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-circuit-bg text-white">
      <SceneManager />
      <NotificationToast />
    </div>
  );
}
