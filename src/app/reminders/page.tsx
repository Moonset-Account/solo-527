'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Bell, Phone, Mail, Send, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { MobileNav } from '@/components/MobileNav'
import { PaymentStatusBadge } from '@/components/StatusBadges'

export default function RemindersPage() {
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingIds, setSendingIds] = useState<string[]>([])

  useEffect(() => {
    loadReminders()
  }, [])

  async function loadReminders() {
    try {
      const res = await fetch('/api/reminders')
      const data = await res.json()
      setReminders(data.data || [])
    } catch (error) {
      console.error('Load reminders error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function sendReminder(id: string, method: 'sms' | 'email' | 'wechat') {
    setSendingIds(prev => [...prev, id])
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSendingIds(prev => prev.filter(i => i !== id))
    setReminders(prev => prev.map(r => 
      r.id === id ? { ...r, last_reminded: new Date().toISOString() } : r
    ))
  }

  async function sendBatchReminders() {
    const ids = reminders.filter(r => r.days_until <= 3).map(r => r.id)
    setSendingIds(ids)
    
    try {
      await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days_threshold: 7 }),
      })
    } catch (error) {
      console.error('Send batch reminders error:', error)
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSendingIds([])
  }

  const urgentReminders = reminders.filter(r => r.days_until <= 3)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center px-4 py-3 gap-3">
          <Link href="/dashboard" className="p-1 -ml-1">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-800">尾款提醒</h1>
            <p className="text-xs text-gray-500">共 {reminders.length} 笔待收款</p>
          </div>
          {urgentReminders.length > 0 && (
            <button
              onClick={sendBatchReminders}
              disabled={sendingIds.length > 0}
              className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send size={14} />
              一键催款
            </button>
          )}
        </div>
      </div>

      {urgentReminders.length > 0 && (
        <div className="mx-4 mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Bell size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-orange-800">紧急提醒</p>
              <p className="text-sm text-orange-600 mt-1">
                有 {urgentReminders.length} 笔订单将在 3 天内拍摄，需尽快催收尾款
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <Bell size={32} className="mx-auto mb-2 opacity-50" />
            <p>加载中...</p>
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">太棒了！</p>
            <p className="text-sm mt-1">暂无待收款项</p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className={`bg-white rounded-xl shadow-sm p-4 ${
                reminder.days_until <= 3 ? 'border-l-4 border-orange-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium text-gray-800">{reminder.clients?.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {reminder.booking_no}
                  </div>
                </div>
                <PaymentStatusBadge status={reminder.payment_status} />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                <div>
                  <div className="text-gray-500 text-xs">总金额</div>
                  <div className="font-medium text-gray-800">¥{reminder.total_amount}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">已付</div>
                  <div className="font-medium text-green-600">¥{reminder.paid_amount}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs">剩余</div>
                  <div className="font-medium text-orange-600">¥{reminder.remaining_amount}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  拍摄时间：{reminder.start_time?.slice(0, 10)}
                  {reminder.days_until <= 3 && (
                    <span className="ml-2 text-orange-600 font-medium">
                      （{reminder.days_until}天后）
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => sendReminder(reminder.id, 'sms')}
                  disabled={sendingIds.includes(reminder.id)}
                  className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-blue-100 disabled:opacity-50"
                >
                  <Phone size={14} />
                  短信
                </button>
                <button
                  onClick={() => sendReminder(reminder.id, 'wechat')}
                  disabled={sendingIds.includes(reminder.id)}
                  className="flex-1 bg-green-50 text-green-600 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-green-100 disabled:opacity-50"
                >
                  <Mail size={14} />
                  微信
                </button>
                <button
                  onClick={() => sendReminder(reminder.id, 'email')}
                  disabled={sendingIds.includes(reminder.id)}
                  className="flex-1 bg-purple-50 text-purple-600 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-purple-100 disabled:opacity-50"
                >
                  <Mail size={14} />
                  邮件
                </button>
              </div>

              {reminder.last_reminded && (
                <div className="text-xs text-gray-400 mt-2 text-center">
                  上次提醒：{new Date(reminder.last_reminded).toLocaleString('zh-CN')}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <MobileNav />
    </div>
  )
}
