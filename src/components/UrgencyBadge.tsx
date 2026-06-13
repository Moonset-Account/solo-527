import type { Urgency } from '@/types';
import { getUrgencyLabel } from '@/utils/format';

const urgencyStyles: Record<Urgency, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800 animate-pulse',
};

interface UrgencyBadgeProps {
  urgency: Urgency;
}

export default function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${urgencyStyles[urgency]}`}
    >
      {getUrgencyLabel(urgency)}
    </span>
  );
}
