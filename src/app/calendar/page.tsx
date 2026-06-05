'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { MobileNav } from '@/components/MobileNav'
import { BookingStatusBadge, PaymentStatusBadge } from '@/components/StatusBadges'
import Link from 'next/link'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [bookings, setBookings] = useState<any[]>([])

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Date[] = []

    const firstDayOfWeek = firstDay.getDay()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i))
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i))
    }

    return days
  }, [currentDate])

  const filteredBookings = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0]
    return bookings.filter((b) => b.start_time.startsWith(dateStr))
  }, [bookings, selectedDate])

  const mockBookings = [
    {
      id: '1',
      booking_no: 'BK202401150001',
      start_time: `${new Date().toISOString().split('T')[0]}T09:00:00`,
      end_time: `${new Date().toISOString().split('T')[0]}T12:00:00`,
      status: 'confirmed',
      payment_status: 'deposit_paid',
      total_amount: 1500,
      clients: { name: '张三' },
      studios: { name: 'A棚 - 无影墙' },
    },
    {
      id: '2',
      booking_no: 'BK202401150002',
      start_time: `${new Date().toISOString().split('T')[0]}T14:00:00`,
      end_time: `${new Date().toISOString().split('T')[0]}T18:00:00`,
      status: 'confirmed',
      payment_status: 'paid',
      total_amount: 3000,
      clients: { name: '李四' },
      studios: { name: 'B棚 - 实景棚' },
    },
    {
      id: '3',
      booking_no: 'BK202401150003',
      start_time: `${new Date().toISOString().split('T')[0]}T10:00:00`,
      end_time: `${new Date().toISOString().split('T')[0]}T16:00:00`,
      status: 'in_progress',
      payment_status: 'paid',
      total_amount: 4500,
      clients: { name: '王五公司' },
      studios: { name: 'A棚 - 无影墙' },
    },
  ]

  const displayBookings = filteredBookings.length > 0 ? filteredBookings : mockBookings

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const hasBooking = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return mockBookings.some((b) => b.start_time.startsWith(dateStr))
  }

  const weekDays = ['一', '二', '三', '四', '五', '六', '日']

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10 safe-area-top">
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={prevMonth} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold">
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </h1>
          <button onClick={nextMonth} className="p-2 -mr-2 rounded-full hover:bg-gray-100">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs text-gray-500 pb-2">
          {weekDays.map((day) => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 text-center pb-2">
          {calendarDays.map((date, index) => (
            <button
              key={index}
              onClick={() => setSelectedDate(date)}
              className={`py-2 mx-1 rounded-lg text-sm transition-colors relative ${
                isSelected(date)
                  ? 'bg-primary-600 text-white'
                  : isToday(date)
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : isCurrentMonth(date)
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-gray-300'
              }`}
            >
              {date.getDate()}
              {hasBooking(date) && (
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                  isSelected(date) ? 'bg-white' : 'bg-primary-500'
                }`} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-800">
            {selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </h2>
          <Link
            href="/bookings/new"
            className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
          >
            <Plus size={16} />
            新建
          </Link>
        </div>

        <div className="space-y-3">
          {displayBookings.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-400">
              当日无档期
            </div>
          ) : (
            displayBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/bookings/${booking.id}`}
                className="bg-white rounded-xl shadow-sm p-4 block"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 bg-primary-500 rounded-full h-12" />
                    <div>
                      <div className="text-sm text-gray-500">
                        {booking.start_time.slice(11, 16)} - {booking.end_time.slice(11, 16)}
                      </div>
                      <div className="font-medium text-gray-800">{booking.clients.name}</div>
                      <div className="text-sm text-gray-500">{booking.studios.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">¥{booking.total_amount}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <BookingStatusBadge status={booking.status} />
                  <PaymentStatusBadge status={booking.payment_status} />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <MobileNav />
    </div>
  )
}
