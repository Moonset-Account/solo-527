'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useApi } from '@/components/useApi'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import type { BillSummary, WorkOrderSummary, BillingStats, WorkOrderStats } from '@/types'
import { BillStatus, WorkOrderStatus } from '@prisma/client'

export default function Dashboard() {
  const { data: session } = useSession()
  const { request } = useApi()
  const [bills, setBills] = useState<BillSummary[]>([])
  const [orders, setOrders] = useState<WorkOrderSummary[]>([])
  const [stats, setStats] = useState<{ billingStats: BillingStats; workOrderStats: WorkOrderStats } | null>(null)
  const [loading, setLoading] = useState(true)

  const isResident = session?.user.role === 'RESIDENT'
  const isAdminOrCS = session?.user.role === 'ADMIN' || session?.user.role === 'CUSTOMER_SERVICE'

  useEffect(() => {
    const load = async () => {
      const [billsData, ordersData, statsData] = await Promise.all([
        request<{ data: BillSummary[] }>('/api/bills?pageSize=5'),
        request<{ data: WorkOrderSummary[] }>('/api/work-orders?pageSize=5'),
        isAdminOrCS ? request<{ billingStats: BillingStats; workOrderStats: WorkOrderStats }>('/api/stats') : Promise.resolve(null),
      ])
      if (billsData) setBills(billsData.data)
      if (ordersData) setOrders(ordersData.data)
      if (statsData) setStats(statsData)
      setLoading(false)
    }
    load()
  }, [request, isAdminOrCS])

  const BillStatusBadge = ({ status }: { status: BillStatus }) => {
    const map: Record<BillStatus, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      PARTIAL: 'bg-blue-100 text-blue-700',
      PAID: 'bg-green-100 text-green-700',
      OVERDUE: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-gray-100 text-gray-600',
    }
    const labels: Record<BillStatus, string> = {
      PENDING: '待缴费',
      PARTIAL: '部分缴费',
      PAID: '已缴清',
      OVERDUE: '已逾期',
      CANCELLED: '已取消',
    }
    return <span className={`badge ${map[status]}`}>{labels[status]}</span>
  }

  const WorkOrderStatusBadge = ({ status, isOverdue }: { status: WorkOrderStatus; isOverdue: boolean }) => {
    if (isOverdue) return <span className="badge bg-red-100 text-red-700">超时</span>
    const map: Record<WorkOrderStatus, string> = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      ASSIGNED: 'bg-blue-100 text-blue-700',
      IN_PROGRESS: 'bg-indigo-100 text-indigo-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-gray-100 text-gray-600',
      OVERDUE: 'bg-red-100 text-red-700',
    }
    const labels: Record<WorkOrderStatus, string> = {
      PENDING: '待处理',
      ASSIGNED: '已分派',
      IN_PROGRESS: '处理中',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
      OVERDUE: '已超时',
    }
    return <span className={`badge ${map[status]}`}>{labels[status]}</span>
  }

  if (loading) {
    return <div className="text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          你好，{session?.user.name || session?.user.email} 👋
        </h1>
        <p className="text-gray-500 mt-1">欢迎回到公寓服务门户</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="text-sm text-gray-500">应缴总额</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(stats.billingStats.totalBilled)}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-gray-500">已缴总额</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(stats.billingStats.totalPaid)}
            </div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-gray-500">待缴费</div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {stats.billingStats.totalPending} 笔
            </div>
          </div>
          <div className="card p-5">
            <div className="text-sm text-gray-500">已超时工单</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {stats.workOrderStats.overdue} 个
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">近期账单</h2>
            <Link href="/bills" className="text-sm text-blue-600 hover:text-blue-700">
              查看全部 →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {bills.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无账单</div>
            ) : (
              bills.map(bill => (
                <div key={bill.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{bill.title}</span>
                      <BillStatusBadge status={bill.status} />
                    </div>
                    <div className="text-sm text-gray-500 mt-1 flex gap-4">
                      <span>{bill.apartment.building} {bill.apartment.unitNumber}</span>
                      <span>截止: {formatDate(bill.dueDate)}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-semibold text-gray-900">{formatCurrency(bill.amount)}</div>
                    {bill.status !== 'PAID' && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        已缴 {formatCurrency(bill.paidAmount)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">近期工单</h2>
            <Link href="/work-orders" className="text-sm text-blue-600 hover:text-blue-700">
              查看全部 →
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无工单</div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">{order.title}</span>
                      <WorkOrderStatusBadge status={order.status} isOverdue={order.isOverdue} />
                    </div>
                    <div className="text-sm text-gray-500 mt-1 flex gap-4">
                      <span>{order.apartment.unitNumber}</span>
                      <span>{formatDateTime(order.createdAt)}</span>
                      {order.assignee?.name && <span>处理人: {order.assignee.name}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/bills" className="card p-5 hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">💰</div>
          <div className="font-semibold text-gray-900">费用账单</div>
          <div className="text-sm text-gray-500 mt-1">查看和缴纳费用</div>
        </Link>
        <Link href="/contracts" className="card p-5 hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">📄</div>
          <div className="font-semibold text-gray-900">合同附件</div>
          <div className="text-sm text-gray-500 mt-1">查看合同和附件</div>
        </Link>
        <Link href="/visitors" className="card p-5 hover:shadow-md transition-shadow">
          <div className="text-3xl mb-2">👥</div>
          <div className="font-semibold text-gray-900">访客预约</div>
          <div className="text-sm text-gray-500 mt-1">预约和管理访客</div>
        </Link>
      </div>
    </div>
  )
}
