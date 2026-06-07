import { Inbox, SearchX } from 'lucide-react';

interface EmptyStateProps {
  type?: 'no-data' | 'no-result';
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  type = 'no-data',
  title,
  description,
  action
}: EmptyStateProps) {
  const defaultTitles = {
    'no-data': '暂无数据',
    'no-result': '未找到匹配结果'
  };

  const defaultDescriptions = {
    'no-data': '当前筛选条件下没有数据，请尝试调整筛选条件',
    'no-result': '没有找到符合条件的记录，请检查筛选条件'
  };

  const Icon = type === 'no-data' ? Inbox : SearchX;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h4 className="text-base font-medium text-slate-700 mb-1">
        {title || defaultTitles[type]}
      </h4>
      <p className="text-sm text-slate-500 mb-4 text-center max-w-md">
        {description || defaultDescriptions[type]}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
