'use client'

import { useState, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Database } from '@/types/database'

type Order = Database['public']['Tables']['orders']['Row'] & {
  studio: { name: string } | null
  customer: { full_name: string | null; email: string } | null
}

interface CalendarProps {
  orders: Order[]
  onDateClick?: (date: Date) => void
  onOrderClick?: (order: Order) => void
}

export function Calendar({ orders, onDateClick, onOrderClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = startOfWeek(monthStart, { locale: zhCN })
    const endDate = endOfWeek(monthEnd, { locale: zhCN })

    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  const getOrdersForDate = (date: Date) => {
    return orders.filter(order => {
      const orderStart = new Date(order.start_time)
      const orderEnd = new Date(order.end_time)
      const dateStart = new Date(date)
      dateStart.setHours(0, 0, 0, 0)
      const dateEnd = addDays(dateStart, 1)

      return orderStart < dateEnd && orderEnd >= dateStart
    })
  }

  const weekDays = ['一', '二', '三', '四', '五', '六', '日']

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'yyyy年MM月', { locale: zhCN })}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded"
          >
            今天
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b">
        {weekDays.map(day => (
          <div key={day} className="py-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const dayOrders = getOrdersForDate(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isToday = isSameDay(day, new Date())

          return (
            <div
              key={idx}
              onClick={() => onDateClick?.(day)}
              className={cn(
                'min-h-[120px] border-b border-r p-2 cursor-pointer hover:bg-gray-50',
                !isCurrentMonth && 'bg-gray-50',
                idx % 7 === 6 && 'border-r-0'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  'text-sm font-medium',
                  isToday && 'h-6 w-6 rounded-full bg-primary-600 text-white flex items-center justify-center',
                  !isCurrentMonth && 'text-gray-400'
                )}>
                  {format(day, 'd')}
                </span>
                {dayOrders.length > 0 && (
                  <span className="text-xs text-gray-500">{dayOrders.length}单</span>
                )}
              </div>

              <div className="space-y-1">
                {dayOrders.slice(0, 3).map(order => (
                  <div
                    key={order.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onOrderClick?.(order)
                    }}
                    className={cn(
                      'text-xs p-1 rounded truncate',
                      order.status === 'confirmed' && 'bg-blue-100 text-blue-800',
                      order.status === 'in_progress' && 'bg-green-100 text-green-800',
                      order.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                      order.status === 'completed' && 'bg-gray-100 text-gray-800'
                    )}
                  >
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(order.start_time), 'HH:mm')}
                    </div>
                    <span className="truncate">{order.studio?.name || '未知棚位'}</span>
                  </div>
                ))}
                {dayOrders.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayOrders.length - 3} 更多
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
