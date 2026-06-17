import { forwardRef } from 'react';
import { Badge } from './Badge';
import type { TicketPriority } from '@/types';
import { TICKET_PRIORITY_MAP } from '@/utils/constants';
import type { BadgeVariant } from './Badge';

interface PriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

export const PriorityBadge = forwardRef<HTMLSpanElement, PriorityBadgeProps>(
  ({ priority, className }, ref) => {
    const config = TICKET_PRIORITY_MAP[priority];
    const variant = config.color as BadgeVariant;

    return (
      <Badge ref={ref} variant={variant} className={className}>
        {config.label}
      </Badge>
    );
  }
);

PriorityBadge.displayName = 'PriorityBadge';
