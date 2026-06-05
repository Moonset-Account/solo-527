'use client'

import { AdminLayout } from '@/components/AdminLayout'
import { ClipboardList, Search, Filter } from 'lucide-react'
import Link from 'next/link'

const mockBookings = [
  { id: '1', booking_no: 'BK202401150001', client: '张三', studio: 'A棚', amount: 1500, status: 'confirmed', start_time: '2024-01-15T09:00:00' },
  { id: '2', booking_no: 'BK202401150002', client: '李四公司', studio: 'B棚', amount: 3000, status: 'in_progress', start_time: '2024-01-15T14:00:00' },
  { id: '3', booking_no: 'BK202401150003', client: '王五公司', studio: 'A棚', amount: 4500, status: 'pending', start_time: '2024-01-16T09:00:00' },
  { id: '4', booking_no: 'BK202401160001', client: '赵六', studio: 'C棚', amount: 2000, status: 'draft', start_time: '2024-01-16T13:00:00' },
  { id: '5', booking_no: 'BK202401120001', client: '孙七公司', studio: 'A棚', amount: 5000, status: 'completed', start_time: '2024-01-12T10:00:00' },
]

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-700' },
  pending: { label: '待确认', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: '进行中', color: 'bg-purple-100 text-purple-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' },
}

export default function AdminBookingsPage() {
  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">订单管理</h1>
            <p className="text-gray-500 mt-1">管理所有订单和档期</p>
          </div>
          <Link href="/bookings/new" className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors">
            新建订单
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索订单号、客户名称"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
              <Filter size={18} />
              筛选
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">客户</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">棚位</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">开始时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 font-medium text-primary-600">{booking.booking_no}</td>
                    <td className="px-6 py-4 text-gray-800">{booking.client}</td>
                    <td className="px-6 py-4 text-gray-600">{booking.studio}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">¥{booking.amount}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(booking.start_time).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[booking.status]?.color}`}>
                        {statusConfig[booking.status]?.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
