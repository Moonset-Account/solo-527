'use client';

import { TaskPriority } from '@/types';
import { getPriorityLabel, getPriorityColor, cn } from '@/lib/utils';
import { ArrowDown, Minus, ArrowUp, AlertCircle } from 'lucide-react';

interface PriorityBadgeProps {
  priority: TaskPriority;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

const iconMap = {
  low: ArrowDown,
  medium: Minus,
  high: ArrowUp,
  urgent: AlertCircle,
};

export default function PriorityBadge({ priority, size = 'md', className, showIcon = true }: PriorityBadgeProps) {
  const Icon = iconMap[priority];
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };
  
  return (
    <span className={cn('badge', getPriorityColor(priority), 'border-0', sizeClasses[size], className)}>
      {showIcon && <Icon className={cn('mr-1', size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3')} />}
      {getPriorityLabel(priority)}
    </span>
  );
}
