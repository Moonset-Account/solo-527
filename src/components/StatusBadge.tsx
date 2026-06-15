import type { AppointmentStatus } from '../../shared/types';

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  pending: { label: '待确认', className: 'badge-pending' },
  confirmed: { label: '已确认', className: 'badge-confirmed' },
  arrived: { label: '已到店', className: 'badge-arrived' },
  completed: { label: '已完成', className: 'badge-completed' },
  no_show: { label: '爽约', className: 'badge-no_show' },
  cancelled: { label: '已取消', className: 'badge-cancelled' },
};

interface StatusBadgeProps {
  status: AppointmentStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return <span className={config.className}>{config.label}</span>;
}
