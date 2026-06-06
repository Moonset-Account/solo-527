import React from 'react';
import { DemandStatus, QuoteStatus, ContractStatus, PaymentNodeStatus } from '../types';

interface StatusBadgeProps {
  status: DemandStatus | QuoteStatus | ContractStatus | PaymentNodeStatus;
  type?: 'demand' | 'quote' | 'contract' | 'payment';
}

const statusConfig: Record<string, { label: string; className: string }> = {
  'demand:pending': { label: '待处理', className: 'bg-amber-100 text-amber-700' },
  'demand:quoting': { label: '报价中', className: 'bg-blue-100 text-blue-700' },
  'demand:quoted': { label: '已报价', className: 'bg-teal-100 text-teal-700' },
  'demand:confirmed': { label: '已确认', className: 'bg-green-100 text-green-700' },
  'demand:cancelled': { label: '已取消', className: 'bg-slate-100 text-slate-600' },
  'quote:draft': { label: '草稿', className: 'bg-slate-100 text-slate-600' },
  'quote:pending_approval': { label: '待审批', className: 'bg-amber-100 text-amber-700' },
  'quote:approved': { label: '已通过', className: 'bg-green-100 text-green-700' },
  'quote:rejected': { label: '已驳回', className: 'bg-red-100 text-red-700' },
  'quote:sent': { label: '已发送', className: 'bg-blue-100 text-blue-700' },
  'contract:draft': { label: '草稿', className: 'bg-slate-100 text-slate-600' },
  'contract:pending': { label: '待审批', className: 'bg-amber-100 text-amber-700' },
  'contract:approved': { label: '已通过', className: 'bg-green-100 text-green-700' },
  'contract:rejected': { label: '已驳回', className: 'bg-red-100 text-red-700' },
  'contract:signed': { label: '已签署', className: 'bg-teal-100 text-teal-700' },
  'payment:pending': { label: '待付款', className: 'bg-amber-100 text-amber-700' },
  'payment:paid': { label: '已付款', className: 'bg-green-100 text-green-700' },
  'payment:overdue': { label: '已逾期', className: 'bg-red-100 text-red-700' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'demand' }) => {
  const key = `${type}:${status}`;
  const config = statusConfig[key] || { label: status, className: 'bg-slate-100 text-slate-600' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};
