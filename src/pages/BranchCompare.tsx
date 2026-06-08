import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'
import { GitCompare, X, Activity } from 'lucide-react'
import { useFilterStore } from '@/store/filterStore'
import { apiPost } from '@/utils/api'
import EmptyState, { SkeletonChart } from '@/components/EmptyState'
import ExportButton from '@/components/ExportButton'
import ChildDataBadge from '@/components/ChildDataBadge'

interface BranchItem {
  id: string
  name: string
  borrowCount: number
  renewalRate: number
  reservationRate: number
  overdueRate: number
  utilizationRate: number
}

interface BranchCompareData {
  branches: BranchItem[]
  monthlyData: { month: string; [branchName: string]: number | string }[]
}

const COLORS = ['#6C5CE7', '#00B894', '#FDCB6E', '#E17055', '#0984E3', '#A29BFE']
const RADAR_KEYS: { key: keyof BranchItem; label: string }[] = [
  { key: 'borrowCount', label: '借阅量' },
  { key: 'renewalRate', label: '续借率' },
  { key: 'reservationRate', label: '预约率' },
  { key: 'overdueRate', label: '逾期率' },
  { key: 'utilizationRate', label: '利用率' },
]

function GaugeIndicator({ label, value, max, unit, color }: { label: string; value: number; max: number; unit: string; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
          {value}{unit}
        </span>
      </div>
      <span className="text-[10px] text-slate-500 text-center leading-tight">{label}</span>
    </div>
  )
}

export default function BranchCompare() {
  const filters = useFilterStore((s) => s.filters)
  const [data, setData] = useState<BranchCompareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [childDataAggregated, setChildDataAggregated] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<BranchItem | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiPost<BranchCompareData>('/api/branch-compare', { filters })
      setData(res.data)
      setChildDataAggregated(res.meta.childDataAggregated)
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据加载失败')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchData() }, [fetchData])

  const radarData = data
    ? RADAR_KEYS.map(({ key, label }) => {
        const point: Record<string, string | number> = { dimension: label }
        data.branches.forEach((b) => {
          point[b.name] = typeof b[key] === 'number' ? b[key] : 0
        })
        return point
      })
    : []

  const handleBarClick = (barData: Record<string, unknown>) => {
    if (!data) return
    const branch = data.branches.find((b) => b.name === barData.name)
    if (branch) setSelectedBranch(branch)
  }

  if (error) {
    return <div className="p-6"><EmptyState type="error" message={error} onRetry={fetchData} /></div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            分馆对比
          </h1>
          <ChildDataBadge show={childDataAggregated} />
        </div>
        <ExportButton targetId="branch-compare-content" />
      </div>

      <div id="branch-compare-content" className="space-y-6">
        {loading ? (
          <div className="space-y-6">
            <SkeletonChart />
            <SkeletonChart />
          </div>
        ) : !data?.branches?.length ? (
          <EmptyState type="empty" />
        ) : (
          <>
            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#6C5CE715]">
                  <GitCompare className="w-4 h-4 text-[#6C5CE7]" />
                </div>
                <span className="text-sm font-semibold text-slate-700">分馆借阅对比</span>
              </div>
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                  {data.branches.map((b, i) => (
                    <Bar
                      key={b.id}
                      dataKey={b.name}
                      fill={COLORS[i % COLORS.length]}
                      radius={[4, 4, 0, 0]}
                      barSize={16}
                      onClick={handleBarClick}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#00B89415]">
                  <Activity className="w-4 h-4 text-[#00B894]" />
                </div>
                <span className="text-sm font-semibold text-slate-700">资源利用率雷达</span>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <PolarRadiusAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  {data.branches.map((b, i) => (
                    <Radar
                      key={b.id}
                      name={b.name}
                      dataKey={b.name}
                      stroke={COLORS[i % COLORS.length]}
                      fill={COLORS[i % COLORS.length]}
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                  ))}
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" iconSize={8} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {selectedBranch && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setSelectedBranch(null)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div
            className="relative w-80 bg-white shadow-xl border-l border-slate-100 p-5 h-full overflow-y-auto animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-800">{selectedBranch.name}</h2>
              <button
                onClick={() => setSelectedBranch(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <GaugeIndicator label="借阅量" value={selectedBranch.borrowCount} max={10000} unit="" color={COLORS[0]} />
              <GaugeIndicator label="续借率" value={selectedBranch.renewalRate} max={100} unit="%" color={COLORS[1]} />
              <GaugeIndicator label="预约率" value={selectedBranch.reservationRate} max={100} unit="%" color={COLORS[2]} />
              <GaugeIndicator label="逾期率" value={selectedBranch.overdueRate} max={100} unit="%" color={COLORS[3]} />
              <GaugeIndicator label="利用率" value={selectedBranch.utilizationRate} max={100} unit="%" color={COLORS[4]} />
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
              {RADAR_KEYS.map(({ key, label }, i) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((key === 'borrowCount'
                            ? (selectedBranch[key] as number) / 10000
                            : (selectedBranch[key] as number) / 100) * 100, 100)}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                    <span className="font-medium text-slate-700 min-w-[48px] text-right">
                      {selectedBranch[key]}{key === 'borrowCount' ? '' : '%'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
