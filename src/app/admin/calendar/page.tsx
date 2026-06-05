'use client'

import { AdminLayout } from '@/components/AdminLayout'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const mockBookings = [
  { id: '1', title: '张三 - A棚', start: '2024-01-15T09:00:00', end: '2024-01-15T18:00:00', color: 'bg-blue-500' },
  { id: '2', title: '李四公司 - B棚', start: '2024-01-15T14:00:00', end: '2024-01-15T20:00:00', color: 'bg-green-500' },
  { id: '3', title: '王五公司 - A棚', start: '2024-01-16T09:00:00', end: '2024-01-16T17:00:00', color: 'bg-purple-500' },
  { id: '4', title: '赵六 - C棚', start: '2024-01-17T10:00:00', end: '2024-01-17T16:00:00', color: 'bg-orange-500' },
]

export default function AdminCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 0, 15))

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">档期日历</h1>
          <p className="text-gray-500 mt-1">查看和管理所有档期</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
            </h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-2" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const hasBooking = [15, 16, 17].includes(day)
              const isToday = day === currentDate.getDate()

              return (
                <div
                  key={day}
                  className={`aspect-square p-2 rounded-lg border ${
                    isToday ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-300'
                  } cursor-pointer`}
                >
                  <div className={`text-sm ${isToday ? 'text-primary-600 font-semibold' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  {hasBooking && (
                    <div className="mt-1 h-1.5 bg-blue-500 rounded-full" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">今日档期</h3>
          <div className="space-y-3">
            {mockBookings.map(booking => (
              <div key={booking.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className={`w-1 h-12 ${booking.color} rounded-full`} />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{booking.title}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(booking.start).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
