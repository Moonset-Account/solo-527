import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden animate-fade-in-up',
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between p-6 border-b border-slate-200">
            <div>
              {title && (
              <h2 className="text-lg font-semibold text-slate-900 font-serif">
                {title}
              </h2>
            )}
              {description && (
                <p className="text-sm text-slate-500 mt-1">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          )}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {children}
        </div>
        {footer && (
          <div className="p-6 pt-0 flex justify-end gap-3 border-t border-slate-200">
            {footer}
          </div>
          )}
      </div>
    </div>
  );
};

interface ModalConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger';
}

export const ModalConfirm: React.FC<ModalConfirmProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  variant = 'primary',
}) => (
  <Modal open={open} onClose={onClose} title={title} description={description}>
    <div className="flex justify-end gap-3 mt-6">
      <Button variant="outline" onClick={onClose}>
        {cancelText}
      </Button>
      <Button variant={variant} onClick={onConfirm}>
        {confirmText}
      </Button>
    </div>
  </Modal>
  );
