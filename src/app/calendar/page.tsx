'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar } from '@/components/Calendar'
import { Database } from '@/types/database'
import { Loader2, Plus } from 'lucide-react'
import Link from 'next/link'

type Order = Database['public']['Tables']['orders']['Row'] & {
  studio: { name: string } | null
  customer: { full_name: string | null; email: string } | null
}

export default function CalendarPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchOrders = async () => {
      const startOfMonth = new Date()
      startOfMonth.setMonth(startOfMonth.getMonth() - 1)
      const endOfMonth = new Date()
      endOfMonth.setMonth(endOfMonth.getMonth() + 2)

      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          studio:studios(name),
          customer:profiles(full_name, email)
        `)
        .gte('start_time', startOfMonth.toISOString())
        .lte('start_time', endOfMonth.toISOString())

      setOrders(data as Order[] || [])
      setLoading(false)
    }

    fetchOrders()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">排期日历</h1>
        <Link
          href="/orders/new"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          新建预约
        </Link>
      </div>

      <Calendar
        orders={orders}
        onDateClick={(date) => console.log('Date clicked:', date)}
        onOrderClick={(order) => {
          window.location.href = `/orders/${order.id}`
        }}
      />
    </div>
  )
}
