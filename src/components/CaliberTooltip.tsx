import { Info } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface CaliberTooltipProps {
  metricKey: string
  metricName: string
}

const caliberMap: Record<string, { definition: string; formula: string }> = {
  appointmentCount: {
    definition: '统计周期内所有状态为已预约、已完成、已取消、未到的记录总数',
    formula: 'COUNT(*) WHERE appointment_date IN [start, end]',
  },
  cancelRate: {
    definition: '已取消预约数占已完成+已取消+未到预约数的比例',
    formula: 'COUNT(status=cancelled) / COUNT(status IN (completed, cancelled, noShow))',
  },
  avgWaitDays: {
    definition: '从预约创建到首次咨询之间的平均等待天数（仅计算已完成和已预约状态）',
    formula: 'AVG(wait_days) WHERE status IN (appointed, completed)',
  },
  followUpRate: {
    definition: '已完成回访数占应回访总数的比例（仅计算已完成咨询的记录）',
    formula: 'COUNT(follow_up_status=completed) / COUNT(status=completed)',
  },
}

export function CaliberTooltip({ metricKey, metricName }: CaliberTooltipProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const caliber = caliberMap[metricKey]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!caliber) return null

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
      >
        <Info size={12} />
      </button>
      {open && (
        <div className="absolute left-0 top-6 z-40 w-64 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg">
          <p className="text-xs font-semibold text-zinc-800 mb-1">{metricName} · 口径说明</p>
          <p className="text-[11px] text-zinc-600 leading-relaxed mb-2">{caliber.definition}</p>
          <div className="rounded bg-zinc-50 px-2 py-1">
            <code className="text-[10px] text-teal-700 font-mono">{caliber.formula}</code>
          </div>
        </div>
      )}
    </div>
  )
}
