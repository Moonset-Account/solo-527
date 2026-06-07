import { useState, useEffect } from 'react'
import { useAppStore } from '@/hooks/useAppStore'
import { CaliberTooltip } from '@/components/CaliberTooltip'
import { StickyNote, ChevronDown } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts'

type Dimension = 'grade' | 'counselingType' | 'timePeriod' | 'channel' | 'status'
type Metric = 'appointmentCount' | 'cancelRate' | 'avgWaitDays' | 'followUpRate'

const DIMENSION_OPTIONS: { value: Dimension; label: string }[] = [
  { value: 'grade', label: '年级' },
  { value: 'counselingType', label: '咨询类型' },
  { value: 'timePeriod', label: '时间段' },
  { value: 'channel', label: '预约渠道' },
  { value: 'status', label: '状态' },
]

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: 'appointmentCount', label: '预约数' },
  { value: 'cancelRate', label: '取消率' },
  { value: 'avgWaitDays', label: '平均等待天数' },
  { value: 'followUpRate', label: '回访完成率' },
]

const CHART_TYPES = ['bar', 'radar'] as const

export default function Compare() {
  const { timeRange, openNotesDrawer } = useAppStore()
  const [dimensions, setDimensions] = useState<Dimension[]>(['grade'])
  const [metrics, setMetrics] = useState<Metric[]>(['cancelRate'])
  const [chartType, setChartType] = useState<'bar' | 'radar'>('bar')
  const [data, setData] = useState<Array<Record<string, string | number>>>([])
  const [dimDropdownOpen, setDimDropdownOpen] = useState(false)
  const [metDropdownOpen, setMetDropdownOpen] = useState(false)

  useEffect(() => {
    const end = '2026-05-31'
    const days = parseInt(timeRange, 10)
    const start = new Date(new Date(end).getTime() - days * 86400000).toISOString().split('T')[0]

    fetch('/api/aggregation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dimensions, metrics, timeRange: { start, end } }),
    })
      .then((r) => r.json())
      .then((res) => setData(res.data || []))
      .catch(() => setData([]))
  }, [dimensions, metrics, timeRange])

  const primaryDim = dimensions[0]
  const primaryMetric = metrics[0]

  const toggleDimension = (d: Dimension) => {
    setDimensions((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    )
  }

  const toggleMetric = (m: Metric) => {
    setMetrics((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]
    )
  }

  const metricColors = ['#0D9488', '#F97066', '#F59E0B', '#6366F1']

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-800">多维对比分析</h1>
          <p className="text-sm text-zinc-500 mt-0.5">按维度交叉对比，发现异常差异</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <button
            onClick={() => { setDimDropdownOpen(!dimDropdownOpen); setMetDropdownOpen(false) }}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:border-teal-300 transition-colors"
          >
            维度：{dimensions.map((d) => DIMENSION_OPTIONS.find((o) => o.value === d)?.label).join('、')}
            <ChevronDown size={14} />
          </button>
          {dimDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 z-30 w-44 rounded-lg border border-zinc-200 bg-white shadow-lg py-1">
              {DIMENSION_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={dimensions.includes(opt.value)}
                    onChange={() => toggleDimension(opt.value)}
                    className="rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-zinc-700">{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setMetDropdownOpen(!metDropdownOpen); setDimDropdownOpen(false) }}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 hover:border-teal-300 transition-colors"
          >
            指标：{metrics.map((m) => METRIC_OPTIONS.find((o) => o.value === m)?.label).join('、')}
            <ChevronDown size={14} />
          </button>
          {metDropdownOpen && (
            <div className="absolute left-0 top-full mt-1 z-30 w-44 rounded-lg border border-zinc-200 bg-white shadow-lg py-1">
              {METRIC_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={metrics.includes(opt.value)}
                    onChange={() => toggleMetric(opt.value)}
                    className="rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-zinc-700">{opt.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5">
          {CHART_TYPES.map((ct) => (
            <button
              key={ct}
              onClick={() => setChartType(ct)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                chartType === ct ? 'bg-teal-600 text-white' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {ct === 'bar' ? '柱状图' : '雷达图'}
            </button>
          ))}
        </div>

        {metrics.map((m) => (
          <CaliberTooltip
            key={m}
            metricKey={m}
            metricName={METRIC_OPTIONS.find((o) => o.value === m)?.label || m}
          />
        ))}
      </div>

      <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-700">
            {dimensions.map((d) => DIMENSION_OPTIONS.find((o) => o.value === d)?.label).join(' × ')} 对比
          </h2>
          <button
            onClick={() => {
              if (primaryDim && primaryMetric) {
                const label = `${DIMENSION_OPTIONS.find((o) => o.value === primaryDim)?.label}维度对比`
                openNotesDrawer({ targetKey: `compare:${primaryDim}:${primaryMetric}`, label })
              }
            }}
            className="flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:text-teal-600 hover:border-teal-300 transition-colors"
          >
            <StickyNote size={12} /> 备注
          </button>
        </div>

        {chartType === 'bar' ? (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={data} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
              <XAxis
                dataKey={primaryDim}
                tick={{ fontSize: 10, fill: '#71717A' }}
                tickFormatter={(v: string) => v.length > 4 ? v.substring(0, 4) + '..' : v}
              />
              <YAxis tick={{ fontSize: 10, fill: '#71717A' }} />
              <RechartsTooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: '1px solid #E4E4E7',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {metrics.map((m, i) => (
                <Bar
                  key={m}
                  dataKey={m}
                  fill={metricColors[i % metricColors.length]}
                  radius={[4, 4, 0, 0]}
                  name={METRIC_OPTIONS.find((o) => o.value === m)?.label || m}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart data={data}>
              <PolarGrid stroke="#E4E4E7" />
              <PolarAngleAxis
                dataKey={primaryDim}
                tick={{ fontSize: 10, fill: '#71717A' }}
              />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: '#A1A1AA' }} />
              {metrics.map((m, i) => (
                <Radar
                  key={m}
                  name={METRIC_OPTIONS.find((o) => o.value === m)?.label || m}
                  dataKey={m}
                  stroke={metricColors[i % metricColors.length]}
                  fill={metricColors[i % metricColors.length]}
                  fillOpacity={0.15}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <RechartsTooltip
                contentStyle={{
                  fontSize: 11,
                  borderRadius: 8,
                  border: '1px solid #E4E4E7',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
