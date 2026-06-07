'use client';

import { useState } from 'react';
import { Eye, Clock, Copy, Monitor, SkipForward, FileText } from 'lucide-react';
import { Sample } from '@/lib/mockData';
import { abnormalTypeLabels, formatDuration, statusLabels, cn } from '@/lib/utils';
import AbnormalSampleDrawer from './AbnormalSampleDrawer';

interface AbnormalSampleListProps {
  samples: Sample[];
  onMark?: (sampleId: string, action: 'approve' | 'reject') => void;
}

const iconMap: Record<string, any> = {
  fast_answer: Clock,
  duplicate_submission: Copy,
  device_concentration: Monitor,
  skip_abnormal: SkipForward,
  open_copy: FileText,
};

export default function AbnormalSampleList({ samples, onMark }: AbnormalSampleListProps) {
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleView = (sample: Sample) => {
    setSelectedSample(sample);
    setDrawerOpen(true);
  };

  const handleMark = (sampleId: string, action: 'approve' | 'reject') => {
    if (onMark) {
      onMark(sampleId, action);
    }
    setDrawerOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">异常样本列表</h3>
        <p className="text-sm text-gray-500 mt-1">共 {samples.length} 条异常样本</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">样本ID</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">答题时长</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">区域</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">异常类型</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提交时间</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {samples.slice(0, 20).map((sample) => (
              <tr key={sample.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="text-sm font-mono text-gray-900">{sample.id}</span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-700">{formatDuration(sample.totalDuration)}</span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-700">{sample.ipRegion}</span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {sample.abnormalTypes.map(type => {
                      const config = abnormalTypeLabels[type];
                      const Icon = iconMap[type];
                      return (
                        <span
                          key={type}
                          className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', config.bgColor, config.color)}
                        >
                          <Icon className="w-3 h-3" />
                          {config.label}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    statusLabels[sample.status].bgColor,
                    statusLabels[sample.status].color
                  )}>
                    {statusLabels[sample.status].label}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">
                    {new Date(sample.submittedAt).toLocaleDateString('zh-CN')}
                  </span>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleView(sample)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    查看
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AbnormalSampleDrawer
        sample={selectedSample}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onMark={handleMark}
      />
    </div>
  );
}
