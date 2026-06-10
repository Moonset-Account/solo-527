import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
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
  [key: string]: unknown
}

const categoryLabels: Record<string, string> = {
  citrus: '柑橘',
  apple: '苹果',
  pear: '梨',
  peach: '桃',
  grape: '葡萄',
  other: '其他',
}

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' },
]

export default function Varieties() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { execute: fetchVarieties, data, loading } = useApi<Variety[]>()
  const { execute: deleteVariety } = useApi()
  const [varieties, setVarieties] = useState<Variety[]>([])
  const [deleteTarget, setDeleteTarget] = useState<Variety | null>(null)

  const statusFilter = searchParams.get('status') || ''

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    fetchVarieties(`/api/varieties?${params.toString()}`).catch(() => {})
  }, [statusFilter])

  useEffect(() => {
    if (data) setVarieties(data)
  }, [data])

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    setSearchParams(params)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const result = await deleteVariety(`/api/varieties/${deleteTarget.id}`, { method: 'DELETE' })
    if (result !== null) {
      setVarieties((prev) => prev.filter((v) => v.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }

  const columns = [
    {
      key: 'code',
      label: '编码',
      render: (row: Variety) => (
        <span className="font-mono text-xs text-gray-500">{row.code}</span>
      ),
    },
    {
      key: 'name',
      label: '名称',
      render: (row: Variety) => (
        <button
          onClick={() => navigate(`/varieties/${row.id}`)}
          className="text-primary-700 hover:text-primary-800 font-medium"
        >
          {row.name}
        </button>
      ),
    },
    {
      key: 'category',
      label: '分类',
      render: (row: Variety) => categoryLabels[row.category] || row.category,
    },
    {
      key: 'growthCycle',
      label: '种植周期(天)',
      render: (row: Variety) => (
        <span className="text-gray-600">{row.growthCycle}</span>
      ),
    },
    {
      key: 'harvestStandard',
      label: '采收标准',
      render: (row: Variety) => (
        <span className={cn('text-sm', !row.harvestStandard && 'text-gray-300')}>
          {row.harvestStandard || '未设置'}
        </span>
      ),
    },
    {
      key: 'shelfLife',
      label: '保质期(天)',
      render: (row: Variety) => (
        <span className="text-gray-600">{row.shelfLife}</span>
      ),
    },
    {
      key: 'status',
      label: '状态',
      render: (row: Variety) => <StatusBadge status={row.status} type="variety" />,
    },
    {
      key: 'actions',
      label: '操作',
      render: (row: Variety) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/varieties/${row.id}?edit=true`)}
            className="p-1.5 text-gray-400 hover:text-primary-700 rounded hover:bg-primary-50"
            title="编辑"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
            title="删除"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="品种管理"
        subtitle="管理果园品种信息"
        action={
          <button onClick={() => navigate('/varieties/new')} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新增品种
          </button>
        }
      />

      <div className="mb-4">
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

      <DataTable columns={columns} data={varieties as (Variety & Record<string, unknown>)[]} loading={loading} emptyMessage="暂无品种数据" />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="删除品种"
        message={`确定要删除品种「${deleteTarget?.name}」吗？此操作不可撤销。`}
        confirmText="删除"
        variant="danger"
      />
    </div>
  )
}
