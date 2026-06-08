import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FileText, AlertTriangle, Calendar, Download, RefreshCw, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import { useFilterStore } from '@/store/filterStore'
import { apiPost, apiGet } from '@/utils/api'
import EmptyState, { SkeletonCard } from '@/components/EmptyState'
import ExportButton from '@/components/ExportButton'
import ChildDataBadge from '@/components/ChildDataBadge'

interface ComparisonItem { metric: string; current: number; previous: number; change: number }
interface AnomalyItem { type: string; description: string; severity: 'high' | 'medium' | 'low' }
interface WeeklyReportData {
  reportId: string; weekStart: string; weekEnd: string
  keyChanges: string[]
  yoyComparison: ComparisonItem[]
  momComparison: ComparisonItem[]
  anomalies: AnomalyItem[]
  filterSnapshot: { collectionTypes: string[]; readerGroups: string[]; themes: string[]; branches: string[]; dateRange: { start: string; end: string } }
  generatedAt: string
}

const METRIC_LABELS: Record<string, string> = { borrowCount: '借阅量', renewalCount: '续借量', overdueCount: '逾期量' }
const SEVERITY_COLORS: Record<string, string> = { high: '#FF6B6B', medium: '#FDCB6E', low: '#00B894' }
const SEVERITY_BG: Record<string, string> = { high: 'bg-[#FF6B6B15]', medium: 'bg-[#FDCB6E15]', low: 'bg-[#00B89415]' }

function ChangeCell({ change }: { change: number }) {
  const positive = change >= 0
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium" style={{ color: positive ? '#00B894' : '#FF6B6B' }}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {positive ? '+' : ''}{change}%
    </span>
  )
}

function ComparisonTable({ title, data, iconBg, icon }: { title: string; data: ComparisonItem[]; iconBg: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>{icon}</div>
        <span className="text-sm font-semibold text-slate-700">{title}</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left py-2 px-3 text-xs font-medium text-slate-500">指标</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">当期</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">对比期</th>
            <th className="text-right py-2 px-3 text-xs font-medium text-slate-500">变化</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.metric} className="border-b border-slate-50">
              <td className="py-2.5 px-3 font-medium text-slate-700">{METRIC_LABELS[row.metric] || row.metric}</td>
              <td className="py-2.5 px-3 text-right text-slate-600">{row.current.toLocaleString()}</td>
              <td className="py-2.5 px-3 text-right text-slate-400">{row.previous.toLocaleString()}</td>
              <td className="py-2.5 px-3 text-right"><ChangeCell change={row.change} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function WeeklyReports() {
  const filters = useFilterStore((s) => s.filters)
  const [reports, setReports] = useState<WeeklyReportData[]>([])
  const [selected, setSelected] = useState<WeeklyReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [childDataAggregated, setChildDataAggregated] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiGet<WeeklyReportData[]>('/api/weekly-reports')
      setReports(res.data)
      setChildDataAggregated((res.meta as Record<string, unknown>)?.childDataAggregated as boolean ?? false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchList() }, [fetchList])

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await apiGet<WeeklyReportData>(`/api/weekly-reports/${id}`)
      setSelected(res.data)
    } catch {
      setSelected(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    try {
      const res = await apiPost<WeeklyReportData>('/api/weekly-reports/generate', { filters })
      setReports((prev) => [res.data, ...prev])
      setSelected(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
    } finally {
      setGenerating(false)
    }
  }, [filters])

  const hasHighSeverity = (a: AnomalyItem[]) => a.some((x) => x.severity === 'high')
  const chartData = selected?.yoyComparison.map((c) => ({ metric: METRIC_LABELS[c.metric] || c.metric, 当期: c.current, 同期: c.previous })) ?? []

  if (error && !reports.length) {
    return <div className="p-6"><EmptyState type="error" message={error} onRetry={fetchList} /></div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>周报中心</h1>
          <ChildDataBadge show={childDataAggregated} />
        </div>
        <div className="flex items-center gap-2">
          <ExportButton targetId="weekly-reports-content" />
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#6C5CE7] text-white text-xs font-medium hover:bg-[#5A4BD1] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? '生成中...' : '生成本周报告'}
          </button>
        </div>
      </div>

      <div id="weekly-reports-content" className="flex gap-6">
        <div className={`space-y-3 ${selected ? 'w-1/3' : 'w-full'}`}>
          {loading ? (
            <div className="grid gap-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
          ) : !reports.length ? (
            <EmptyState type="empty" message="暂无周报数据" />
          ) : (
            reports.map((r) => {
              const highSev = hasHighSeverity(r.anomalies)
              return (
                <div
                  key={r.reportId}
                  onClick={() => fetchDetail(r.reportId)}
                  className={`rounded-xl bg-white p-4 shadow-sm border cursor-pointer transition-all hover:shadow-md ${selected?.reportId === r.reportId ? 'border-[#6C5CE7] ring-1 ring-[#6C5CE720]' : 'border-slate-100'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#6C5CE7]" />
                      <span className="text-sm font-semibold text-slate-700">{r.weekStart} ~ {r.weekEnd}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      异常 {r.anomalies.length}
                      {highSev && <span className="ml-0.5 px-1.5 py-0.5 rounded bg-[#FF6B6B15] text-[#FF6B6B] font-medium">高风险</span>}
                    </span>
                    <span>{r.generatedAt.slice(0, 10)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.filterSnapshot.branches.slice(0, 2).map((b) => (
                      <span key={b} className="px-1.5 py-0.5 rounded bg-slate-50 text-[10px] text-slate-500">{b}</span>
                    ))}
                    {r.filterSnapshot.themes.slice(0, 2).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 rounded bg-slate-50 text-[10px] text-slate-500">{t}</span>
                    ))}
                    {(r.filterSnapshot.branches.length + r.filterSnapshot.themes.length > 4) && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-50 text-[10px] text-slate-400">+{r.filterSnapshot.branches.length + r.filterSnapshot.themes.length - 4}</span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {selected && (
          <div className="w-2/3 space-y-4">
            {detailLoading ? (
              <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}</div>
            ) : (
              <>
                <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#6C5CE715]">
                      <FileText className="w-4 h-4 text-[#6C5CE7]" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">关键变化</span>
                  </div>
                  <ul className="space-y-1.5">
                    {selected.keyChanges.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#6C5CE7] shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                <ComparisonTable
                  title="同比对比"
                  data={selected.yoyComparison}
                  iconBg="bg-[#00B89415]"
                  icon={<TrendingUp className="w-4 h-4 text-[#00B894]" />}
                />
                <ComparisonTable
                  title="环比对比"
                  data={selected.momComparison}
                  iconBg="bg-[#FDCB6E15]"
                  icon={<TrendingDown className="w-4 h-4 text-[#E17055]" />}
                />

                <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#FF6B6B15]">
                      <AlertTriangle className="w-4 h-4 text-[#FF6B6B]" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">异常检测</span>
                  </div>
                  <div className="space-y-2">
                    {selected.anomalies.map((a, i) => (
                      <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg ${SEVERITY_BG[a.severity]}`}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SEVERITY_COLORS[a.severity] }} />
                        <span className="text-sm text-slate-700 flex-1">{a.description}</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: SEVERITY_COLORS[a.severity], backgroundColor: `${SEVERITY_COLORS[a.severity]}15` }}>
                          {a.severity === 'high' ? '高' : a.severity === 'medium' ? '中' : '低'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-5 border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Download className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-500">筛选条件快照</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                    <div>馆藏类型: {selected.filterSnapshot.collectionTypes.join(', ') || '全部'}</div>
                    <div>读者群: {selected.filterSnapshot.readerGroups.join(', ') || '全部'}</div>
                    <div>主题: {selected.filterSnapshot.themes.join(', ') || '全部'}</div>
                    <div>分馆: {selected.filterSnapshot.branches.join(', ') || '全部'}</div>
                    <div className="col-span-2">日期: {selected.filterSnapshot.dateRange.start} ~ {selected.filterSnapshot.dateRange.end}</div>
                  </div>
                </div>

                {chartData.length > 0 && (
                  <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#6C5CE715]">
                        <TrendingUp className="w-4 h-4 text-[#6C5CE7]" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">同比指标对比图</span>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }} />
                        <Bar dataKey="当期" fill="#6C5CE7" radius={[4, 4, 0, 0]} barSize={24} />
                        <Bar dataKey="同期" fill="#B8B0F7" radius={[4, 4, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
