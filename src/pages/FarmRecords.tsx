import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Droplets, Bug, ShowerHead, Scissors, Leaf, Wrench, Eye, CheckCircle } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { useAuthStore } from '@/stores/authStore'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

const typeOptions = [
  { value: 'fertilization', label: '施肥', icon: Droplets, color: 'text-green-600 bg-green-50' },
  { value: 'pesticide', label: '打药', icon: Bug, color: 'text-red-600 bg-red-50' },
  { value: 'irrigation', label: '灌溉', icon: ShowerHead, color: 'text-blue-600 bg-blue-50' },
  { value: 'pruning', label: '修剪', icon: Scissors, color: 'text-amber-600 bg-amber-50' },
  { value: 'weeding', label: '除草', icon: Leaf, color: 'text-emerald-600 bg-emerald-50' },
  { value: 'other', label: '其他', icon: Wrench, color: 'text-gray-600 bg-gray-50' },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
]

interface FarmRecord {
  id: string
  operateDate: string
  plotName: string
  varietyName: string
  type: string
  content: string
  dosage: string
  unit: string
  operator: string
  status: string
  [key: string]: unknown
}

interface Option {
  id: string
  name: string
  currentVariety?: string
  currentVarietyId?: string
}

export default function FarmRecords() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { execute, loading } = useApi<FarmRecord[]>()
  const [records, setRecords] = useState<FarmRecord[]>([])
  const [plots, setPlots] = useState<Option[]>([])
  const [varieties, setVarieties] = useState<Option[]>([])
  const [filters, setFilters] = useState({
    plotId: '',
    varietyId: '',
    type: '',
    status: '',
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
    execute(`/api/farm-records?${params.toString()}`).then((d) => {
      if (d) setRecords(Array.isArray(d) ? d : ((d as Record<string, unknown>).data as FarmRecord[]) ?? [])
    })
  }, [filters])

  const getTypeInfo = (type: string) => typeOptions.find((t) => t.value === type) || typeOptions[5]

  const canReview = user?.role === 'admin' || user?.role === 'reviewer'

  const columns = [
    {
      key: 'operateDate',
      label: '日期',
      render: (row: FarmRecord) => row.operateDate?.slice(0, 10),
    },
    { key: 'plotName', label: '地块' },
    { key: 'varietyName', label: '品种' },
    {
      key: 'type',
      label: '类型',
      render: (row: FarmRecord) => {
        const info = getTypeInfo(row.type)
        return (
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', info.color)}>
            <info.icon className="h-3 w-3" />
            {info.label}
          </span>
        )
      },
    },
    {
      key: 'content',
      label: '内容',
      render: (row: FarmRecord) => (
        <span className="max-w-[160px] truncate block" title={row.content}>{row.content}</span>
      ),
    },
    {
      key: 'dosage',
      label: '用量',
      render: (row: FarmRecord) =>
        row.dosage ? `${row.dosage} ${row.unit}` : '-',
    },
    { key: 'operator', label: '操作人' },
    {
      key: 'status',
      label: '状态',
      render: (row: FarmRecord) => <StatusBadge status={row.status} type="farm-record" />,
    },
    {
      key: 'actions',
      label: '操作',
      render: (row: FarmRecord) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/farm-records/${row.id}`)}
            className="text-primary-700 hover:text-primary-800 text-sm flex items-center gap-1"
          >
            <Eye className="h-3.5 w-3.5" />
            查看
          </button>
          {row.status === 'pending' && canReview && (
            <button
              onClick={() => navigate(`/farm-records/${row.id}`)}
              className="text-accent-600 hover:text-accent-700 text-sm flex items-center gap-1"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              审核
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="农事记录"
        action={
          <button onClick={() => navigate('/farm-records/new')} className="btn-primary flex items-center gap-1.5">
            <Plus className="h-4 w-4" />
            新增记录
          </button>
        }
      />

      <div className="card p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="input-field text-sm"
          >
            <option value="">全部类型</option>
            {typeOptions.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input-field text-sm"
          >
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="input-field text-sm"
            placeholder="开始日期"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="input-field text-sm"
            placeholder="结束日期"
          />
        </div>
      </div>

      <DataTable columns={columns} data={records} loading={loading} emptyMessage="暂无农事记录" />
    </div>
  )
}
