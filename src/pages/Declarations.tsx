import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Pencil } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import Modal from '@/components/Modal'
import FormField from '@/components/FormField'
import { cn } from '@/lib/utils'

interface Declaration {
  id: string
  name: string
  harvestId: string
  status: 'complete' | 'missing' | 'processing'
  remark: string
  result: string
  deadline: string
  createdAt: string
}

interface DeclStats {
  total: number
  complete: number
  missing: number
  processing: number
}

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'complete', label: '齐全' },
  { value: 'missing', label: '缺失' },
  { value: 'processing', label: '处理中' },
]

const statusEditOptions = [
  { value: 'complete', label: '齐全' },
  { value: 'missing', label: '缺失' },
  { value: 'processing', label: '处理中' },
]

export default function Declarations() {
  const navigate = useNavigate()
  const { execute: fetchList, loading } = useApi<Declaration[]>()
  const { execute: fetchStats } = useApi<DeclStats>()
  const { execute: updateDecl } = useApi<Declaration>()

  const [declarations, setDeclarations] = useState<Declaration[]>([])
  const [stats, setStats] = useState<DeclStats>({ total: 0, complete: 0, missing: 0, processing: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Declaration | null>(null)
  const [editForm, setEditForm] = useState<{
    status: 'complete' | 'missing' | 'processing'
    remark: string
    result: string
  }>({ status: 'missing', remark: '', result: '' })

  const loadData = () => {
    fetchList('/api/declarations').then((data) => { if (data) setDeclarations(data) }).catch(() => {})
    fetchStats('/api/declarations/stats').then((data) => { if (data) setStats(data) }).catch(() => {})
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = declarations.filter((d) => {
    if (statusFilter && d.status !== statusFilter) return false
    return true
  })

  const openEdit = (item: Declaration) => {
    setEditItem(item)
    setEditForm({
      status: item.status as 'complete' | 'missing' | 'processing',
      remark: item.remark || '',
      result: item.result || '',
    })
    setEditModalOpen(true)
  }

  const handleEditSave = async () => {
    if (!editItem) return
    const result = await updateDecl(`/api/declarations/${editItem.id}`, {
      method: 'PUT',
      body: JSON.stringify(editForm),
    })
    if (result) {
      setDeclarations(declarations.map((d) => d.id === editItem.id ? { ...d, ...editForm } : d))
      setEditModalOpen(false)
      loadData()
    }
  }

  const statCards = [
    { label: '齐全', value: stats.complete, color: 'bg-green-100 text-green-700' },
    { label: '处理中', value: stats.processing, color: 'bg-blue-100 text-blue-700' },
    { label: '缺失', value: stats.missing, color: 'bg-red-100 text-red-700' },
  ]

  const columns = [
    { key: 'name', label: '材料名称' },
    { key: 'harvestId', label: '关联采收', render: (row: Declaration) => row.harvestId || '-' },
    {
      key: 'status', label: '状态',
      render: (row: Declaration) => <StatusBadge status={row.status} type="declaration" />,
    },
    { key: 'remark', label: '备注', render: (row: Declaration) => row.remark || '-' },
    { key: 'result', label: '处理结果', render: (row: Declaration) => row.result || '-' },
    { key: 'deadline', label: '截止日期', render: (row: Declaration) => row.deadline ? new Date(row.deadline).toLocaleDateString('zh-CN') : '-' },
    {
      key: 'actions', label: '操作',
      render: (row: Declaration) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            title="编辑"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate(`/declarations/${row.id}`)}
            className="p-1.5 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            title="查看详情"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="申报材料"
        subtitle="管理各类申报与证明文件"
        action={
          <button onClick={() => {}} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>新增材料</span>
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="card p-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">{s.label}</span>
            <span className={cn('status-badge', s.color)}>{s.value}</span>
          </div>
        ))}
      </div>

      <div className="card p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field sm:w-40"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <DataTable columns={columns as unknown as { key: string; label: string; render?: (row: Record<string, unknown>, index: number) => React.ReactNode }[]} data={filtered as unknown as Record<string, unknown>[]} loading={loading} />

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="编辑申报材料" size="lg">
        <div className="space-y-4">
          <FormField label="状态">
            <select
              value={editForm.status}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  status: e.target.value as 'complete' | 'missing' | 'processing',
                })
              }
              className="input-field"
            >
              {statusEditOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FormField>
          <FormField label="备注">
            <textarea value={editForm.remark} onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })} rows={3} className="input-field" placeholder="请输入备注" />
          </FormField>
          <FormField label="处理结果">
            <textarea value={editForm.result} onChange={(e) => setEditForm({ ...editForm, result: e.target.value })} rows={3} className="input-field" placeholder="请输入处理结果" />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEditModalOpen(false)} className="btn-outline">取消</button>
            <button onClick={handleEditSave} className="btn-primary">保存</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
