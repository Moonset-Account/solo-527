'use client';

import { TaskStatus } from '@/types';
import { getStatusLabel, getStatusColor, cn } from '@/lib/utils';
import { CheckCircle, Clock, AlertTriangle, ListTodo } from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

const iconMap = {
  todo: ListTodo,
  in_progress: Clock,
  completed: CheckCircle,
  overdue: AlertTriangle,
};

export default function StatusBadge({ status, size = 'md', className, showIcon = true }: StatusBadgeProps) {
  const Icon = iconMap[status];
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };
  
  return (
    <span className={cn('badge', getStatusColor(status), sizeClasses[size], className)}>
      {showIcon && <Icon className={cn('mr-1', size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3')} />}
      {getStatusLabel(status)}
    </span>
  );
}
