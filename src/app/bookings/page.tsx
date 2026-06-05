'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Plus, ChevronRight } from 'lucide-react'
import { MobileNav } from '@/components/MobileNav'
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/StatusBadges'
import Link from 'next/link'

export default function BookingsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBookings()
  }, [statusFilter])

  async function loadBookings() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      
      const res = await fetch(`/api/bookings?${params}`)
      const data = await res.json()
      setBookings(data.data || mockBookings)
    } catch (error) {
      setBookings(mockBookings)
    } finally {
      setLoading(false)
    }
  }

  const mockBookings = [
    {
      id: '1',
      booking_no: 'BK202401150001',
      status: 'confirmed',
      payment_status: 'deposit_paid',
      start_time: '2024-01-15T09:00:00',
      end_time: '2024-01-15T12:00:00',
      total_amount: 1500,
      clients: { name: '张三', phone: '138****1234' },
      studios: { name: 'A棚' },
    },
    {
      id: '2',
      booking_no: 'BK202401150002',
      status: 'in_progress',
      payment_status: 'paid',
      start_time: '2024-01-15T14:00:00',
      end_time: '2024-01-15T18:00:00',
      total_amount: 3000,
      clients: { name: '李四', phone: '139****5678' },
      studios: { name: 'B棚' },
    },
    {
      id: '3',
      booking_no: 'BK202401140003',
      status: 'completed',
      payment_status: 'paid',
      start_time: '2024-01-14T10:00:00',
      end_time: '2024-01-14T16:00:00',
      total_amount: 4500,
      clients: { name: '王五公司', phone: '137****9012' },
      studios: { name: 'A棚' },
    },
    {
      id: '4',
      booking_no: 'BK202401160004',
      status: 'pending',
      payment_status: 'unpaid',
      start_time: '2024-01-16T09:00:00',
      end_time: '2024-01-16T17:00:00',
      total_amount: 6000,
      clients: { name: '赵六', phone: '136****3456' },
      studios: { name: 'C棚' },
    },
    {
      id: '5',
      booking_no: 'BK202401130005',
      status: 'cancelled',
      payment_status: 'refunded',
      start_time: '2024-01-13T10:00:00',
      end_time: '2024-01-13T15:00:00',
      total_amount: 2000,
      clients: { name: '孙七', phone: '135****7890' },
      studios: { name: 'B棚' },
    },
  ]

  const displayBookings = bookings.length > 0 ? bookings : mockBookings

  const statusFilters = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待确认' },
    { value: 'confirmed', label: '已确认' },
    { value: 'in_progress', label: '进行中' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
  ]

  const filteredBookings = displayBookings.filter((b) => {
    if (search && !b.clients.name.includes(search) && !b.booking_no.includes(search)) {
      return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm safe-area-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-800">订单管理</h1>
            <Link
              href="/bookings/new"
              className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
            >
              <Plus size={16} />
              新建
            </Link>
          </div>

          <div className="relative mb-3">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户名称或订单号"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {filteredBookings.map((booking) => (
          <Link
            key={booking.id}
            href={`/bookings/${booking.id}`}
            className="bg-white rounded-xl shadow-sm p-4 block"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-semibold text-gray-800">{booking.booking_no}</div>
                <div className="text-sm text-gray-500 mt-0.5">{booking.clients.name}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="font-semibold text-gray-800">¥{booking.total_amount}</div>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <span>{booking.studios.name}</span>
              <span>·</span>
              <span>
                {new Date(booking.start_time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                {' '}
                {booking.start_time.slice(11, 16)}-{booking.end_time.slice(11, 16)}
              </span>
            </div>

            <div className="flex gap-2">
              <BookingStatusBadge status={booking.status} />
              <PaymentStatusBadge status={booking.payment_status} />
            </div>
          </Link>
        ))}
      </div>

      <MobileNav />
    </div>
  )
}
