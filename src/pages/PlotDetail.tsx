import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Edit2, Trash2, MapPin, Ruler, Sprout,
  Droplets, ClipboardList, Scissors, Bug, Flower2,
  TreePine, Sun, CloudRain, Shovel,
} from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import ConfirmDialog from '@/components/ConfirmDialog'
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
  remark: string
}

interface FarmRecord {
  id: string
  date: string
  type: string
  description: string
  status: string
}

interface Harvest {
  id: string
  date: string
  description: string
  amount: number
  unit: string
  status: string
}

interface TimelineItem {
  id: string
  date: string
  type: 'farm-record' | 'harvest'
  recordType?: string
  description: string
  status: string
}

const soilLabels: Record<string, string> = {
  red: '红壤', yellow: '黄壤', sandy: '沙壤', clay: '黏土', other: '其他',
}

const recordTypeIcons: Record<string, React.ElementType> = {
  planting: Sprout,
  fertilization: Droplets,
  pruning: Scissors,
  pest_control: Bug,
  flowering: Flower2,
  fruiting: TreePine,
  irrigation: CloudRain,
  weeding: Shovel,
  other: ClipboardList,
}

function TimelineCard({ item }: { item: TimelineItem }) {
  const isFarmRecord = item.type === 'farm-record'
  const Icon = isFarmRecord ? (recordTypeIcons[item.recordType || 'other'] || ClipboardList) : Scissors

  return (
    <div className="card p-4 flex items-start gap-3">
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
        isFarmRecord ? 'bg-primary-50 text-primary-700' : 'bg-accent-50 text-accent-600'
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-400">
            {isFarmRecord ? '农事记录' : '采收记录'}
          </span>
          <StatusBadge status={item.status} type={isFarmRecord ? 'farm-record' : 'harvest'} />
        </div>
        <p className="text-sm text-gray-700">{item.description}</p>
      </div>
    </div>
  )
}

export default function PlotDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { execute: fetchPlot, data: plotData, loading: plotLoading } = useApi<Plot>()
  const { execute: fetchRecords, data: recordsData } = useApi<FarmRecord[]>()
  const { execute: fetchHarvests, data: harvestsData } = useApi<Harvest[]>()
  const { execute: deletePlot } = useApi()

  const [plot, setPlot] = useState<Plot | null>(null)
  const [timeline, setTimeline] = useState<TimelineItem[]>([])

  useEffect(() => {
    if (id) {
      fetchPlot(`/api/plots/${id}`).catch(() => {})
      fetchRecords(`/api/farm-records?plotId=${id}`).catch(() => {})
      fetchHarvests(`/api/harvests?plotId=${id}`).catch(() => {})
    }
  }, [id])

  useEffect(() => {
    if (plotData) setPlot(plotData)
  }, [plotData])

  useEffect(() => {
    const items: TimelineItem[] = []

    if (recordsData) {
      items.push(...recordsData.map((r) => ({
        id: r.id,
        date: r.date,
        type: 'farm-record' as const,
        recordType: r.type,
        description: r.description,
        status: r.status,
      })))
    }

    if (harvestsData) {
      items.push(...harvestsData.map((h) => ({
        id: h.id,
        date: h.date,
        type: 'harvest' as const,
        description: `${h.description} — 采收 ${h.amount}${h.unit}`,
        status: h.status,
      })))
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    setTimeline(items)
  }, [recordsData, harvestsData])

  const handleDelete = async () => {
    const result = await deletePlot(`/api/plots/${id}`, { method: 'DELETE' })
    if (result !== null) navigate('/plots')
  }

  if (plotLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="card p-6"><div className="skeleton h-40" /></div>
      </div>
    )
  }

  if (!plot) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>地块信息未找到</p>
        <button onClick={() => navigate('/plots')} className="btn-outline mt-4">返回列表</button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={plot.name}
        subtitle={plot.code}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/plots')} className="btn-outline flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回
            </button>
            <button onClick={() => navigate(`/plots/${id}?edit=true`)} className="btn-primary flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              编辑
            </button>
            <button onClick={() => setDeleteOpen(true)} className="btn-danger flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              删除
            </button>
          </div>
        }
      />

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">地块信息</h3>
          <StatusBadge status={plot.status} type="plot" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Ruler className="h-4 w-4 text-gray-400" />
            <span>{plot.area} {plot.unit}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{plot.location || '未设置'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Sun className="h-4 w-4 text-gray-400" />
            <span>土壤: {soilLabels[plot.soilType] || plot.soilType}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Sprout className="h-4 w-4 text-gray-400" />
            <span>{plot.currentVariety?.name || '未种植'}</span>
          </div>
        </div>
        {plot.remark && (
          <div className="mt-4 pt-4 border-t border-gray-50 text-sm text-gray-500">{plot.remark}</div>
        )}
      </div>

      {plot.currentVariety && (
        <div className="card p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">当前品种</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Sprout className="h-5 w-5 text-primary-700" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{plot.currentVariety.name}</p>
              <p className="text-xs text-gray-400">点击查看品种详情</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-2">
        <h3 className="text-lg font-semibold text-gray-900">活动记录</h3>
      </div>

      {timeline.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">暂无活动记录</div>
      ) : (
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200" />
          <div className="space-y-4">
            {timeline.map((item) => (
              <div key={item.id} className="relative flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-primary-200 flex items-center justify-center z-10">
                  <div className={cn(
                    'w-3 h-3 rounded-full',
                    item.type === 'farm-record' ? 'bg-primary-500' : 'bg-accent-500'
                  )} />
                </div>
                <div className="flex-1 pb-2 min-w-0">
                  <div className="text-xs text-gray-400 mb-1.5">{item.date}</div>
                  <TimelineCard item={item} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="删除地块"
        message={`确定要删除地块「${plot.name}」吗？此操作不可撤销。`}
        confirmText="删除"
        variant="danger"
      />
    </div>
  )
}
