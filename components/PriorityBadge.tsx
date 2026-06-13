'use client';

import { TaskPriority } from '@/types';
import { getPriorityLabel, getPriorityColor, cn } from '@/lib/utils';
import { ArrowDown, Minus, ArrowUp, AlertCircle } from 'lucide-react';

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
  showIcon?: boolean;
}

const iconMap = {
  low: ArrowDown,
  medium: Minus,
  high: ArrowUp,
  urgent: AlertCircle,
};

export default function PriorityBadge({ priority, className, showIcon = true }: PriorityBadgeProps) {
  const Icon = iconMap[priority];
  
  return (
    <span className={cn('badge', getPriorityColor(priority), 'border-0', className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {getPriorityLabel(priority)}
    </span>
  );
}
