import React from 'react';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  normal: { bg: 'bg-green-100', text: 'text-green-700', label: '正常' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '预警' },
  fault: { bg: 'bg-red-100', text: 'text-red-700', label: '故障' },
  maintenance: { bg: 'bg-blue-100', text: 'text-blue-700', label: '维护中' },
  pending: { bg: 'bg-orange-100', text: 'text-orange-700', label: '待处理' },
  assigned: { bg: 'bg-blue-100', text: 'text-blue-700', label: '已指派' },
  in_progress: { bg: 'bg-purple-100', text: 'text-purple-700', label: '处理中' },
  completed: { bg: 'bg-green-100', text: 'text-green-700', label: '已完成' },
  verified: { bg: 'bg-teal-100', text: 'text-teal-700', label: '已复核' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-700', label: '已关闭' },
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700', label: '已排期' },
  rescheduled: { bg: 'bg-purple-100', text: 'text-purple-700', label: '已改期' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', label: '已取消' },
  waiting: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '等待中' },
  notified: { bg: 'bg-blue-100', text: 'text-blue-700', label: '已通知' },
  enrolled: { bg: 'bg-green-100', text: 'text-green-700', label: '已报名' },
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
}

export function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };

  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {customLabel || config.label}
    </span>
  );
}
