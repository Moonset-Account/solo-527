import { useEffect, useState } from 'react'
import { useAppStore } from '@/hooks/useAppStore'
import { AnomalyBadge } from '@/components/AnomalyBadge'
import { CaliberTooltip } from '@/components/CaliberTooltip'
import { Users, CalendarX, Clock, RefreshCcw, TrendingUp, TrendingDown } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface OverviewData {
  total: number
  completed: number
  cancelled: number
  noShow: number
  cancelRate: number
  avgWaitDays: number
  followUpRate: number
  trend: Array<{ date: string; total: number; cancelled: number }>
  anomalies: Array<{ metric: string; value: number; expected: number; direction: string }>
}

export default function Dashboard() {
  const { timeRange, setTimeRange } = useAppStore()
  const [data, setData] = useState<OverviewData | null>(null)

  useEffect(() => {
    fetch(`/api/analysis/overview?timeRange=${timeRange}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [timeRange])

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-zinc-400 text-sm">加载中...</div>
      </div>
    )
  }

  const kpis = [
    {
      label: '总预约数',
      value: data.total,
      suffix: '',
      icon: Users,
      color: 'teal',
      metricKey: 'appointmentCount',
    },
    {
      label: '取消率',
      value: data.cancelRate,
      suffix: '%',
      icon: CalendarX,
      color: data.cancelRate > 25 ? 'red' : 'teal',
      metricKey: 'cancelRate',
    },
    {
      label: '平均等待天数',
      value: data.avgWaitDays,
      suffix: '天',
      icon: Clock,
      color: data.avgWaitDays > 7 ? 'amber' : 'teal',
      metricKey: 'avgWaitDays',
    },
    {
      label: '回访完成率',
      value: data.followUpRate,
      suffix: '%',
      icon: RefreshCcw,
      color: data.followUpRate < 50 ? 'red' : 'teal',
      metricKey: 'followUpRate',
    },
  ]

  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    teal: { bg: 'bg-teal-50', text: 'text-teal-700', icon: 'bg-teal-100 text-teal-600' },
    red: { bg: 'bg-red-50', text: 'text-red-700', icon: 'bg-red-100 text-red-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'bg-amber-100 text-amber-600' },
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">概览仪表盘</h1>
          <p className="text-sm text-zinc-500 mt-0.5">学校心理咨询预约运营数据一览</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5">
          {['30', '90', '180'].map((d) => (
            <button
              key={d}
              onClick={() => setTimeRange(d)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                timeRange === d
                  ? 'bg-teal-600 text-white'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              近{d}天
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const colors = colorClasses[kpi.color]
          return (
            <div
              key={kpi.metricKey}
              className={`rounded-xl border border-zinc-100 bg-white p-4 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.icon}`}>
                    <kpi.icon size={16} />
                  </div>
                  <span className="text-xs font-medium text-zinc-500">{kpi.label}</span>
                </div>
                <CaliberTooltip metricKey={kpi.metricKey} metricName={kpi.label} />
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${colors.text}`}>
                  {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                </span>
                <span className="text-sm text-zinc-400">{kpi.suffix}</span>
              </div>
            </div>
          )
        })}
      </div>

      {data.anomalies.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            异常预警
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {data.anomalies.map((a, i) => (
              <AnomalyBadge
                key={i}
                metric={a.metric}
                value={a.value}
                expected={a.expected}
                direction={a.direction}
                targetKey={`${a.metric}:${a.direction}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-700">预约趋势</h2>
          <div className="flex items-center gap-4 text-[10px] text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-teal-500" /> 预约总量
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400" /> 取消量
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data.trend}>
            <defs>
              <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradCancel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97066" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F97066" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#A1A1AA' }}
              tickFormatter={(v: string) => v.substring(5)}
            />
            <YAxis tick={{ fontSize: 10, fill: '#A1A1AA' }} />
            <RechartsTooltip
              contentStyle={{
                fontSize: 11,
                borderRadius: 8,
                border: '1px solid #E4E4E7',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#0D9488"
              fill="url(#gradTotal)"
              strokeWidth={2}
              name="预约总量"
            />
            <Area
              type="monotone"
              dataKey="cancelled"
              stroke="#F97066"
              fill="url(#gradCancel)"
              strokeWidth={1.5}
              name="取消量"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
