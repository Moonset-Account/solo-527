interface StatusBadgeProps {
  status: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'status-pending' },
  approved: { label: '已通过', className: 'status-approved' },
  rejected: { label: '已拒绝', className: 'status-rejected' },
  cancelled: { label: '已取消', className: 'status-cancelled' },
  completed: { label: '已完成', className: 'status-completed' },
  open: { label: '开放中', className: 'status-open' },
  full: { label: '已满', className: 'status-full' },
  closed: { label: '已关闭', className: 'status-closed' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  return <span className={`status-badge ${config.className}`}>{config.label}</span>;
}
