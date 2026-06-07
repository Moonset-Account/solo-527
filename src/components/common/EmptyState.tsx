import React from 'react';
import { Database, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  type?: 'no-data' | 'no-results' | 'loading';
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  title,
  description,
  action
}) => {
  const defaultTitles = {
    'no-data': '暂无数据',
    'no-results': '未找到匹配结果',
    'loading': '数据加载中...'
  };

  const defaultDescriptions = {
    'no-data': '当前条件下没有可用的水质监测数据',
    'no-results': '请尝试调整筛选条件以获取更多结果',
    'loading': '正在从服务器获取数据，请稍候'
  };

  const Icon = type === 'loading' ? Database : AlertCircle;
  const iconAnimation = type === 'loading' ? 'animate-pulse' : '';

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className={`p-4 rounded-full bg-zinc-100 mb-4 ${iconAnimation}`}>
        <Icon size={32} className="text-zinc-400" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-700 mb-2">
        {title || defaultTitles[type]}
      </h3>
      <p className="text-sm text-zinc-500 text-center max-w-md mb-4">
        {description || defaultDescriptions[type]}
      </p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
};
