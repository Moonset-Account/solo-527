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
  batchNo: string
  status: string
  remark: string
  result: string
  deadline: string
}

interface DeclStats {
  approved: number
  draft: number
  submitted: number
  rejected: number
}

const mockDeclarations: Declaration[] = [
  { id: '1', name: '农药残留检测报告', batchNo: 'CS-20260610-001', status: 'approved', remark: '已检测合格', result: '合格', deadline: '2026-06-15' },
  { id: '2', name: '产地证明', batchNo: 'CS-20260610-002', status: 'submitted', remark: '等待审核', result: '', deadline: '2026-06-16' },
  { id: '3', name: '质量检验报告', batchNo: 'CS-20260609-001', status: 'draft', remark: '待补充数据', result: '', deadline: '2026-06-18' },
  { id: '4', name: '出口检疫证书', batchNo: 'CS-20260608-002', status: 'rejected', remark: '材料不齐全', result: '驳回补充', deadline: '2026-06-12' },
  { id: '5', name: '有机认证报告', batchNo: 'CS-20260611-001', status: 'approved', remark: '已认证', result: '通过', deadline: '2026-06-20' },
]

const mockStats: DeclStats = { approved: 2, draft: 1, submitted: 1, rejected: 1 }

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
]

export default function Declarations() {
  const navigate = useNavigate()
  const { execute: fetchList, loading } = useApi<Declaration[]>()
  const { execute: fetchStats } = useApi<DeclStats>()
  const { execute: updateDecl } = useApi<Declaration>()

  const [declarations, setDeclarations] = useState<Declaration[]>(mockDeclarations)
  const [stats, setStats] = useState<DeclStats>(mockStats)
  const [statusFilter, setStatusFilter] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<Declaration | null>(null)
  const [editForm, setEditForm] = useState({ status: '', remark: '', result: '' })

  useEffect(() => {
    fetchList('/api/declarations').then((data) => { if (data) setDeclarations(data) }).catch(() => {})
    fetchStats('/api/declarations/stats').then((data) => { if (data) setStats(data) }).catch(() => {})
  }, [])

  const filtered = declarations.filter((d) => {
    if (statusFilter && d.status !== statusFilter) return false
    return true
  })

  const openEdit = (item: Declaration) => {
    setEditItem(item)
    setEditForm({ status: item.status, remark: item.remark, result: item.result })
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
    }
  }

  const statCards = [
    { label: '已通过', value: stats.approved, color: 'bg-green-100 text-green-700' },
    { label: '待处理', value: stats.submitted + stats.draft, color: 'bg-amber-100 text-amber-700' },
    { label: '已驳回', value: stats.rejected, color: 'bg-red-100 text-red-700' },
  ]

  const columns = [
    { key: 'name', label: '材料名称' },
    { key: 'batchNo', label: '关联批次' },
    {
      key: 'status', label: '状态',
      render: (row: Declaration) => <StatusBadge status={row.status} type="declaration" />,
    },
    { key: 'remark', label: '备注' },
    { key: 'result', label: '处理结果' },
    { key: 'deadline', label: '截止日期' },
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
            <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="input-field">
              <option value="draft">草稿</option>
              <option value="submitted">已提交</option>
              <option value="approved">已通过</option>
              <option value="rejected">已驳回</option>
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
