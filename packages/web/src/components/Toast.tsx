import { useApp } from '../store/app';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

export default function Toast() {
  const toastMsg = useApp((s) => s.toastMsg);
  const clearToast = useApp((s) => s.clearToast);

  useEffect(() => {
    if (toastMsg) {
      const t = setTimeout(clearToast, 3000);
      return () => clearTimeout(t);
    }
  }, [toastMsg]);

  if (!toastMsg) return null;
  const cfg = {
    success: { icon: CheckCircle2, bg: 'bg-primary-600' },
    error: { icon: XCircle, bg: 'bg-danger-600' },
    info: { icon: Info, bg: 'bg-slate-700' },
  }[toastMsg.type];
  const Icon = cfg.icon;

  return (
    <div className="fixed right-6 top-6 z-[100] animate-[fadeIn_.2s_ease-out]">
      <div className={`flex items-center gap-3 rounded-lg ${cfg.bg} px-4 py-3 text-white shadow-xl`}>
        <Icon size={18} />
        <span className="text-sm">{toastMsg.message}</span>
        <button onClick={clearToast} className="ml-2 text-white/70 hover:text-white">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
