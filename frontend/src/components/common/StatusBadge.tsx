import { forwardRef } from 'react';
import { Badge } from './Badge';
import type { TicketStatus } from '@/types';
import { TICKET_STATUS_MAP } from '@/utils/constants';
import type { BadgeVariant } from './Badge';

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className }, ref) => {
    const config = TICKET_STATUS_MAP[status];
    const variant = config.color as BadgeVariant;

    return (
      <Badge ref={ref} variant={variant} className={className}>
        {config.label}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';
