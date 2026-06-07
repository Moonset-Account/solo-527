'use client';

import { useState } from 'react';
import { X, Send, AlertCircle, MessageSquare, Clock } from 'lucide-react';
import type { Remark, Prescription } from '@/types';
import { formatDateTime, getSeverityColor, getSeverityBgColor } from '@/utils/formatters';
import { cn } from '@/utils/formatters';

interface RemarkPanelProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: string;
  targetValue: string;
  targetTitle: string;
  remarks: Remark[];
  onAddRemark: (remark: Omit<Remark, 'id' | 'createdAt'>) => void;
  prescription?: Prescription | null;
}

export default function RemarkPanel({
  isOpen,
  onClose,
  targetType,
  targetValue,
  targetTitle,
  remarks,
  onAddRemark,
  prescription,
}: RemarkPanelProps) {
  const [content, setContent] = useState('');
  const [severity, setSeverity] = useState<'normal' | 'warning' | 'critical'>('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onAddRemark({
      targetType: targetType as any,
      targetValue,
      content: content.trim(),
      author: '运营改善组',
      severity,
    });

    setContent('');
    setSeverity('normal');
  };

  if (!isOpen) return null;

  const filteredRemarks = remarks.filter(
    (r) => r.targetType === targetType && r.targetValue === targetValue
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">人工备注</h3>
            <p className="text-xs text-gray-500 mt-0.5">{targetTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {prescription && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-2">处方信息</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">处方编号：</span>
                <span className="font-mono">{prescription.prescriptionNo}</span>
              </div>
              <div>
                <span className="text-gray-500">处方类型：</span>
                <span>{prescription.type === 'emergency' ? '急诊' : prescription.type === 'specialist' ? '专科' : '普通'}</span>
              </div>
              <div>
                <span className="text-gray-500">开方科室：</span>
                <span>{prescription.departmentName}</span>
              </div>
              <div>
                <span className="text-gray-500">取药窗口：</span>
                <span>{prescription.windowNo}号窗</span>
              </div>
              <div>
                <span className="text-gray-500">等待时长：</span>
                <span className={prescription.waitTime > 30 ? 'text-red-600 font-medium' : ''}>
                  {prescription.waitTime} 分钟
                </span>
              </div>
              <div>
                <span className="text-gray-500">配药时长：</span>
                <span>{prescription.dispenseTime} 分钟</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {filteredRemarks.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">暂无备注记录</p>
            </div>
          ) : (
            filteredRemarks.map((remark) => (
              <div
                key={remark.id}
                className={cn(
                  'p-3 rounded-lg border border-gray-100',
                  getSeverityBgColor(remark.severity)
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className={cn('w-4 h-4', getSeverityColor(remark.severity))} />
                    <span className="text-xs font-medium text-gray-700">{remark.author}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(remark.createdAt)}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{remark.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-gray-500">严重程度：</span>
              {(['normal', 'warning', 'critical'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={cn(
                    'px-2 py-0.5 text-xs rounded transition-colors',
                    severity === s
                      ? s === 'normal'
                        ? 'bg-green-500 text-white'
                        : s === 'warning'
                        ? 'bg-orange-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {s === 'normal' ? '一般' : s === 'warning' ? '警告' : '严重'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="输入备注内容..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={3}
              />
              <button
                type="submit"
                disabled={!content.trim()}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
