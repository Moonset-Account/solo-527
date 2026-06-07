'use client';

import { X, Clock, Copy, Monitor, SkipForward, FileText, AlertCircle, Check, XCircle } from 'lucide-react';
import { Sample } from '@/lib/mockData';
import { abnormalTypeLabels, formatDuration, statusLabels, cn } from '@/lib/utils';

interface AbnormalSampleDrawerProps {
  sample: Sample | null;
  isOpen: boolean;
  onClose: () => void;
  onMark?: (sampleId: string, action: 'approve' | 'reject') => void;
}

const iconMap: Record<string, any> = {
  fast_answer: Clock,
  duplicate_submission: Copy,
  device_concentration: Monitor,
  skip_abnormal: SkipForward,
  open_copy: FileText,
};

export default function AbnormalSampleDrawer({ sample, isOpen, onClose, onMark }: AbnormalSampleDrawerProps) {
  if (!isOpen || !sample) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/40 transition-opacity" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">样本详情</h3>
              <p className="text-sm text-gray-500 mt-0.5">ID: {sample.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            <div className="flex items-center gap-3">
              <span className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                statusLabels[sample.status].bgColor,
                statusLabels[sample.status].color
              )}>
                {statusLabels[sample.status].label}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(sample.submittedAt).toLocaleString('zh-CN')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">答题总时长</p>
                <p className="text-lg font-semibold text-gray-900">{formatDuration(sample.totalDuration)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">IP 区域</p>
                <p className="text-lg font-semibold text-gray-900">{sample.ipRegion}</p>
              </div>
            </div>

            {sample.abnormalTypes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  异常类型
                </h4>
                <div className="space-y-2">
                  {sample.abnormalTypes.map(type => {
                    const config = abnormalTypeLabels[type];
                    const Icon = iconMap[type];
                    return (
                      <div key={type} className={cn('flex items-center gap-3 p-3 rounded-lg', config.bgColor)}>
                        <Icon className={cn('w-5 h-5', config.color)} />
                        <span className={cn('text-sm font-medium', config.color)}>{config.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">题组耗时</h4>
              <div className="space-y-2">
                {sample.questionGroupDurations.map(group => (
                  <div key={group.groupName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">{group.groupName}</span>
                    <span className="text-sm font-medium text-gray-900">{formatDuration(group.duration)}</span>
                  </div>
                ))}
              </div>
            </div>

            {sample.skipPattern.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">跳题模式</h4>
                <div className="flex flex-wrap gap-2">
                  {sample.skipPattern.map(qNum => (
                    <span key={qNum} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                      Q{qNum}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {sample.openAnswers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">开放题回答</h4>
                <div className="space-y-3">
                  {sample.openAnswers.map((qa, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-medium text-gray-500 mb-2">{qa.question}</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{qa.answer}</p>
                      {qa.similarity !== undefined && qa.similarity > 0.7 && (
                        <p className="text-xs text-pink-600 mt-2">
                          相似度: {(qa.similarity * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {sample.status === 'pending' && onMark && (
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => onMark(sample.id, 'reject')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <XCircle className="w-4 h-4" />
                标记无效
              </button>
              <button
                onClick={() => onMark(sample.id, 'approve')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                <Check className="w-4 h-4" />
                确认有效
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
