import { useState, useMemo } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import StatusBadge from '@/components/ui/StatusBadge'
import { cashierOrders, payments } from '@/data/mockData'
import { OrderStatus, PaymentMethod, OrderType } from '@/types'
import {
  Calendar,
  Filter,
  Search,
  Eye,
  RefreshCcw,
  CreditCard,
  DollarSign,
  TrendingUp,
  Receipt,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react'

export default function CashierPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const filteredOrders = useMemo(() => {
    return cashierOrders.filter((order) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchNo = order.orderNo.toLowerCase().includes(query)
        const matchCustomer = order.customer?.name.toLowerCase().includes(query)
        const matchPlate = order.vehicle?.plateNumber.toLowerCase().includes(query)
        if (!matchNo && !matchCustomer && !matchPlate) return false
      }

      if (statusFilter && order.status !== statusFilter) return false

      if (paymentMethodFilter) {
        const orderPayments = payments.filter((p) => p.orderId === order.id)
        const hasMethod = orderPayments.some(
          (p) => p.paymentMethod === paymentMethodFilter
        )
        if (!hasMethod) return false
      }

      if (dateRange.start) {
        const startDate = new Date(dateRange.start)
        const orderDate = new Date(order.createdAt)
        if (orderDate < startDate) return false
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end)
        endDate.setHours(23, 59, 59)
        const orderDate = new Date(order.createdAt)
        if (orderDate > endDate) return false
      }

      return true
    })
  }, [searchQuery, statusFilter, paymentMethodFilter, dateRange])

  const stats = useMemo(() => {
    const totalAmount = filteredOrders.reduce(
      (sum, o) => sum + o.actualAmount,
      0
    )
    const paidCount = filteredOrders.filter(
      (o) => o.status === OrderStatus.Paid || o.status === OrderStatus.Completed
    ).length
    const refundCount = filteredOrders.filter(
      (o) => o.status === OrderStatus.Refunded
    ).length

    return { totalAmount, count: filteredOrders.length, paidCount, refundCount }
  }, [filteredOrders])

  const getStatusType = (status: string) => {
    switch (status) {
      case OrderStatus.Pending:
        return 'warning'
      case OrderStatus.Paid:
        return 'primary'
      case OrderStatus.Completed:
        return 'success'
      case OrderStatus.Cancelled:
        return 'gray'
      case OrderStatus.Refunded:
        return 'danger'
      default:
        return 'gray'
    }
  }

  const getOrderPayments = (orderId: string) => {
    return payments.filter((p) => p.orderId === orderId)
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case PaymentMethod.WeChat:
        return '💬'
      case PaymentMethod.Alipay:
        return '💰'
      case PaymentMethod.Cash:
        return '💵'
      case PaymentMethod.Card:
        return '💳'
      case PaymentMethod.Balance:
        return '👛'
      default:
        return '💳'
    }
  }

  return (
    <AdminLayout title="收银管理">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">订单总数</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.count}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.paidCount}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <RefreshCcw className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">已退款</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.refundCount}
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">总金额</p>
                <p className="text-xl font-bold text-accent-600 font-mono">
                  ¥{stats.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索订单号、车主、车牌..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  className="input-field text-sm py-2 w-36"
                />
                <span className="text-gray-400">至</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                  className="input-field text-sm py-2 w-36"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-field text-sm py-2 w-28"
                >
                  <option value="">全部状态</option>
                  {Object.values(OrderStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="input-field text-sm py-2 w-32"
                >
                  <option value="">支付方式</option>
                  {Object.values(PaymentMethod).map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    订单信息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    客户信息
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    订单类型
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支付方式
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    金额
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const orderPayments = getOrderPayments(order.id)
                  const isExpanded = expandedOrder === order.id

                  return (
                    <>
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => toggleExpand(order.id)}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary-500" />
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {order.orderNo}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="text-sm text-gray-900">
                              {order.customer?.name || '-'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.vehicle?.plateNumber || '-'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-gray-600">
                            {order.orderType || OrderType.Service}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            {orderPayments.length > 0 ? (
                              orderPayments.map((p, i) => (
                                <span
                                  key={i}
                                  className="text-sm"
                                  title={p.paymentMethod as string}
                                >
                                  {getPaymentMethodIcon(p.paymentMethod as string)}
                                </span>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="font-mono font-bold text-lg text-accent-600">
                            ¥{order.actualAmount.toFixed(2)}
                          </div>
                          {order.discountAmount > 0 && (
                            <div className="text-xs text-gray-400 line-through">
                              ¥{order.totalAmount.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge
                            status={getStatusType(order.status) as any}
                            text={order.status as string}
                            dot
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                              className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {(order.status === OrderStatus.Paid ||
                              order.status === OrderStatus.Completed) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                }}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="退款"
                              >
                                <RefreshCcw className="w-4 h-4" />
                              </button>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="pl-8">
                              <h4 className="font-medium text-gray-900 mb-3 text-sm">
                                订单详情
                              </h4>
                              {order.orderItems &&
                              order.orderItems.length > 0 ? (
                                <div className="space-y-2 mb-4">
                                  {order.orderItems.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
                                    >
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {item.itemName}
                                        </p>
                                        {item.description && (
                                          <p className="text-xs text-gray-500">
                                            {item.description}
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-mono font-medium text-gray-900">
                                          ¥{item.actualAmount.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          x{item.quantity}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 mb-4">
                                  {order.remarks || '无商品明细'}
                                </p>
                              )}

                              {orderPayments.length > 0 && (
                                <div className="pt-3 border-t border-gray-200">
                                  <h5 className="text-xs font-medium text-gray-500 mb-2">
                                    支付记录
                                  </h5>
                                  <div className="space-y-2">
                                    {orderPayments.map((payment) => (
                                      <div
                                        key={payment.id}
                                        className="flex items-center justify-between text-sm"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span>
                                            {getPaymentMethodIcon(
                                              payment.paymentMethod as string
                                            )}
                                          </span>
                                          <span className="text-gray-600">
                                            {payment.paymentMethod}
                                          </span>
                                          <span className="text-xs text-gray-400">
                                            {payment.paymentNo}
                                          </span>
                                        </div>
                                        <span className="font-mono font-medium text-gray-900">
                                          ¥{payment.actualAmount.toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {order.remarks && (
                                <div className="pt-3 mt-3 border-t border-gray-200">
                                  <p className="text-xs text-gray-500">
                                    备注：{order.remarks}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CreditCard className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">暂无收银单</p>
              <p className="text-sm mt-1">试试其他筛选条件</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            共 <span className="font-medium text-gray-900">{filteredOrders.length}</span>{' '}
            条记录
          </span>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
              上一页
            </button>
            <button className="px-3 py-1.5 rounded-md bg-primary-600 text-white">
              1
            </button>
            <button className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
              下一页
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
