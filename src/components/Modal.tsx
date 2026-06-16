import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export default function Modal({ open, onClose, title, children, width = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={`relative ${width} w-full mx-4 bg-[#1E293B] rounded-lg border border-[#334155] shadow-2xl animate-fade-in-up`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155]">
          <h3 className="text-lg font-medium text-[#F1F5F9]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#334155] text-[#94A3B8] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
