import React, { useState } from 'react';

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  children: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  width?: string;
  loading?: boolean;
}

export function Modal({
  title,
  open,
  onClose,
  onConfirm,
  children,
  confirmText = '确认',
  cancelText = '取消',
  width = 'max-w-lg',
  loading = false,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`relative bg-white rounded-lg shadow-xl w-full ${width} mx-4 max-h-[90vh] flex flex-col`}>
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
        {onConfirm && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:bg-primary-300"
            >
              {loading ? '处理中...' : confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
