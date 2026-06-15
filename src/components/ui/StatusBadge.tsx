import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const VARIANT_MAP: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
}

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  confirmed: 'success',
  completed: 'success',
  available: 'success',
  healthy: 'success',
  approved: 'success',
  pending: 'warning',
  in_progress: 'info',
  in_use: 'warning',
  degraded: 'warning',
  occupied: 'neutral',
  cancelled: 'danger',
  disabled: 'danger',
  down: 'danger',
  rejected: 'danger',
}

interface StatusBadgeProps {
  status?: string
  label?: string
  variant?: BadgeVariant
  className?: string
  children?: React.ReactNode
}

export default function StatusBadge({ status, label, variant, className, children }: StatusBadgeProps) {
  const resolvedVariant = variant || (status ? STATUS_VARIANT_MAP[status] || 'neutral' : 'neutral')
  const badgeClass = VARIANT_MAP[resolvedVariant]
  const displayText = children || label || status || ''

  return (
    <span className={cn(badgeClass, className)}>
      {displayText}
    </span>
  )
}
