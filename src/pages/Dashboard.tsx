import { useState, useEffect } from 'react'

import { LineChart, Line, ResponsiveContainer, Tooltip, CartesianGrid, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, BookOpen, RefreshCw, Clock, AlertCircle } from 'lucide-react'
import { useFilterStore } from '@/store/filterStore'
import { apiPost } from '@/utils/api'
import EmptyState, { SkeletonCard, SkeletonChart } from '@/components/EmptyState'
import ExportButton from '@/components/ExportButton'
import ChildDataBadge from '@/components/ChildDataBadge'

interface KpiMetric {
  value: number
  yoyChange: number
  momChange: number
  isAnomaly: boolean
  trend: { week: string; value: number }[]
}

interface KpiData {
  borrowCount: KpiMetric
  renewalRate: KpiMetric
  reservationFulfillRate: KpiMetric
  overdueRate: KpiMetric
}

const KPI_CONFIG = [
  { key: 'borrowCount' as const, label: '借阅量', icon: BookOpen, unit: '', color: '#6C5CE7' },
  { key: 'renewalRate' as const, label: '续借率', icon: RefreshCw, unit: '%', color: '#00B894' },
  { key: 'reservationFulfillRate' as const, label: '预约满足率', icon: Clock, unit: '%', color: '#FDCB6E' },
  { key: 'overdueRate' as const, label: '逾期率', icon: AlertCircle, unit: '%', color: '#FF6B6B' },
]

function ChangeIndicator({ value, label }: { value: number; label: string }) {
  const isPositive = value > 0
  const isNegative = value < 0
  return (
    <span className="flex items-center gap-0.5 text-xs">
      {isPositive && <TrendingUp className="w-3 h-3 text-[#00B894]" />}
      {isNegative && <TrendingDown className="w-3 h-3 text-[#FF6B6B]" />}
      <span className={isPositive ? 'text-[#00B894]' : isNegative ? 'text-[#FF6B6B]' : 'text-slate-400'}>
        {label} {isPositive ? '+' : ''}{value}%
      </span>
    </span>
  )
}

function KpiCard({ metric, config }: { metric: KpiMetric; config: typeof KPI_CONFIG[number] }) {
  const Icon = config.icon
  return (
    <div className="relative rounded-xl bg-white p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      {metric.isAnomaly && (
        <div className="absolute top-4 right-4 flex items-center gap-1 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-[#FF6B6B]" />
          <AlertTriangle className="w-3.5 h-3.5 text-[#FF6B6B]" />
        </div>
      )}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${config.color}15` }}>
          <Icon className="w-4 h-4" style={{ color: config.color }} />
        </div>
        <span className="text-xs font-medium text-slate-500 tracking-wide">{config.label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-1.5">
        <span className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {metric.value.toLocaleString()}
        </span>
        {config.unit && <span className="text-sm text-slate-400">{config.unit}</span>}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <ChangeIndicator value={metric.yoyChange} label="同比" />
        <ChangeIndicator value={metric.momChange} label="环比" />
      </div>
      <div className="h-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={metric.trend}>
            <Line type="monotone" dataKey="value" stroke={config.color} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TrendChart({ metric, config }: { metric: KpiMetric; config: typeof KPI_CONFIG[number] }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
        <span className="text-sm font-semibold text-slate-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {config.label}趋势
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={metric.trend}>
          <defs>
            <linearGradient id={`grad-${config.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config.color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={config.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          />
          <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={2} fill={`url(#grad-${config.key})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Dashboard() {
  const filters = useFilterStore((s) => s.filters)
  const [data, setData] = useState<KpiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [childDataAggregated, setChildDataAggregated] = useState(false)

  const fetchKpi = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiPost<KpiData>('/api/kpi', { filters })
      setData(res.data)
      setChildDataAggregated(res.meta.childDataAggregated)
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKpi()
  }, [filters])

  if (error) {
    return (
      <div className="p-6">
        <EmptyState type="error" message={error} onRetry={fetchKpi} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            数据概览
          </h1>
          <ChildDataBadge show={childDataAggregated} />
        </div>
        <ExportButton targetId="dashboard-content" />
      </div>

      <div id="dashboard-content">
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonChart key={i} />)}
            </div>
          </div>
        ) : !data ? (
          <EmptyState type="empty" />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {KPI_CONFIG.map((cfg) => (
                <KpiCard key={cfg.key} metric={data[cfg.key]} config={cfg} />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {KPI_CONFIG.map((cfg) => (
                <TrendChart key={cfg.key} metric={data[cfg.key]} config={cfg} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
