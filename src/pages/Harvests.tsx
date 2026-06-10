import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Scissors, Eye, QrCode } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import { cn } from '@/lib/utils'

const gradeConfig: Record<string, { label: string; color: string }> = {
  premium: { label: '特级', color: 'bg-accent-100 text-accent-700 border-accent-200' },
  first: { label: '一级', color: 'bg-primary-100 text-primary-700 border-primary-200' },
  second: { label: '二级', color: 'bg-moss-light text-moss-dark border-moss' },
  third: { label: '三级', color: 'bg-earth-light/30 text-earth-dark border-earth-light' },
}

const gradeOptions = [
  { value: '', label: '全部等级' },
  { value: 'premium', label: '特级' },
  { value: 'first', label: '一级' },
  { value: 'second', label: '二级' },
  { value: 'third', label: '三级' },
]

interface Harvest {
  id: string
  batchNo: string
  plotId: string
  plotName: string
  varietyId: string
  varietyName: string
  quantity: number
  unit: string
  qualityGrade: string
  harvestDate: string
  harvester: string
  [key: string]: unknown
}

interface Option {
  id: string
  name: string
}

export default function Harvests() {
  const navigate = useNavigate()
  const { execute, loading } = useApi<Harvest[]>()
  const [harvests, setHarvests] = useState<Harvest[]>([])
  const [plots, setPlots] = useState<Option[]>([])
  const [varieties, setVarieties] = useState<Option[]>([])
  const [filters, setFilters] = useState({
    plotId: '',
    varietyId: '',
    qualityGrade: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetch('/api/plots')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setPlots(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => {})
    fetch('/api/varieties')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setVarieties(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    execute(`/api/harvests?${params.toString()}`).then((d) => {
      if (d) setHarvests(Array.isArray(d) ? d : ((d as Record<string, unknown>).data as Harvest[]) ?? [])
    })
  }, [filters])

  return (
    <div>
      <PageHeader
        title="采收记录"
        action={
          <button onClick={() => navigate('/harvests/new')} className="btn-primary flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            新增采收
          </button>
        }
      />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <select
            value={filters.plotId}
            onChange={(e) => setFilters({ ...filters, plotId: e.target.value })}
            className="input-field text-sm"
          >
            <option value="">全部地块</option>
            {plots.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={filters.varietyId}
            onChange={(e) => setFilters({ ...filters, varietyId: e.target.value })}
            className="input-field text-sm"
          >
            <option value="">全部品种</option>
            {varieties.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <select
            value={filters.qualityGrade}
            onChange={(e) => setFilters({ ...filters, qualityGrade: e.target.value })}
            className="input-field text-sm"
          >
            {gradeOptions.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="input-field text-sm"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="input-field text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-5 w-32" />
              <div className="skeleton h-4 w-48" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      ) : harvests.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">暂无采收记录</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {harvests.map((h) => {
            const grade = gradeConfig[h.qualityGrade] || gradeConfig.third
            return (
              <div key={h.id} className="card-hover p-5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-mono text-gray-500">{h.batchNo}</span>
                  <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border', grade.color)}>
                    {grade.label}
                  </span>
                </div>

                <div className="flex-1 space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">地块</span>
                    <span className="text-gray-800">{h.plotName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">品种</span>
                    <span className="text-gray-800">{h.varietyName}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">采收量</span>
                    <span className="text-gray-800 font-medium">{h.quantity} {h.unit}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">采收日期</span>
                    <span className="text-gray-800">{h.harvestDate?.slice(0, 10)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">采收人</span>
                    <span className="text-gray-800">{h.harvester}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => navigate(`/harvests/${h.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    查看详情
                  </button>
                  <button
                    onClick={() => navigate(`/traceability/${h.batchNo}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                  >
                    <QrCode className="h-4 w-4" />
                    查看溯源
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
