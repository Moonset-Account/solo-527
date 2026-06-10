import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, MapPin, Ruler, Sprout } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

interface Plot {
  id: string
  code: string
  name: string
  area: number
  unit: string
  location: string
  soilType: string
  currentVariety: { id: string; name: string } | null
  status: 'active' | 'fallow' | 'preparing'
}

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '种植中' },
  { value: 'fallow', label: '休耕' },
  { value: 'preparing', label: '备耕' },
]

const soilLabels: Record<string, string> = {
  red: '红壤',
  yellow: '黄壤',
  sandy: '沙壤',
  clay: '黏土',
  other: '其他',
}

function SkeletonCard() {
  return (
    <div className="card p-5 border-l-4 border-l-gray-200">
      <div className="space-y-3">
        <div className="skeleton h-5 w-2/3" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-1/3" />
      </div>
    </div>
  )
}

export default function Plots() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { execute, data, loading } = useApi<Plot[]>()
  const [plots, setPlots] = useState<Plot[]>([])

  const statusFilter = searchParams.get('status') || ''
  const searchQuery = searchParams.get('search') || ''

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    execute(`/api/plots?${params.toString()}`).catch(() => {})
  }, [statusFilter])

  useEffect(() => {
    if (data) setPlots(data)
  }, [data])

  const filtered = plots.filter((p) =>
    p.name.includes(searchQuery) || p.code.includes(searchQuery)
  )

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    setSearchParams(params)
  }

  return (
    <div>
      <PageHeader
        title="地块管理"
        subtitle="管理果园地块信息"
        action={
          <button onClick={() => navigate('/plots/new')} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新增地块
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索地块名称/编码..."
            value={searchQuery}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="input-field w-auto"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">暂无地块数据</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((plot) => (
            <div
              key={plot.id}
              onClick={() => navigate(`/plots/${plot.id}`)}
              className={cn(
                'card p-5 border-l-4 border-l-primary-700 cursor-pointer',
                'hover:shadow-md transition-shadow'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{plot.name}</h3>
                  <span className="text-xs text-gray-400">{plot.code}</span>
                </div>
                <StatusBadge status={plot.status} type="plot" />
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-gray-400" />
                  <span>{plot.area} {plot.unit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{plot.location || '未设置'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sprout className="h-4 w-4 text-gray-400" />
                  <span>{plot.currentVariety?.name || '未种植'}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-400">土壤: {soilLabels[plot.soilType] || plot.soilType}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
