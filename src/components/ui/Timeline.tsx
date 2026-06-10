import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TimelineStatus = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'default'

interface TimelineItem {
  id?: string | number
  title: string
  description?: ReactNode
  time?: string
  status?: TimelineStatus
  icon?: ReactNode
  extra?: ReactNode
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

export default function Timeline({ items, className }: TimelineProps) {
  const statusColors: Record<TimelineStatus, string> = {
    success: 'bg-green-500 border-green-500',
    warning: 'bg-yellow-500 border-yellow-500',
    danger: 'bg-red-500 border-red-500',
    info: 'bg-blue-500 border-blue-500',
    primary: 'bg-primary-500 border-primary-500',
    default: 'bg-gray-400 border-gray-400',
  }

  const statusRingColors: Record<TimelineStatus, string> = {
    success: 'bg-green-100',
    warning: 'bg-yellow-100',
    danger: 'bg-red-100',
    info: 'bg-blue-100',
    primary: 'bg-primary-100',
    default: 'bg-gray-100',
  }

  return (
    <div className={cn('space-y-1', className)}>
      {items.map((item, index) => {
        const status = item.status || 'default'
        const isLast = index === items.length - 1

        return (
          <div key={item.id ?? index} className="relative flex gap-4">
            {!isLast && (
              <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-gray-200" />
            )}

            <div
              className={cn(
                'relative z-10 flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 mt-0.5',
                statusRingColors[status]
              )}
            >
              <div className={cn('w-3 h-3 rounded-full', statusColors[status])} />
            </div>

            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                  {item.description && (
                    <div className="mt-1 text-sm text-gray-500">{item.description}</div>
                  )}
                </div>
                {item.time && (
                  <span className="text-xs text-gray-400 flex-shrink-0">{item.time}</span>
                )}
              </div>
              {item.extra && <div className="mt-2">{item.extra}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
