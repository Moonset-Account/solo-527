import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Eye, CheckCircle } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

interface SortingOrder {
  id: string
  orderNo: string
  harvestId: string
  harvestBatch: string
  sorter: string
  status: string
  gradeSummary: string
  inspectionResult: string
}

const mockOrders: SortingOrder[] = [
  { id: '1', orderNo: 'FJ-20260611-001', harvestId: 'h1', harvestBatch: 'CS-20260610-001', sorter: '张三', status: 'pending', gradeSummary: '-', inspectionResult: '-' },
  { id: '2', orderNo: 'FJ-20260611-002', harvestId: 'h2', harvestBatch: 'CS-20260610-002', sorter: '李四', status: 'in_progress', gradeSummary: '-', inspectionResult: '-' },
  { id: '3', orderNo: 'FJ-20260610-003', harvestId: 'h3', harvestBatch: 'CS-20260609-001', sorter: '王五', status: 'completed', gradeSummary: '特级30%,一级50%', inspectionResult: '合格' },
  { id: '4', orderNo: 'FJ-20260610-004', harvestId: 'h4', harvestBatch: 'CS-20260609-002', sorter: '赵六', status: 'cancelled', gradeSummary: '-', inspectionResult: '-' },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

export default function SortingOrders() {
  const navigate = useNavigate()
  const { execute, loading } = useApi<SortingOrder[]>()
  const [orders, setOrders] = useState<SortingOrder[]>(mockOrders)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchKey, setSearchKey] = useState('')

  useEffect(() => {
    execute('/api/sorting-orders').then((data) => {
      if (data) setOrders(data)
    }).catch(() => {})
  }, [])

  const filtered = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false
    if (searchKey && !o.orderNo.includes(searchKey) && !o.harvestBatch.includes(searchKey)) return false
    return true
  })

  const columns = [
    { key: 'orderNo', label: '订单号' },
    { key: 'harvestBatch', label: '来源批次' },
    { key: 'sorter', label: '分拣员' },
    {
      key: 'status', label: '状态',
      render: (row: SortingOrder) => <StatusBadge status={row.status} type="sorting" />,
    },
    { key: 'gradeSummary', label: '等级分类' },
    { key: 'inspectionResult', label: '质检结果' },
    {
      key: 'actions', label: '操作',
      render: (row: SortingOrder) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/sorting-orders/${row.id}`)}
            className="p-1.5 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            title="查看详情"
          >
            <Eye className="h-4 w-4" />
          </button>
          {(row.status === 'pending' || row.status === 'in_progress') && (
            <button
              onClick={() => navigate(`/sorting-orders/${row.id}`)}
              className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              title="完成分拣"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="分拣订单"
        subtitle="管理果园产品分拣流程"
        action={
          <button onClick={() => navigate('/sorting-orders/new')} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>新增分拣</span>
          </button>
        }
      />

      <div className="card p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号或来源批次..."
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              className={cn('input-field pl-9')}
            />
          </div>
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
    </div>
  )
}
