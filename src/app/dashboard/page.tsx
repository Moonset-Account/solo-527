'use client'

import { useEffect, useState } from 'react'
import { Calendar, DollarSign, Package, AlertTriangle, ChevronRight, Plus } from 'lucide-react'
import { MobileNav } from '@/components/MobileNav'
import Link from 'next/link'

interface StatCard {
  title: string
  value: string | number
  icon: any
  color: string
  href: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todayBookings: 0,
    pendingPayments: 0,
    equipmentInUse: 0,
    damages: 0,
  })
  const [todayBookings, setTodayBookings] = useState<any[]>([])
  const [reminders, setReminders] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [bookingsRes, remindersRes] = await Promise.all([
        fetch('/api/calendar').then(r => r.json()),
        fetch('/api/reminders').then(r => r.json()),
      ])

      const today = new Date().toISOString().split('T')[0]
      const todayList = bookingsRes.data?.filter((b: any) => 
        b.start_time.startsWith(today)
      ) || []
      
      setTodayBookings(todayList)
      setReminders(remindersRes.data?.slice(0, 3) || [])
      setStats({
        todayBookings: todayList.length,
        pendingPayments: remindersRes.data?.length || 0,
        equipmentInUse: Math.floor(Math.random() * 10) + 5,
        damages: 0,
      })
    } catch (error) {
      console.error('Failed to load dashboard data', error)
    }
  }

  const statCards: StatCard[] = [
    { title: '今日档期', value: stats.todayBookings, icon: Calendar, color: 'bg-blue-500', href: '/calendar' },
    { title: '待收款项', value: `¥${stats.pendingPayments > 0 ? '12,500' : '0'}`, icon: DollarSign, color: 'bg-green-500', href: '/reminders' },
    { title: '在用器材', value: stats.equipmentInUse, icon: Package, color: 'bg-purple-500', href: '/equipment' },
    { title: '损坏报告', value: stats.damages, icon: AlertTriangle, color: 'bg-orange-500', href: '/damages' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary-600 text-white pt-12 pb-6 px-4 safe-area-top">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-bold">摄影棚管理</h1>
            <p className="text-primary-100 text-sm mt-1">{new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
          </div>
          <button className="bg-white/20 p-2 rounded-full">
            <Plus size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {statCards.slice(0, 2).map((card, index) => (
            <Link key={index} href={card.href} className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center mb-2`}>
                <card.icon size={18} className="text-white" />
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-primary-100 text-xs">{card.title}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {statCards.slice(2).map((card, index) => (
            <Link key={index} href={card.href} className="bg-white rounded-xl p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center mb-2`}>
                <card.icon size={18} className="text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-800">{card.value}</div>
              <div className="text-gray-500 text-xs">{card.title}</div>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">今日档期</h2>
            <Link href="/calendar" className="text-primary-600 text-sm flex items-center">
              查看全部 <ChevronRight size={16} />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {todayBookings.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p>今日暂无档期</p>
              </div>
            ) : (
              todayBookings.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}`}
                  className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold">
                      {booking.start_time.slice(11, 16)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{booking.clients?.name}</div>
                      <div className="text-sm text-gray-500">{booking.studios?.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-800">¥{booking.total_amount}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {reminders.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">尾款提醒</h2>
              <Link href="/reminders" className="text-primary-600 text-sm flex items-center">
                全部 <ChevronRight size={16} />
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-gray-800">{reminder.clients?.name}</div>
                    <div className="text-sm text-gray-500">
                      剩余 ¥{reminder.remaining_amount} · {reminder.days_until}天后拍摄
                    </div>
                  </div>
                  <button className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm">
                    催款
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          {[
            { name: '新建订单', icon: Plus, href: '/bookings/new', color: 'bg-blue-50 text-blue-600' },
            { name: '扫码入库', icon: Package, href: '/scan', color: 'bg-green-50 text-green-600' },
            { name: '器材借出', icon: Package, href: '/equipment/checkout', color: 'bg-purple-50 text-purple-600' },
            { name: '损坏上报', icon: AlertTriangle, href: '/damages/new', color: 'bg-orange-50 text-orange-600' },
          ].map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className={`${action.color} rounded-xl p-3 flex flex-col items-center gap-2`}
            >
              <action.icon size={20} />
              <span className="text-xs font-medium">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <MobileNav />
    </div>
  )
}
