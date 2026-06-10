import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Edit2, Trash2, Sprout, Clock,
  ShieldCheck, CalendarDays, Scissors,
} from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import ConfirmDialog from '@/components/ConfirmDialog'
import { cn } from '@/lib/utils'

interface Variety {
  id: string
  code: string
  name: string
  category: string
  growthCycle: number
  harvestStandard: string
  shelfLife: number
  status: 'active' | 'inactive'
}

interface Harvest {
  id: string
  date: string
  plotName: string
  amount: number
  unit: string
  status: string
}

const categoryLabels: Record<string, string> = {
  citrus: '柑橘',
  apple: '苹果',
  pear: '梨',
  peach: '桃',
  grape: '葡萄',
  other: '其他',
}

export default function VarietyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { execute: fetchVariety, data: varietyData, loading: varietyLoading } = useApi<Variety>()
  const { execute: fetchHarvests, data: harvestsData } = useApi<Harvest[]>()
  const { execute: deleteVariety } = useApi()

  const [variety, setVariety] = useState<Variety | null>(null)
  const [harvests, setHarvests] = useState<Harvest[]>([])

  useEffect(() => {
    if (id) {
      fetchVariety(`/api/varieties/${id}`).catch(() => {})
      fetchHarvests(`/api/harvests?varietyId=${id}`).catch(() => {})
    }
  }, [id])

  useEffect(() => {
    if (varietyData) setVariety(varietyData)
  }, [varietyData])

  useEffect(() => {
    if (harvestsData) setHarvests(harvestsData)
  }, [harvestsData])

  const handleDelete = async () => {
    const result = await deleteVariety(`/api/varieties/${id}`, { method: 'DELETE' })
    if (result !== null) navigate('/varieties')
  }

  if (varietyLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48" />
        <div className="card p-6"><div className="skeleton h-40" /></div>
      </div>
    )
  }

  if (!variety) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>品种信息未找到</p>
        <button onClick={() => navigate('/varieties')} className="btn-outline mt-4">返回列表</button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={variety.name}
        subtitle={variety.code}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/varieties')} className="btn-outline flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回
            </button>
            <button onClick={() => navigate(`/varieties/${id}?edit=true`)} className="btn-primary flex items-center gap-2">
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
              <Sprout className="h-6 w-6 text-primary-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{variety.name}</h3>
              <span className="text-xs text-gray-400 font-mono">{variety.code}</span>
            </div>
          </div>
          <StatusBadge status={variety.status} type="variety" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4 text-gray-400" />
            <span>{categoryLabels[variety.category] || variety.category}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>种植周期 {variety.growthCycle} 天</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ShieldCheck className="h-4 w-4 text-gray-400" />
            <span>保质期 {variety.shelfLife} 天</span>
          </div>
        </div>

        {variety.harvestStandard && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400 mb-1">采收标准</p>
            <p className="text-sm text-gray-600">{variety.harvestStandard}</p>
          </div>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">采收记录</h3>
        <span className="text-sm text-gray-400">共 {harvests.length} 条</span>
      </div>

      {harvests.length === 0 ? (
        <div className="card p-8 text-center text-gray-400">暂无采收记录</div>
      ) : (
        <div className="space-y-3">
          {harvests.map((h) => (
            <div key={h.id} className="card p-4 flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center">
                <Scissors className="h-5 w-5 text-accent-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{h.plotName}</span>
                  <StatusBadge status={h.status} type="harvest" />
                </div>
                <p className="text-xs text-gray-400">{h.date} · 采收 {h.amount}{h.unit}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="删除品种"
        message={`确定要删除品种「${variety.name}」吗？此操作不可撤销。`}
        confirmText="删除"
        variant="danger"
      />
    </div>
  )
}
