const statusMap: Record<string, string> = {
  pending: 'badge-pending',
  assigned: 'badge-assigned',
  'in-progress': 'badge-in-progress',
  in_progress: 'badge-in-progress',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
  closed: 'badge-closed',
  running: 'badge-running',
  stopped: 'badge-stopped',
  maintenance: 'badge-maintenance',
};

const statusLabels: Record<string, string> = {
  pending: '待处理',
  assigned: '已分配',
  'in-progress': '处理中',
  in_progress: '处理中',
  approved: '已审批',
  rejected: '已驳回',
  closed: '已关闭',
  running: '运行中',
  stopped: '停用',
  maintenance: '维护中',
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cls = statusMap[status] || 'badge-pending';
  const label = statusLabels[status] || status;
  return <span className={`badge ${cls}`}>{label}</span>;
}
