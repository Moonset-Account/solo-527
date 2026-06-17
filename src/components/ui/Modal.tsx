import { useState } from 'react';
import { X } from 'lucide-react';

type Props = {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  children: React.ReactNode;
  submitLabel?: string;
};

export function Modal({ title, open, onClose, onSubmit, children, submitLabel = '提交' }: Props) {
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-elevated w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-display font-semibold text-navy-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md p-1 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div className="p-5 space-y-4">{children}</div>
          <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={submitting}>
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? '处理中...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
