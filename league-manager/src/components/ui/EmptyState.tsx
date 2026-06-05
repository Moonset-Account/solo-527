import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = '暂无数据',
  description = '当前没有相关内容',
  children,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Inbox size={48} className="text-gray-300 mb-3" />
      <h3 className="text-lg font-medium text-gray-500">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
      {children}
    </div>
  );
}
