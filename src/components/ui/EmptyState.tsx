import type { ReactNode } from 'react';

export function EmptyState({
  title = '暂无数据',
  description,
  icon = '📭',
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-2xl mb-4">
        {icon}
      </div>
      <h3 className="text-base font-display font-semibold text-gray-700">{title}</h3>
      {description && <p className="text-sm text-gray-500 mt-1 max-w-sm">{description}</p>}
    </div>
  );
}
