'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import { formatCurrency, formatDate, getStatusText } from '@/lib/utils'
import { processNotificationQueue } from '@/lib/notification-service'
import { Loader2, RefreshCw, Users, Camera, DollarSign, AlertTriangle, Bell, Settings } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { Database } from '@/types/database'

type NotificationQueue = Database['public']['Tables']['notification_queue']['Row']
type DamageRecord = Database['public']['Tables']['damage_records']['Row'] & {
  order: { order_number: string } | null
  equipment: { name: string } | null
  responsible_party: { full_name: string | null } | null
}

export default function AdminPage() {
  const { profile } = useAuth()
  const [notificationQueue, setNotificationQueue] = useState<NotificationQueue[]>([])
  const [damageRecords, setDamageRecords] = useState<DamageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [processingQueue, setProcessingQueue] = useState(false)
  const supabase = createClient()

  const isStaff = profile?.role === 'staff' || profile?.role === 'admin'

  useEffect(() => {
    if (!isStaff) return
    fetchData()
  }, [isStaff])

  const fetchData = async () => {
    const [{ data: queue }, { data: damages }] = await Promise.all([
      supabase
        .from('notification_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('damage_records')
        .select(`
          *,
          order:orders(order_number),
          equipment:equipment(name),
          responsible_party:profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    setNotificationQueue(queue || [])
    setDamageRecords(damages as DamageRecord[] || [])
    setLoading(false)
  }

  const handleProcessQueue = async () => {
    setProcessingQueue(true)
    try {
      const result = await processNotificationQueue()
      alert(`处理完成：${result.processed} 条通知`)
      fetchData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setProcessingQueue(false)
    }
  }

  if (!isStaff) {
    return (
      <div className="text-center py-12">
        <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900">无权访问</h2>
        <p className="text-gray-500">只有店员和管理员可以访问此页面</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const queueStats = {
    pending: notificationQueue.filter(n => n.status === 'pending').length,
    failed: notificationQueue.filter(n => n.status === 'failed').length,
    sent: notificationQueue.filter(n => n.status === 'sent').length,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-yellow-500 p-3 rounded-lg">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">待发送通知</p>
              <p className="text-2xl font-bold text-gray-900">{queueStats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-500 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">发送失败</p>
              <p className="text-2xl font-bold text-gray-900">{queueStats.failed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">已发送</p>
              <p className="text-2xl font-bold text-gray-900">{queueStats.sent}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-orange-500 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">未处理损坏</p>
              <p className="text-2xl font-bold text-gray-900">
                {damageRecords.filter(d => !d.resolved).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">通知队列</h2>
            <button
              onClick={handleProcessQueue}
              disabled={processingQueue}
              className="flex items-center px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${processingQueue ? 'animate-spin' : ''}`} />
              处理队列
            </button>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {notificationQueue.length === 0 ? (
              <div className="p-6 text-center text-gray-500">暂无队列数据</div>
            ) : (
              notificationQueue.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.subject}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {item.channel.toUpperCase()} · {item.recipient}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        重试：{item.retry_count}/{item.max_retries}
                        {item.last_error && ` · 错误：${item.last_error}`}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">损坏记录</h2>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {damageRecords.length === 0 ? (
              <div className="p-6 text-center text-gray-500">暂无损坏记录</div>
            ) : (
              damageRecords.map((record) => (
                <div key={record.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {record.equipment?.name || '未知器材'}
                      </p>
                      <p className="text-sm text-gray-600">{record.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        订单：{record.order?.order_number || '未知'} · 
                        责任人：{record.responsible_party?.full_name || '未知'}
                        {record.repair_cost && ` · 维修费：${formatCurrency(record.repair_cost)}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <StatusBadge status={record.severity} />
                      {record.resolved ? (
                        <span className="text-xs text-green-600">已处理</span>
                      ) : (
                        <span className="text-xs text-yellow-600">待处理</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
