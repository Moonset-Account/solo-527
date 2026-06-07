import { Clock, CalendarCheck, AlertTriangle, Timer, Activity, TrendingUp, TrendingDown } from 'lucide-react'
import type { KPISummary } from '@/types'

function ChangeBadge({ value, label }: { value: number; label: string }) {
  if (value === 0) return null
  const isPositive = value > 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded ${
        isPositive ? 'text-[#2ECC71] bg-[#2ECC71]/10' : 'text-[#E74C3C] bg-[#E74C3C]/10'
      }`}
    >
      {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {label} {isPositive ? '+' : ''}{(value * 100).toFixed(1)}%
    </span>
  )
}

export default function KPICards({ data }: { data: KPISummary }) {
  const cards = [
    {
      label: '总停机时长',
      value: data.totalDowntimeMinutes,
      unit: '分钟',
      icon: Clock,
      color: '#94A3B8',
      gradient: 'from-[#1B2A4A] to-[#0F1B2D]',
    },
    {
      label: '计划停机占比',
      value: (data.plannedRatio * 100).toFixed(1),
      unit: '%',
      icon: CalendarCheck,
      color: '#3498DB',
    },
    {
      label: '突发停机占比',
      value: ((1 - data.plannedRatio) * 100).toFixed(1),
      unit: '%',
      icon: AlertTriangle,
      color: '#E74C3C',
    },
    {
      label: '平均维修响应',
      value: data.avgRepairResponseMinutes,
      unit: '分钟',
      icon: Timer,
      color: '#FF6B35',
    },
    {
      label: '设备可用率',
      value: (data.equipmentAvailabilityRate * 100).toFixed(1),
      unit: '%',
      icon: Activity,
      color: '#2ECC71',
    },
  ]

  return (
    <div className="flex gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className={`flex-1 bg-gradient-to-br ${card.gradient ?? ''} bg-[#0F1B2D] rounded-xl border border-[#1E3A5F] p-4 flex items-center gap-3`}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${card.color}20` }}
            >
              <Icon size={20} style={{ color: card.color }} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white truncate">{card.value}</span>
                <span className="text-xs text-[#94A3B8]">{card.unit}</span>
              </div>
              <span className="text-xs text-[#94A3B8]">{card.label}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <ChangeBadge value={data.weekOverWeekChange} label="环比" />
                <ChangeBadge value={data.yearOverYearChange} label="同比" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
