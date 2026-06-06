import React from 'react';
import { Empty, Button } from 'antd';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = '暂无数据',
  description = '当前筛选条件下没有数据，请尝试调整筛选条件',
  onReset,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center">
      <Empty
        image={<SearchX size={64} className="text-gray-300 mx-auto" />}
        description={
          <div>
            <p className="text-gray-600 font-medium">{title}</p>
            <p className="text-gray-400 text-sm mt-1">{description}</p>
          </div>
        }
      >
        {onReset && (
          <Button type="primary" onClick={onReset}>
            重置筛选条件
          </Button>
        )}
      </Empty>
    </div>
  );
};
