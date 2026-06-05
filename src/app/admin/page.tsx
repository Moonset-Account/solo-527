'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import {
  DollarSign,
  Calendar,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
} from 'lucide-react'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyBookings: 0,
    equipmentCount: 0,
    clientCount: 0,
    revenueGrowth: 0,
    bookingsGrowth: 0,
  })
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [pendingPayments, setPendingPayments] = useState<any[]>([])
  const [equipmentStatus, setEquipmentStatus] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setStats({
        totalRevenue: 128500,
        monthlyBookings: 42,
        equipmentCount: 56,
        clientCount: 128,
        revenueGrowth: 12.5,
        bookingsGrowth: 8.3,
      })

      setRecentBookings([
        { id: '1', booking_no: 'BK202401150001', client: '张三', studio: 'A棚', amount: 1500, status: 'confirmed', time: '2小时前' },
        { id: '2', booking_no: 'BK202401150002', client: '李四', studio: 'B棚', amount: 3000, status: 'in_progress', time: '30分钟前' },
        { id: '3', booking_no: 'BK202401150003', client: '王五公司', studio: 'A棚', amount: 4500, status: 'pending', time: '5分钟前' },
      ])

      setPendingPayments([
        { id: '1', booking_no: 'BK20240110001', client: '赵六', remaining: 2500, days_until: 3 },
        { id: '2', booking_no: 'BK20240112001', client: '孙七公司', remaining: 5000, days_until: 5 },
      ])

      setEquipmentStatus([
        { status: 'available', count: 38, label: '可用' },
        { status: 'rented', count: 15, label: '已出租' },
        { status: 'maintenance', count: 2, label: '维护中' },
        { status: 'damaged', count: 1, label: '损坏' },
      ])
    } catch (error) {
      console.error('Failed to load dashboard data', error)
    }
  }

  const statCards = [
    { title: '本月营收', value: `¥${stats.totalRevenue.toLocaleString()}`, change: `+${stats.revenueGrowth}%`, icon: DollarSign, color: 'bg-green-500', trend: 'up' },
    { title: '本月订单', value: stats.monthlyBookings, change: `+${stats.bookingsGrowth}%`, icon: Calendar, color: 'bg-blue-500', trend: 'up' },
    { title: '器材总数', value: stats.equipmentCount, change: '+2', icon: Package, color: 'bg-purple-500', trend: 'up' },
    { title: '客户数量', value: stats.clientCount, change: '+5', icon: Users, color: 'bg-orange-500', trend: 'up' },
  ]

  const weeklyRevenue = [
    { day: '周一', revenue: 12000 },
    { day: '周二', revenue: 8500 },
    { day: '周三', revenue: 15000 },
    { day: '周四', revenue: 11000 },
    { day: '周五', revenue: 18000 },
    { day: '周六', revenue: 22000 },
    { day: '周日', revenue: 16000 },
  ]

  const maxRevenue = Math.max(...weeklyRevenue.map((d) => d.revenue))

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">管理仪表盘</h1>
          <p className="text-gray-500 mt-1">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-sm text-green-600">{card.change}</span>
                    <span className="text-xs text-gray-400">较上月</span>
                  </div>
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                  <card.icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-gray-800">本周营收趋势</h2>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option>本周</option>
                <option>本月</option>
                <option>本季度</option>
              </select>
            </div>
            <div className="flex items-end gap-3 h-48">
              {weeklyRevenue.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-gray-100 rounded-t-lg relative overflow-hidden" style={{ height: `${(item.revenue / maxRevenue) * 100}%` }}>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg h-full" />
                  </div>
                  <span className="text-xs text-gray-500">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-6">器材状态分布</h2>
            <div className="space-y-4">
              {equipmentStatus.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium text-gray-800">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.status === 'available' ? 'bg-green-500' :
                        item.status === 'rented' ? 'bg-blue-500' :
                        item.status === 'maintenance' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${(item.count / stats.equipmentCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">最近订单</h2>
              <a href="/admin/bookings" className="text-primary-600 text-sm hover:underline">
                查看全部
              </a>
            </div>
            <div className="divide-y divide-gray-100">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">{booking.booking_no}</div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        {booking.client} · {booking.studio}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-800">¥{booking.amount}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{booking.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">待收款项</h2>
              <span className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded-full">
                {pendingPayments.length} 笔待收
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-800">{payment.booking_no}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{payment.client}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-orange-600">¥{payment.remaining}</div>
                      <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 justify-end">
                        <Clock size={12} />
                        {payment.days_until}天后到期
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: '待确认订单', count: 5, icon: Clock, color: 'bg-yellow-50 text-yellow-700' },
            { label: '今日档期', count: 3, icon: Calendar, color: 'bg-blue-50 text-blue-700' },
            { label: '待归还器材', count: 8, icon: Package, color: 'bg-purple-50 text-purple-700' },
            { label: '损坏待处理', count: 1, icon: AlertTriangle, color: 'bg-red-50 text-red-700' },
          ].map((item, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center`}>
                  <item.icon size={24} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{item.count}</div>
                  <div className="text-sm text-gray-500">{item.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
