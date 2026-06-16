'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check } from 'lucide-react'
import { markNotificationRead } from '@/app/actions'
import { useActionState } from 'react'
import StatusBadge from './StatusBadge'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  status: string
  createdAt: string
}

export default function NotificationCenter({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length

  const [, markReadAction] = useActionState(markNotificationRead, { success: false })

  const handleMarkAllRead = async () => {
    const formData = new FormData()
    formData.append('markAll', 'true')
    await markReadAction(formData)
    setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })))
  }

  const handleMarkRead = async (id: string) => {
    const formData = new FormData()
    formData.append('id', id)
    await markReadAction(formData)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'READ' } : n))
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/notifications')
        const data = await res.json()
        if (data.success) {
          setNotifications(data.data)
        }
      } catch (e) {
        console.error('Failed to fetch notifications')
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">通知中心</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>全部已读</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                暂无新通知
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      notification.status === 'UNREAD' ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleMarkRead(notification.id)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <StatusBadge status={notification.type} type="notification" />
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{notification.title}</h4>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
