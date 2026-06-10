import { cn } from '@/lib/utils'

type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'gray'

interface StatusBadgeProps {
  status: StatusType
  text: string
  dot?: boolean
  className?: string
}

export default function StatusBadge({ status, text, dot = false, className }: StatusBadgeProps) {
  const statusStyles: Record<StatusType, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    primary: 'bg-primary-100 text-primary-800',
    gray: 'bg-gray-100 text-gray-800',
  }

  const dotColors: Record<StatusType, string> = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    primary: 'bg-primary-500',
    gray: 'bg-gray-500',
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', statusStyles[status], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[status])} />}
      {text}
    </span>
  )
}
