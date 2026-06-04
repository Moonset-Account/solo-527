interface StatusBadgeProps {
  status: string;
}

const greenStatuses = ['active', 'scheduled', 'approved', 'checked_in'];
const orangeStatuses = ['frozen', 'pending', 'booked'];
const redStatuses = ['expired', 'cancelled', 'rejected', 'no_show'];
const grayStatuses = ['exhausted'];

const statusLabels: Record<string, string> = {
  active: '正常',
  frozen: '冻结',
  expired: '已过期',
  cancelled: '已取消',
  exhausted: '已用完',
  inactive: '停用',
  scheduled: '已排课',
  completed: '已完成',
  booked: '已预约',
  checked_in: '已签到',
  no_show: '未到',
  pending: '待审核',
  approved: '已批准',
  rejected: '已拒绝',
};

function getStatusColor(status: string): string {
  if (greenStatuses.includes(status)) return 'bg-emerald-100 text-emerald-700';
  if (orangeStatuses.includes(status)) return 'bg-orange-100 text-orange-700';
  if (redStatuses.includes(status)) return 'bg-rose-100 text-rose-700';
  if (grayStatuses.includes(status)) return 'bg-gray-100 text-gray-600';
  return 'bg-gray-100 text-gray-600';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = getStatusColor(status);
  const label = statusLabels[status] || status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}
