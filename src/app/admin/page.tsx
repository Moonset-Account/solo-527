'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import { formatCurrency, formatDate, getStatusText } from '@/lib/utils'
import { 
  processNotificationQueue, 
  retryNotification, 
  resetNotificationRetry, 
  deleteNotificationFromQueue 
} from '@/lib/notification-service'
import { 
  Loader2, RefreshCw, Users, Camera, DollarSign, AlertTriangle, Bell, Settings,
  RotateCcw, Trash2, Eye, X, Check
} from 'lucide-react'
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
  const [selectedNotification, setSelectedNotification] = useState<NotificationQueue | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
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
        .limit(50),
      supabase
        .from('damage_records')
        .select(`
          *,
          order:orders(order_number),
          equipment:equipment(name),
          responsible_party:profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20),
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

  const handleRetry = async (id: string) => {
    setActionLoading(id)
    try {
      const result = await retryNotification(id)
      if (result.success) {
        alert('重发成功')
      } else {
        alert(`重发失败：${result.error}`)
      }
      fetchData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleResetRetry = async (id: string) => {
    setActionLoading(id)
    try {
      await resetNotificationRetry(id)
      alert('已重置重试次数')
      fetchData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条通知吗？')) return
    setActionLoading(id)
    try {
      await deleteNotificationFromQueue(id)
      fetchData()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setActionLoading(null)
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
              批量处理
            </button>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {notificationQueue.length === 0 ? (
              <div className="p-6 text-center text-gray-500">暂无队列数据</div>
            ) : (
              notificationQueue.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900 truncate">{item.subject}</p>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {item.channel.toUpperCase()} · {item.recipient}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(item.created_at)} · 重试：{item.retry_count}/{item.max_retries}
                      </p>
                      {item.last_error && (
                        <p className="text-xs text-red-500 mt-1 truncate">
                          错误：{item.last_error}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => setSelectedNotification(item)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="查看详情"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {(item.status === 'failed' || item.status === 'pending') && (
                        <button
                          onClick={() => handleRetry(item.id)}
                          disabled={actionLoading === item.id}
                          className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                          title="立即重试"
                        >
                          {actionLoading === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      {item.status === 'failed' && item.retry_count >= item.max_retries && (
                        <button
                          onClick={() => handleResetRetry(item.id)}
                          disabled={actionLoading === item.id}
                          className="p-1.5 text-yellow-400 hover:text-yellow-600 hover:bg-yellow-50 rounded disabled:opacity-50"
                          title="重置重试次数"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={actionLoading === item.id}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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

      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">通知详情</h3>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">状态</p>
                  <div className="mt-1">
                    <StatusBadge status={selectedNotification.status} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">渠道</p>
                  <p className="font-medium">{selectedNotification.channel.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">接收人</p>
                  <p className="font-medium">{selectedNotification.recipient}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">创建时间</p>
                  <p className="font-medium">{formatDate(selectedNotification.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">重试次数</p>
                  <p className="font-medium">{selectedNotification.retry_count}/{selectedNotification.max_retries}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">最后尝试</p>
                  <p className="font-medium">
                    {selectedNotification.last_attempt_at 
                      ? formatDate(selectedNotification.last_attempt_at) 
                      : '未尝试'}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">主题</p>
                <p className="font-medium mt-1">{selectedNotification.subject}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">内容</p>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap">
                  {selectedNotification.content}
                </div>
              </div>
              
              {selectedNotification.last_error && (
                <div>
                  <p className="text-sm text-gray-500">最后错误</p>
                  <div className="mt-1 p-3 bg-red-50 rounded-lg text-sm text-red-600">
                    {selectedNotification.last_error}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end space-x-2">
              {(selectedNotification.status === 'failed' || selectedNotification.status === 'pending') && (
                <button
                  onClick={() => {
                    handleRetry(selectedNotification.id)
                    setSelectedNotification(null)
                  }}
                  disabled={actionLoading === selectedNotification.id}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                >
                  {actionLoading === selectedNotification.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  立即重试
                </button>
              )}
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
