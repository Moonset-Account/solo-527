'use client';

import Link from 'next/link';
import { Clock, Copy, Monitor, SkipForward, FileText, ChevronRight, AlertTriangle } from 'lucide-react';
import { Channel } from '@/lib/mockData';
import { getQualityScoreColor, getQualityScoreBgColor, cn } from '@/lib/utils';

interface QualityCardProps {
  channel: Channel;
}

const metricConfig = [
  { key: 'fastAnswerCount', label: '答题过快', icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  { key: 'duplicateSubmissionCount', label: '重复提交', icon: Copy, color: 'text-red-600', bgColor: 'bg-red-50' },
  { key: 'deviceConcentrationCount', label: '设备集中', icon: Monitor, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  { key: 'skipAbnormalCount', label: '跳题异常', icon: SkipForward, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { key: 'openCopyCount', label: '开放题复制', icon: FileText, color: 'text-pink-600', bgColor: 'bg-pink-50' },
];

export default function QualityCard({ channel }: QualityCardProps) {
  const totalAbnormal = channel.fastAnswerCount + channel.duplicateSubmissionCount + 
    channel.deviceConcentrationCount + channel.skipAbnormalCount + channel.openCopyCount;

  return (
    <Link
      href={`/channels/${channel.id}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{channel.name}</h3>
            <p className="text-sm text-gray-500">样本量: {channel.totalSamples.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <div className={cn('text-2xl font-bold', getQualityScoreColor(channel.qualityScore))}>
              {channel.qualityScore}
            </div>
            <div className="text-xs text-gray-500">质量分</div>
          </div>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
          <div
            className={cn('h-2 rounded-full transition-all duration-300', getQualityScoreBgColor(channel.qualityScore))}
            style={{ width: `${channel.qualityScore}%` }}
          />
        </div>

        <div className="grid grid-cols-5 gap-2 mb-4">
          {metricConfig.map((metric) => {
            const value = channel[metric.key as keyof Channel] as number;
            const Icon = metric.icon;
            return (
              <div key={metric.key} className="text-center">
                <div className={cn('w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-1', metric.bgColor)}>
                  <Icon className={cn('w-4 h-4', metric.color)} />
                </div>
                <div className={cn('text-sm font-semibold', value > 0 ? metric.color : 'text-gray-400')}>
                  {value}
                </div>
                <div className="text-xs text-gray-500 truncate">{metric.label}</div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {channel.pendingReview > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                <AlertTriangle className="w-3 h-3" />
                {channel.pendingReview} 条待复核
              </span>
            )}
            <span className="text-xs text-gray-400">异常共 {totalAbnormal} 条</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </Link>
  );
}
