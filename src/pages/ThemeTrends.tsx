import { useState, useEffect, useCallback, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { ArrowUp, ArrowDown, Minus, ChevronRight, TrendingUp } from 'lucide-react'
import { useFilterStore } from '@/store/filterStore'
import { apiPost } from '@/utils/api'
import EmptyState, { SkeletonChart } from '@/components/EmptyState'
import ExportButton from '@/components/ExportButton'
import ChildDataBadge from '@/components/ChildDataBadge'

interface ThemeTrendData {
  themes: { name: string; data: { month: string; count: number; yoyChange: number }[] }[]
  rankings: { theme: string; currentRank: number; previousRank: number; change: number }[]
  subThemes: { theme: string; subs: { name: string; count: number }[] }[]
}

const THEME_COLORS = ['#6C5CE7', '#00B894', '#FDCB6E', '#E17055', '#0984E3', '#A29BFE']

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; payload: { yoyChange: number } }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-100 p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.name ? THEME_COLORS[payload.indexOf(entry) % THEME_COLORS.length] : '#6C5CE7' }} />
            <span className="text-slate-600">{entry.name}</span>
          </span>
          <span className="font-medium text-slate-800">
            {entry.value.toLocaleString()}
            <span className={`ml-1 ${entry.payload.yoyChange >= 0 ? 'text-[#00B894]' : 'text-[#FF6B6B]'}`}>
              {entry.payload.yoyChange >= 0 ? '+' : ''}{entry.payload.yoyChange}%
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}

function RankChangeArrow({ change }: { change: number }) {
  if (change > 0) return <ArrowUp className="w-3.5 h-3.5 text-[#00B894]" />
  if (change < 0) return <ArrowDown className="w-3.5 h-3.5 text-[#FF6B6B]" />
  return <Minus className="w-3.5 h-3.5 text-slate-400" />
}

export default function ThemeTrends() {
  const filters = useFilterStore((s) => s.filters)
  const [data, setData] = useState<ThemeTrendData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [childDataAggregated, setChildDataAggregated] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const drillDownRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiPost<ThemeTrendData>('/api/theme-trends', { filters })
      setData(res.data)
      setChildDataAggregated(res.meta.childDataAggregated)
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchData() }, [fetchData])

  const handleThemeClick = (theme: string) => {
    setSelectedTheme(theme)
    setTimeout(() => drillDownRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const mergedChartData = (() => {
    if (!data?.themes?.length) return []
    const months = data.themes[0].data.map((d) => d.month)
    return months.map((month, mi) => {
      const point: Record<string, string | number> = { month }
      data.themes.forEach((t) => {
        point[t.name] = t.data[mi].count
        point[`${t.name}_yoy`] = t.data[mi].yoyChange
      })
      return point
    })
  })()

  const subThemeData = data?.subThemes?.find((s) => s.theme === selectedTheme)

  if (error) {
    return <div className="p-6"><EmptyState type="error" message={error} onRetry={fetchData} /></div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            主题趋势分析
          </h1>
          <ChildDataBadge show={childDataAggregated} />
        </div>
        <ExportButton targetId="theme-trends-content" />
      </div>

      <div id="theme-trends-content" className="space-y-6">
        {loading ? (
          <div className="space-y-6">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        ) : !data ? (
          <EmptyState type="empty" />
        ) : (
          <>
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#6C5CE715]">
                  <TrendingUp className="w-4 h-4 text-[#6C5CE7]" />
                </div>
                <span className="text-sm font-semibold text-slate-700">主题时间序列</span>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={mergedChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  {data.themes.map((t, i) => (
                    <Line
                      key={t.name}
                      type="monotone"
                      dataKey={t.name}
                      stroke={THEME_COLORS[i % THEME_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: THEME_COLORS[i % THEME_COLORS.length] }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#00B89415]">
                  <ArrowUp className="w-4 h-4 text-[#00B894]" />
                </div>
                <span className="text-sm font-semibold text-slate-700">主题排名变动</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">排名</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">主题</th>
                      <th className="text-center py-2 px-3 text-xs font-medium text-slate-500">当前排名</th>
                      <th className="text-center py-2 px-3 text-xs font-medium text-slate-500">上期排名</th>
                      <th className="text-center py-2 px-3 text-xs font-medium text-slate-500">变动</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rankings.map((r) => (
                      <tr
                        key={r.theme}
                        className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => handleThemeClick(r.theme)}
                      >
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                            {r.currentRank}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-700">{r.theme}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600">{r.currentRank}</td>
                        <td className="py-2.5 px-3 text-center text-slate-400">{r.previousRank}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center gap-0.5">
                            <RankChangeArrow change={r.change} />
                            <span className={`text-xs font-medium ${r.change > 0 ? 'text-[#00B894]' : r.change < 0 ? 'text-[#FF6B6B]' : 'text-slate-400'}`}>
                              {r.change !== 0 ? Math.abs(r.change) : '-'}
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div ref={drillDownRef} className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#FDCB6E15]">
                  <ChevronRight className="w-4 h-4 text-[#E17055]" />
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <span>子主题下钻</span>
                  {selectedTheme && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[#6C5CE7]">{selectedTheme}</span>
                    </>
                  )}
                </div>
              </div>

              {!selectedTheme ? (
                <div className="text-sm text-slate-400 py-8 text-center">
                  点击上方排名表中的主题，查看子主题分布
                </div>
              ) : !subThemeData?.subs?.length ? (
                <EmptyState type="empty" message="该主题暂无子主题数据" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={subThemeData.subs} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    />
                    <Bar dataKey="count" fill="#6C5CE7" radius={[0, 4, 4, 0]} barSize={20} name="数量" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
