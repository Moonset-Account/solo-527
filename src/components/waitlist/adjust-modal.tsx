'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

type WaitlistEntry = {
  id: string;
  position: number;
  studentName: string;
  [key: string]: unknown;
};

type AdjustModalProps = {
  isOpen: boolean;
  onClose: () => void;
  entry: WaitlistEntry;
  onConfirm: (entryId: string, newPosition: number, reason: string) => void;
};

export function AdjustModal({ isOpen, onClose, entry, onConfirm }: AdjustModalProps) {
  const [newPosition, setNewPosition] = useState<number>(entry.position);
  const [reason, setReason] = useState('');
  const [showReasonWarning, setShowReasonWarning] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setShowReasonWarning(true);
      return;
    }
    onConfirm(entry.id, newPosition, reason.trim());
    setReason('');
    setNewPosition(entry.position);
    setShowReasonWarning(false);
    onClose();
  };

  const handleReasonChange = (value: string) => {
    setReason(value);
    if (value.trim()) {
      setShowReasonWarning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">调整候补顺序</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              当前排位
            </label>
            <div className="text-2xl font-bold text-gray-900">第 {entry.position} 位</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="new-position">
              新排位
            </label>
            <input
              id="new-position"
              type="number"
              min={1}
              value={newPosition}
              onChange={(e) => setNewPosition(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#E8A838] focus:outline-none focus:ring-1 focus:ring-[#E8A838]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="adjust-reason">
              调序原因（必填）
            </label>
            <textarea
              id="adjust-reason"
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              placeholder="请输入调序原因，如：家长诉求、特殊情况等"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#E8A838] focus:outline-none focus:ring-1 focus:ring-[#E8A838] resize-none"
            />
            {showReasonWarning && (
              <p className="mt-1 text-sm text-red-500">调序原因不能为空</p>
            )}
          </div>

          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm text-gray-600">
              排位变化：第 <span className="font-semibold">{entry.position}</span> 位 → 第{' '}
              <span className="font-semibold">{newPosition}</span> 位
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className="rounded-lg bg-[#E8A838] px-4 py-2 text-sm font-medium text-white hover:bg-[#d4952e] disabled:cursor-not-allowed disabled:opacity-50"
          >
            确认调整
          </button>
        </div>
      </div>
    </div>
  );
}
