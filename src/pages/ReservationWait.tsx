import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, ReferenceLine, Cell,
} from 'recharts'
import { Clock, AlertTriangle, Users, TrendingUp } from 'lucide-react'
import { useFilterStore } from '@/store/filterStore'
import { apiPost } from '@/utils/api'
import EmptyState, { SkeletonChart } from '@/components/EmptyState'
import ExportButton from '@/components/ExportButton'
import ChildDataBadge from '@/components/ChildDataBadge'

interface ReservationWaitData {
  queueDepth: { bookTitle: string; queueSize: number; urgency: 'high' | 'medium' | 'low' }[]
  waitDistribution: { range: string; count: number; median: number }[]
  fulfillRateTrend: { week: string; rate: number; isAnomaly: boolean }[]
}

const URGENCY_COLORS: Record<string, string> = {
  high: '#FF6B6B',
  medium: '#FDCB6E',
  low: '#00B894',
}

const FULFILL_THRESHOLD = 70

function QueueTooltip({ active, payload }: { active?: boolean; payload?: { payload: { bookTitle: string; queueSize: number; urgency: string } }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-100 p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-slate-700 mb-1">{d.bookTitle}</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-slate-500">排队人数</span>
        <span className="font-medium text-slate-800">{d.queueSize}</span>
      </div>
      <div className="flex items-center justify-between gap-4 mt-0.5">
        <span className="text-slate-500">紧急程度</span>
        <span className="font-medium" style={{ color: URGENCY_COLORS[d.urgency] }}>
          {d.urgency === 'high' ? '高' : d.urgency === 'medium' ? '中' : '低'}
        </span>
      </div>
    </div>
  )
}

function AnomalyDot(props: { cx?: number; cy?: number; payload?: { isAnomaly: boolean; rate: number } }) {
  const { cx, cy, payload } = props
  if (!cx || !cy || !payload) return null
  if (payload.isAnomaly) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="#FF6B6B" opacity={0.25} className="animate-pulse" />
        <circle cx={cx} cy={cy} r={4} fill="#FF6B6B" stroke="#fff" strokeWidth={1.5} />
      </g>
    )
  }
  const isBelow = payload.rate < FULFILL_THRESHOLD
  return (
    <circle cx={cx} cy={cy} r={3} fill={isBelow ? '#FF6B6B' : '#00B894'} stroke="#fff" strokeWidth={1} />
  )
}

export default function ReservationWait() {
  const filters = useFilterStore((s) => s.filters)
  const [data, setData] = useState<ReservationWaitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [childDataAggregated, setChildDataAggregated] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiPost<ReservationWaitData>('/api/reservation-wait', { filters })
      setData(res.data)
      setChildDataAggregated(res.meta.childDataAggregated)
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchData() }, [fetchData])

  const topQueue = data?.queueDepth?.slice(0, 20) ?? []
  const overallMedian = data?.waitDistribution?.[0]?.median ?? 0

  if (error) {
    return <div className="p-6"><EmptyState type="error" message={error} onRetry={fetchData} /></div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            预约等待分析
          </h1>
          <ChildDataBadge show={childDataAggregated} />
        </div>
        <ExportButton targetId="reservation-wait-content" />
      </div>

      <div id="reservation-wait-content" className="space-y-6">
        {loading ? (
          <div className="space-y-6">
            <SkeletonChart />
            <SkeletonChart />
            <SkeletonChart />
          </div>
        ) : !data ? (
          <EmptyState type="empty" />
        ) : (
          <>
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#FF6B6B15]">
                  <Users className="w-4 h-4 text-[#FF6B6B]" />
                </div>
                <span className="text-sm font-semibold text-slate-700">排队深度 Top 20</span>
                <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
                  {(['high', 'medium', 'low'] as const).map((u) => (
                    <span key={u} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: URGENCY_COLORS[u] }} />
                      {u === 'high' ? '高' : u === 'medium' ? '中' : '低'}
                    </span>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={480}>
                <BarChart data={topQueue} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="bookTitle" tick={{ fontSize: 11, fill: '#64748b' }} width={120} />
                  <Tooltip content={<QueueTooltip />} />
                  <Bar dataKey="queueSize" radius={[0, 4, 4, 0]} barSize={18} name="排队人数">
                    {topQueue.map((entry, i) => (
                      <Cell key={i} fill={URGENCY_COLORS[entry.urgency]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#6C5CE715]">
                  <Clock className="w-4 h-4 text-[#6C5CE7]" />
                </div>
                <span className="text-sm font-semibold text-slate-700">等待时间分布</span>
                <span className="ml-auto text-xs text-slate-400">
                  中位数: <span className="font-medium text-[#6C5CE7]">{overallMedian} 天</span>
                </span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.waitDistribution} margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    formatter={(value: number) => [value.toLocaleString(), '人数']}
                    labelFormatter={(label: string) => `等待时长: ${label}`}
                  />
                  <ReferenceLine
                    y={overallMedian}
                    stroke="#6C5CE7"
                    strokeDasharray="6 3"
                    strokeWidth={1.5}
                    label={{ value: `中位数 ${overallMedian}`, position: 'right', fill: '#6C5CE7', fontSize: 11 }}
                  />
                  <Bar dataKey="count" fill="#6C5CE7" radius={[4, 4, 0, 0]} barSize={32} name="人数" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#00B89415]">
                  <TrendingUp className="w-4 h-4 text-[#00B894]" />
                </div>
                <span className="text-sm font-semibold text-slate-700">履约率趋势</span>
                <span className="ml-auto flex items-center gap-1 text-xs text-slate-400">
                  <AlertTriangle className="w-3 h-3 text-[#FF6B6B]" />
                  红点为异常点
                </span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.fulfillRateTrend} margin={{ left: 10, right: 20 }}>
                  <defs>
                    <linearGradient id="fulfillGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B894" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00B894" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    formatter={(value: number, _: string, props: { payload: { isAnomaly: boolean } }) => [
                      `${value}%${props.payload.isAnomaly ? ' ⚠ 异常' : ''}`,
                      '履约率',
                    ]}
                  />
                  <ReferenceLine
                    y={FULFILL_THRESHOLD}
                    stroke="#FF6B6B"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{ value: `阈值 ${FULFILL_THRESHOLD}%`, position: 'right', fill: '#FF6B6B', fontSize: 10 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#00B894"
                    strokeWidth={2}
                    fill="url(#fulfillGrad)"
                    dot={<AnomalyDot />}
                    activeDot={{ r: 5, fill: '#00B894' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
