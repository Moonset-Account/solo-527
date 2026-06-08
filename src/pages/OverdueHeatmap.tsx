import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertTriangle, Lock, Users } from 'lucide-react'
import { useFilterStore } from '@/store/filterStore'
import { apiPost } from '@/utils/api'
import EmptyState, { SkeletonChart } from '@/components/EmptyState'
import ExportButton from '@/components/ExportButton'
import ChildDataBadge from '@/components/ChildDataBadge'

interface MatrixCell {
  theme: string
  ageGroup: string
  rate: number
  count: number
}

interface ReaderProfile {
  ageGroup: string
  count: number
  avgBorrowFreq: number
  isChildAggregated: boolean
}

interface ThemeClusterItem {
  theme: string
  overdueCount: number
  overdueRate: number
}

interface OverdueHeatmapData {
  matrix: MatrixCell[]
  readerProfile: ReaderProfile[]
  themeCluster: ThemeClusterItem[]
}

const AGE_GROUPS = ['少儿', '青年', '中年', '老年']

function getHeatColor(rate: number): string {
  const clamp = Math.max(0, Math.min(1, rate / 100))
  if (clamp <= 0.5) {
    const t = clamp * 2
    const r = Math.round(0x00 + (0xFD - 0x00) * t)
    const g = Math.round(0xB8 + (0xCB - 0xB8) * t)
    const b = Math.round(0x94 + (0x6E - 0x94) * t)
    return `rgb(${r},${g},${b})`
  }
  const t = (clamp - 0.5) * 2
  const r = Math.round(0xFD + (0xFF - 0xFD) * t)
  const g = Math.round(0xCB + (0x6B - 0xCB) * t)
  const b = Math.round(0x6E + (0x6B - 0x6E) * t)
  return `rgb(${r},${g},${b})`
}

function textColorFor(rate: number): string {
  return rate > 60 ? 'text-white' : 'text-slate-700'
}

export default function OverdueHeatmap() {
  const filters = useFilterStore((s) => s.filters)
  const [data, setData] = useState<OverdueHeatmapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [childDataAggregated, setChildDataAggregated] = useState(false)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; cell: MatrixCell } | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiPost<OverdueHeatmapData>('/api/overdue-heatmap', { filters })
      setData(res.data)
      setChildDataAggregated(res.meta.childDataAggregated)
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchData() }, [fetchData])

  const themes = data ? [...new Set(data.matrix.map((c) => c.theme))] : []
  const cellMap = new Map<string, MatrixCell>()
  data?.matrix.forEach((c) => cellMap.set(`${c.theme}-${c.ageGroup}`, c))

  if (error) {
    return <div className="p-6"><EmptyState type="error" message={error} onRetry={fetchData} /></div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            逾期热区
          </h1>
          <ChildDataBadge show={childDataAggregated} />
        </div>
        <ExportButton targetId="overdue-heatmap-content" />
      </div>

      <div id="overdue-heatmap-content" className="space-y-6">
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
            {/* Heatmap */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#FF6B6B15]">
                  <AlertTriangle className="w-4 h-4 text-[#FF6B6B]" />
                </div>
                <span className="text-sm font-semibold text-slate-700">逾期率热力矩阵</span>
              </div>

              <div className="relative overflow-x-auto">
                <table className="border-collapse">
                  <thead>
                    <tr>
                      <th className="w-24" />
                      {AGE_GROUPS.map((ag) => (
                        <th key={ag} className="px-4 py-2 text-xs font-semibold text-slate-500 text-center min-w-[80px]">
                          {ag}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {themes.map((theme) => (
                      <tr key={theme}>
                        <td className="pr-3 py-1 text-xs text-slate-600 font-medium text-right whitespace-nowrap">
                          {theme}
                        </td>
                        {AGE_GROUPS.map((ag) => {
                          const cell = cellMap.get(`${theme}-${ag}`)
                          if (!cell) return <td key={ag} className="p-1" />
                          const bg = getHeatColor(cell.rate)
                          const isChild = ag === '少儿'
                          return (
                            <td
                              key={ag}
                              className="p-1 relative"
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                setTooltip({ x: rect.left + rect.width / 2, y: rect.top, cell })
                              }}
                              onMouseLeave={() => setTooltip(null)}
                            >
                              <div
                                className={`rounded-md h-12 flex items-center justify-center text-xs font-bold transition-transform hover:scale-105 ${textColorFor(cell.rate)} ${isChild ? 'ring-1 ring-blue-300 ring-offset-1' : ''}`}
                                style={{ backgroundColor: bg }}
                              >
                                {cell.rate.toFixed(1)}%
                                {isChild && (
                                  <Lock className="w-3 h-3 ml-1 opacity-60" />
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Color Legend */}
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-[10px] text-slate-400">低</span>
                  <div className="flex h-2.5 rounded-full overflow-hidden w-40">
                    {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((t) => (
                      <div key={t} className="flex-1" style={{ backgroundColor: getHeatColor(t * 100) }} />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400">高</span>
                </div>
              </div>
            </div>

            {/* Reader Profile */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#6C5CE715]">
                  <Users className="w-4 h-4 text-[#6C5CE7]" />
                </div>
                <span className="text-sm font-semibold text-slate-700">逾期读者画像</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.readerProfile.map((p) => {
                  const isChild = p.isChildAggregated
                  return (
                    <div
                      key={p.ageGroup}
                      className={`rounded-lg p-4 border transition-colors ${
                        isChild
                          ? 'bg-slate-50 border-slate-200 opacity-70'
                          : 'bg-gradient-to-br from-white to-slate-50/50 border-slate-100'
                      }`}
                    >
                      {isChild ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 py-2">
                          <Lock className="w-5 h-5 text-slate-400" />
                          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                            为保护隐私，少儿读者数据仅聚合展示
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-slate-500 mb-1">{p.ageGroup}</p>
                          <p className="text-lg font-bold text-slate-800">{p.count.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            平均借阅频率 {p.avgBorrowFreq.toFixed(1)} 次/月
                          </p>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Theme Cluster */}
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#FDCB6E20]">
                  <AlertTriangle className="w-4 h-4 text-[#E17055]" />
                </div>
                <span className="text-sm font-semibold text-slate-700">逾期主题聚类</span>
              </div>
              <div className="relative h-64">
                {data.themeCluster.map((item, i) => {
                  const size = Math.max(32, Math.min(80, item.overdueCount / 10))
                  const cols = Math.max(2, Math.floor(Math.sqrt(data.themeCluster.length)))
                  const row = Math.floor(i / cols)
                  const col = i % cols
                  const cellW = 100 / cols
                  const left = col * cellW + cellW / 2
                  const top = (row + 0.5) * (100 / Math.ceil(data.themeCluster.length / cols))
                  const intensity = Math.min(1, item.overdueRate / 80)
                  const r = Math.round(0 + 255 * intensity)
                  const g = Math.round(184 - 79 * intensity)
                  const b = Math.round(148 - 43 * intensity)
                  return (
                    <div
                      key={item.theme}
                      className="absolute flex flex-col items-center justify-center rounded-full transition-transform hover:scale-110 cursor-default group"
                      style={{
                        width: size,
                        height: size,
                        left: `${left}%`,
                        top: `${top}%`,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: `rgba(${r},${g},${b},0.25)`,
                        border: `2px solid rgba(${r},${g},${b},0.6)`,
                      }}
                    >
                      <span className="text-[10px] font-bold text-slate-700 leading-none">{item.overdueRate.toFixed(0)}%</span>
                      <span className="text-[8px] text-slate-400 leading-none mt-0.5 max-w-[90%] truncate text-center">{item.theme}</span>
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {item.theme} · 逾期{item.overdueCount}册 · {item.overdueRate}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-50 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y - 8, transform: 'translate(-50%, -100%)' }}
        >
          <p className="font-semibold">{tooltip.cell.theme} · {tooltip.cell.ageGroup}</p>
          <p>逾期率: {tooltip.cell.rate.toFixed(1)}%</p>
          <p>逾期数量: {tooltip.cell.count}</p>
        </div>
      )}
    </div>
  )
}
