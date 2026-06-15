const priorityMap: Record<string, string> = {
  critical: 'badge-critical',
  high: 'badge-high',
  medium: 'badge-medium',
  low: 'badge-low',
};

const priorityLabels: Record<string, string> = {
  critical: '紧急',
  high: '高',
  medium: '中',
  low: '低',
};

interface PriorityBadgeProps {
  priority: string;
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const cls = priorityMap[priority] || 'badge-medium';
  const label = priorityLabels[priority] || priority;
  return <span className={`badge ${cls}`}>{label}</span>;
}
