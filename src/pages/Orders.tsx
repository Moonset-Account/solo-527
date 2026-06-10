import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Eye } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import DataTable from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

interface Order {
  id: string
  orderNo: string
  customer: string
  variety: string
  quantity: number
  unit: string
  unitPrice: number
  status: string
  deadline: string
  fulfillmentRate: number
}

const mockOrders: Order[] = [
  { id: '1', orderNo: 'OR-20260611-001', customer: '上海鲜果批发', variety: '红富士', quantity: 2000, unit: 'kg', unitPrice: 8.5, status: 'pending', deadline: '2026-06-20', fulfillmentRate: 0 },
  { id: '2', orderNo: 'OR-20260610-002', customer: '北京果品公司', variety: '嘎啦', quantity: 1500, unit: 'kg', unitPrice: 7.0, status: 'processing', deadline: '2026-06-18', fulfillmentRate: 65 },
  { id: '3', orderNo: 'OR-20260609-003', customer: '深圳优选农业', variety: '金冠', quantity: 800, unit: 'kg', unitPrice: 9.0, status: 'shipped', deadline: '2026-06-15', fulfillmentRate: 100 },
  { id: '4', orderNo: 'OR-20260608-004', customer: '广州利农商贸', variety: '红富士', quantity: 3000, unit: 'kg', unitPrice: 8.0, status: 'delivered', deadline: '2026-06-12', fulfillmentRate: 100 },
  { id: '5', orderNo: 'OR-20260607-005', customer: '武汉果园汇', variety: '国光', quantity: 500, unit: 'kg', unitPrice: 6.5, status: 'cancelled', deadline: '2026-06-10', fulfillmentRate: 30 },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'shipped', label: '已发货' },
  { value: 'delivered', label: '已送达' },
  { value: 'cancelled', label: '已取消' },
  { value: 'returned', label: '已退回' },
]

function FulfillmentBar({ rate }: { rate: number }) {
  const color = rate > 80 ? 'bg-green-500' : rate > 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${rate}%` }} />
      </div>
      <span className={cn('text-xs font-medium', rate > 80 ? 'text-green-600' : rate > 50 ? 'text-yellow-600' : 'text-red-600')}>
        {rate}%
      </span>
    </div>
  )
}

export default function Orders() {
  const navigate = useNavigate()
  const { execute, loading } = useApi<Order[]>()
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchKey, setSearchKey] = useState('')

  useEffect(() => {
    execute('/api/orders').then((data) => {
      if (data) setOrders(data)
    }).catch(() => {})
  }, [])

  const filtered = orders.filter((o) => {
    if (statusFilter && o.status !== statusFilter) return false
    if (searchKey && !o.customer.includes(searchKey) && !o.orderNo.includes(searchKey)) return false
    return true
  })

  const columns = [
    { key: 'orderNo', label: '订单号' },
    { key: 'customer', label: '客户' },
    { key: 'variety', label: '品种' },
    {
      key: 'quantity', label: '数量',
      render: (row: Order) => `${row.quantity} ${row.unit}`,
    },
    {
      key: 'unitPrice', label: '单价',
      render: (row: Order) => `¥${row.unitPrice}/${row.unit}`,
    },
    {
      key: 'status', label: '状态',
      render: (row: Order) => <StatusBadge status={row.status} type="order" />,
    },
    { key: 'deadline', label: '截止日期' },
    {
      key: 'fulfillmentRate', label: '履约率',
      render: (row: Order) => <FulfillmentBar rate={row.fulfillmentRate} />,
    },
    {
      key: 'actions', label: '操作',
      render: (row: Order) => (
        <button
          onClick={() => navigate(`/orders/${row.id}`)}
          className="p-1.5 text-gray-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          title="查看详情"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="订单履约"
        subtitle="跟踪订单发货与履约进度"
        action={
          <button onClick={() => navigate('/orders/new')} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>新增订单</span>
          </button>
        }
      />

      <div className="card p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户或订单号..."
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              className="input-field pl-9"
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
