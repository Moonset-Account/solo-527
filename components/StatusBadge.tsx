'use client';

import { TaskStatus } from '@/types';
import { getStatusLabel, getStatusColor, cn } from '@/lib/utils';
import { CheckCircle, Clock, AlertTriangle, ListTodo } from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
  showIcon?: boolean;
}

const iconMap = {
  todo: ListTodo,
  in_progress: Clock,
  completed: CheckCircle,
  overdue: AlertTriangle,
};

export default function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const Icon = iconMap[status];
  
  return (
    <span className={cn('badge', getStatusColor(status), className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {getStatusLabel(status)}
    </span>
  );
}
