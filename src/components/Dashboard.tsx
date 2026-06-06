'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils'
import { Calendar, Package, Camera, DollarSign, Clock, AlertTriangle, FileText, Bell } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import Link from 'next/link'
import { Database } from '@/types/database'

type Order = Database['public']['Tables']['orders']['Row'] & {
  studio: { name: string } | null
  customer: { full_name: string | null; email: string } | null
}

export function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    activeEquipment: 0,
    monthlyRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const isStaff = profile?.role === 'staff' || profile?.role === 'admin'

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [{ count: todayCount }, { count: pendingCount }, { count: equipmentCount }, { data: orders }] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).gte('start_time', today.toISOString()),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase
          .from('orders')
          .select(`
            *,
            studio:studios(name),
            customer:profiles(full_name, email)
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ])

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const { data: monthOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', startOfMonth.toISOString())
        .eq('payment_status', 'paid')

      const monthlyRevenue = (monthOrders as Array<{ total_amount: number }> | null)?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

      setStats({
        todayOrders: todayCount || 0,
        pendingOrders: pendingCount || 0,
        activeEquipment: equipmentCount || 0,
        monthlyRevenue,
      })
      setRecentOrders(orders as Order[] || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  const statCards = [
    { label: '今日订单', value: stats.todayOrders, icon: Calendar, color: 'bg-blue-500', href: '/calendar' },
    { label: '待处理订单', value: stats.pendingOrders, icon: Clock, color: 'bg-yellow-500', href: '/orders' },
    { label: '可用器材', value: stats.activeEquipment, icon: Camera, color: 'bg-green-500', href: '/equipment' },
    { label: '本月收入', value: formatCurrency(stats.monthlyRevenue), icon: DollarSign, color: 'bg-purple-500', href: '/admin' },
  ]

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          欢迎回来，{profile?.full_name || profile?.email}
        </h1>
        <p className="text-gray-600 mt-1">
          今天是 {formatDate(new Date(), 'yyyy年MM月dd日 EEEE')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={isStaff || card.href !== '/admin' ? card.href : '/dashboard'}
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">最近订单</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500">暂无订单</div>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="p-4 hover:bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary-100 p-2 rounded-lg">
                      <Package className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.order_number}</p>
                      <p className="text-sm text-gray-500">
                        {order.studio?.name} · {formatDate(order.start_time)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(order.total_amount)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h3>
            <div className="space-y-3">
              <Link
                href="/orders/new"
                className="flex items-center p-3 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100"
              >
                <Calendar className="h-5 w-5 mr-3" />
                新建预约
              </Link>
              <Link
                href="/equipment"
                className="flex items-center p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <Camera className="h-5 w-5 mr-3" />
                查看器材
              </Link>
              <Link
                href="/notifications"
                className="flex items-center p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <Bell className="h-5 w-5 mr-3" />
                通知中心
              </Link>
              {isStaff && (
                <Link
                  href="/admin"
                  className="flex items-center p-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <FileText className="h-5 w-5 mr-3" />
                  管理后台
                </Link>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">待办提醒</h3>
            <div className="space-y-3">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{stats.pendingOrders} 个订单待确认</p>
                  <p className="text-xs text-gray-500">请及时处理</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
