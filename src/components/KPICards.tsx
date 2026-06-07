import { useFilterStore } from '@/store/filterStore'
import { getKPIMetrics } from '@/api/aggregation'
import { Clock, AlertTriangle, Timer, PieChart, BarChart3, Activity } from 'lucide-react'

const ICONS = [Clock, AlertTriangle, Timer, PieChart, BarChart3, Activity]

export default function KPICards() {
  const filters = useFilterStore()
  const kpi = getKPIMetrics(filters)

  const cards = [
    { label: '总停机时长', value: kpi.totalDowntime.toLocaleString(), unit: '分钟', color: 'text-alert' },
    { label: '停机次数', value: kpi.downtimeCount.toLocaleString(), unit: '次', color: 'text-unplanned' },
    { label: '平均修复时长', value: kpi.avgRepairDuration.toFixed(1), unit: '分钟', color: 'text-accent' },
    { label: '计划停机占比', value: kpi.plannedRatio.toFixed(1), unit: '%', color: 'text-planned' },
    { label: 'MTBF', value: kpi.mtbf.toFixed(1), unit: '小时', color: 'text-accent-light' },
    { label: 'MTTR', value: kpi.mttr.toFixed(1), unit: '小时', color: 'text-alert-light' },
  ]

  return (
    <div className="grid grid-cols-6 gap-3">
      {cards.map((card, i) => {
        const Icon = ICONS[i]
        return (
          <div key={card.label} className="bg-base-800 rounded-lg border border-base-600/30 p-3 hover:border-accent/30 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-base-400">{card.label}</span>
              <Icon className={`w-4 h-4 ${card.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-mono font-bold ${card.color}`}>{card.value}</span>
              <span className="text-xs text-base-400">{card.unit}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
