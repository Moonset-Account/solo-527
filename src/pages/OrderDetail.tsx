import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Truck, Send, CheckCircle, Package, Clock } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import FormField from '@/components/FormField'
import { cn } from '@/lib/utils'

interface Shipment {
  id: string
  shipDate: string
  quantity: number
  trackingNo: string
  sortingOrderId: string
  sortingOrderNo: string
  sortingOrderVariety: string
}

interface Fulfillment {
  totalOrdered: number
  totalShipped: number
  unit: string
  fulfillmentRate: number
}

interface Order {
  id: string
  orderNo: string
  customer: string
  variety: string
  quantity: number
  unit: string
  unitPrice: number
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'
  deadline: string
  totalShipped: number
  fulfillmentRate: number
  shipments: Shipment[]
  createdAt: string
}

interface SortingOrderOption {
  id: string
  orderNo: string
  variety: string
}

const timelineIcons: Record<string, React.ElementType> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  completed: CheckCircle,
  cancelled: Clock,
}

const statusLabelMap: Record<string, string> = {
  pending: '待处理', processing: '处理中', shipped: '已发货',
  completed: '已完成', cancelled: '已取消', returned: '已退回',
}

const PIE_COLORS = ['#1B4332', '#95D5B2']

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { execute: fetchOrder } = useApi<Order>()
  const { execute: shipOrder, loading: shipping } = useApi()
  const { execute: fetchSortingOrders } = useApi<SortingOrderOption[]>()

  const [order, setOrder] = useState<Order | null>(null)
  const [sortingOrders, setSortingOrders] = useState<SortingOrderOption[]>([])
  const [shipForm, setShipForm] = useState({ sortingOrderId: '', quantity: '', trackingNo: '' })
  const [shipErrors, setShipErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      setLoading(true)
      Promise.all([
        fetchOrder(`/api/orders/${id}`),
        fetchSortingOrders('/api/sorting-orders?status=completed'),
      ]).then(([orderData, sortingData]) => {
        if (orderData) setOrder(orderData)
        if (sortingData) setSortingOrders(sortingData)
      }).catch(() => {}).finally(() => setLoading(false))
    }
  }, [id])

  const fulfillment: Fulfillment = {
    totalOrdered: order?.quantity || 0,
    totalShipped: order?.totalShipped || 0,
    unit: order?.unit || 'kg',
    fulfillmentRate: order?.fulfillmentRate || 0,
  }

  const pieData = [
    { name: '已发货', value: fulfillment.totalShipped },
    { name: '待发货', value: Math.max(fulfillment.totalOrdered - fulfillment.totalShipped, 0) },
  ]

  const validateShip = () => {
    const errs: Record<string, string> = {}
    if (!shipForm.sortingOrderId) errs.sortingOrderId = '请选择分拣订单'
    if (!shipForm.quantity || Number(shipForm.quantity) <= 0) errs.quantity = '请输入有效数量'
    if (!shipForm.trackingNo.trim()) errs.trackingNo = '请输入物流单号'
    setShipErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleShip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateShip() || !id) return
    const result = await shipOrder(`/api/orders/${id}/ship`, {
      method: 'POST',
      body: JSON.stringify({
        sortingOrderId: shipForm.sortingOrderId,
        quantity: Number(shipForm.quantity),
        trackingNo: shipForm.trackingNo,
      }),
    })
    if (result) {
      setShipForm({ sortingOrderId: '', quantity: '', trackingNo: '' })
      const fresh = await fetchOrder(`/api/orders/${id}`)
      if (fresh) setOrder(fresh)
    }
  }

  const infoItems = order ? [
    { label: '订单号', value: order.orderNo },
    { label: '客户', value: order.customer },
    { label: '品种', value: order.variety },
    { label: '数量', value: `${order.quantity} ${order.unit}` },
    { label: '单价', value: `¥${order.unitPrice}/${order.unit}` },
    { label: '截止日期', value: order.deadline },
    { label: '状态', value: <StatusBadge status={order.status} type="order" /> },
  ] : []

  const statusHistory = order ? [
    { status: 'pending', date: new Date(order.createdAt || '').toLocaleString('zh-CN') },
    ...(order.status !== 'pending' ? [{ status: order.status, date: new Date().toLocaleString('zh-CN') }] : []),
  ] : []

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          <div className="skeleton h-32" />
          <div className="skeleton h-32" />
          <div className="skeleton h-32" />
        </div>
      </div>
    )
  }

  if (!order) {
    return <div className="p-6 text-center text-gray-500">订单不存在</div>
  }

  return (
    <div>
      <PageHeader
        title="订单详情"
        action={
          <button onClick={() => navigate('/orders')} className="btn-outline flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span>返回列表</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">订单信息</h3>
          <div className="space-y-3">
            {infoItems.map((item) => (
              <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{item.label}</span>
                <span className="text-sm font-medium text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">履约统计</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-primary-50">
              <span className="text-sm text-gray-500 mb-1">总订单量</span>
              <span className="text-2xl font-bold text-primary-700">{fulfillment.totalOrdered}<span className="text-sm font-normal ml-1">{fulfillment.unit}</span></span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-green-50">
              <span className="text-sm text-gray-500 mb-1">已发货</span>
              <span className="text-2xl font-bold text-green-600">{fulfillment.totalShipped}<span className="text-sm font-normal ml-1">{fulfillment.unit}</span></span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-accent-50">
              <span className="text-sm text-gray-500 mb-1">履约率</span>
              <span className="text-2xl font-bold text-accent-600">{fulfillment.fulfillmentRate}%</span>
            </div>
          </div>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" nameKey="name">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} ${fulfillment.unit}`, '']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">状态时间线</h3>
          <div className="space-y-4">
            {statusHistory.map((item, idx) => {
              const Icon = timelineIcons[item.status] || Clock
              const isLast = idx === statusHistory.length - 1
              return (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', isLast ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400')}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-800">{statusLabelMap[item.status] || item.status}</p>
                    <p className="text-xs text-gray-400">{item.date}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">发货记录</h3>
          {order.shipments.length === 0 ? (
            <div className="text-center py-6 text-gray-400">暂无发货记录</div>
          ) : (
            <div className="space-y-3">
              {order.shipments.map((s) => (
                <div key={s.id} className="p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{s.quantity} {order.unit}</span>
                    <span className="text-xs text-gray-500">{new Date(s.shipDate).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    <p>物流单号：{s.trackingNo}</p>
                    <p>分拣订单：{s.sortingOrderNo} ({s.sortingOrderVariety})</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(order.status === 'pending' || order.status === 'processing') && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">新增发货</h3>
          <form onSubmit={handleShip} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <FormField label="分拣订单" required error={shipErrors.sortingOrderId}>
              <select value={shipForm.sortingOrderId} onChange={(e) => setShipForm({ ...shipForm, sortingOrderId: e.target.value })} className="input-field">
                <option value="">请选择分拣订单</option>
                {sortingOrders.map((so) => (
                  <option key={so.id} value={so.id}>{so.orderNo} - {so.variety}</option>
                ))}
              </select>
            </FormField>
            <FormField label="发货数量" required error={shipErrors.quantity}>
              <input type="number" value={shipForm.quantity} onChange={(e) => setShipForm({ ...shipForm, quantity: e.target.value })} placeholder="0" min="0" className="input-field" />
            </FormField>
            <FormField label="物流单号" required error={shipErrors.trackingNo}>
              <input type="text" value={shipForm.trackingNo} onChange={(e) => setShipForm({ ...shipForm, trackingNo: e.target.value })} placeholder="请输入物流单号" className="input-field" />
            </FormField>
            <div className="flex items-end">
              <button type="submit" disabled={shipping} className="btn-primary flex items-center gap-2">
                <Send className="h-4 w-4" />
                {shipping ? '提交中...' : '发货'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
