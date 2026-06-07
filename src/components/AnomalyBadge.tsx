import { AlertTriangle, StickyNote } from 'lucide-react'
import { useAppStore } from '@/hooks/useAppStore'

interface AnomalyBadgeProps {
  metric: string
  value: number
  expected: number
  direction: string
  targetKey: string
}

export function AnomalyBadge({ metric, value, expected, direction, targetKey }: AnomalyBadgeProps) {
  const { openNotesDrawer } = useAppStore()

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50/50 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        <AlertTriangle size={14} className="text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-red-700">
          {metric}异常：{direction === 'up' ? '↑' : '↓'} 当前 {value}{metric.includes('率') ? '%' : metric.includes('天') ? '天' : ''}
        </p>
        <p className="text-[10px] text-red-500/80">预期 {expected}{metric.includes('率') ? '%' : metric.includes('天') ? '天' : ''}</p>
      </div>
      <button
        onClick={() => openNotesDrawer({ targetKey, label: `${metric}异常 (${value})` })}
        className="flex h-6 w-6 items-center justify-center rounded hover:bg-red-100 text-red-500 transition-colors"
        title="添加备注"
      >
        <StickyNote size={12} />
      </button>
    </div>
  )
}
