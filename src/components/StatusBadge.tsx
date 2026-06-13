import type { RequestStatus } from '@/types';
import { getStatusLabel } from '@/utils/format';

const statusStyles: Record<RequestStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  identity_verifying: 'bg-blue-100 text-blue-800',
  quota_checking: 'bg-purple-100 text-purple-800',
  assigned: 'bg-indigo-100 text-indigo-800',
  processing: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  waitlisted: 'bg-orange-100 text-orange-800',
};

interface StatusBadgeProps {
  status: RequestStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
