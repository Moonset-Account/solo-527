import type { StatusType } from '@/types';

const statusColorMap: Record<string, string> = {
  vacant: 'bg-emerald-500/20 text-emerald-400',
  rented: 'bg-blue-500/20 text-blue-400',
  maintenance: 'bg-amber-500/20 text-amber-400',
  reserved: 'bg-purple-500/20 text-purple-400',
  pending: 'bg-amber-500/20 text-amber-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-rose-500/20 text-rose-400',
  conflict: 'bg-rose-500/20 text-rose-400',
  draft: 'bg-gray-500/20 text-gray-400',
  owner_signed: 'bg-blue-500/20 text-blue-400',
  tenant_signed: 'bg-indigo-500/20 text-indigo-400',
  archived: 'bg-emerald-500/20 text-emerald-400',
  terminated: 'bg-rose-500/20 text-rose-400',
  open: 'bg-rose-500/20 text-rose-400',
  processing: 'bg-amber-500/20 text-amber-400',
  resolved: 'bg-emerald-500/20 text-emerald-400',
  sent: 'bg-emerald-500/20 text-emerald-400',
  failed: 'bg-rose-500/20 text-rose-400',
  success: 'bg-emerald-500/20 text-emerald-400',
  in_progress: 'bg-amber-500/20 text-amber-400',
  closed: 'bg-gray-500/20 text-gray-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-rose-500/20 text-rose-400',
  paid: 'bg-emerald-500/20 text-emerald-400',
};

const statusLabelMap: Record<string, string> = {
  vacant: '空置',
  rented: '已租',
  maintenance: '维修',
  reserved: '预留',
  pending: '待处理',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
  conflict: '冲突',
  draft: '草稿',
  owner_signed: '业主已签',
  tenant_signed: '租客已签',
  archived: '已归档',
  terminated: '已终止',
  open: '待处理',
  processing: '处理中',
  resolved: '已解决',
  sent: '已发送',
  failed: '失败',
  success: '成功',
  in_progress: '进行中',
  closed: '已关闭',
  approved: '已审批',
  rejected: '已驳回',
  paid: '已支付',
};

interface StatusBadgeProps {
  status: StatusType;
  pulse?: boolean;
}

export default function StatusBadge({ status, pulse }: StatusBadgeProps) {
  const colorClass = statusColorMap[status] || 'bg-gray-500/20 text-gray-400';
  const label = statusLabelMap[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${colorClass} ${
        pulse ? 'animate-pulse-alert' : ''
      }`}
    >
      {label}
    </span>
  );
}
