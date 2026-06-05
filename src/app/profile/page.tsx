'use client'

import { MobileNav } from '@/components/MobileNav'
import { User, Settings, Bell, HelpCircle, Info, ChevronRight, LogOut, Wifi, WifiOff } from 'lucide-react'
import { offlineSync } from '@/lib/offline/syncService'
import { useState, useEffect } from 'react'

export default function ProfilePage() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    loadPendingItems()
    window.addEventListener('offline-queue-updated', loadPendingItems)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('offline-queue-updated', loadPendingItems)
    }
  }, [])

  async function loadPendingItems() {
    try {
      await offlineSync.init()
      const items = await offlineSync.getPendingItems()
      setPendingCount(items.length)
    } catch (error) {
      console.error('Failed to load pending items', error)
    }
  }

  async function syncData() {
    try {
      await offlineSync.init()
      const result = await offlineSync.processQueue()
      alert(`同步完成：成功 ${result.synced} 条，失败 ${result.failed} 条`)
      loadPendingItems()
    } catch (error) {
      console.error('Sync failed', error)
      alert('同步失败，请稍后重试')
    }
  }

  const menuItems = [
    { icon: Bell, label: '消息通知', badge: 3, href: '/notifications' },
    { icon: Settings, label: '系统设置', href: '/settings' },
    { icon: HelpCircle, label: '帮助中心', href: '/help' },
    { icon: Info, label: '关于我们', href: '/about' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-primary-600 text-white pt-12 pb-8 px-4 safe-area-top">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <User size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">王经理</h2>
            <p className="text-primary-100 text-sm">管理员 · 旗舰店</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">42</div>
            <div className="text-primary-100 text-xs">本月订单</div>
          </div>
          <div>
            <div className="text-2xl font-bold">¥12.8w</div>
            <div className="text-primary-100 text-xs">本月营收</div>
          </div>
          <div>
            <div className="text-2xl font-bold">128</div>
            <div className="text-primary-100 text-xs">客户数</div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Wifi size={20} className="text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <WifiOff size={20} className="text-orange-600" />
                </div>
              )}
              <div>
                <div className="font-medium text-gray-800">
                  {isOnline ? '在线' : '离线模式'}
                </div>
                <div className="text-xs text-gray-500">
                  {isOnline 
                    ? pendingCount > 0 
                      ? `${pendingCount} 条数据待同步` 
                      : '数据已同步'
                    : '操作将在联网后自动同步'}
                </div>
              </div>
            </div>
            {pendingCount > 0 && (
              <button
                onClick={syncData}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                立即同步
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="flex items-center justify-between px-4 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className="text-gray-500" />
                <span className="text-gray-800">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            </a>
          ))}
        </div>

        <button className="w-full mt-4 bg-white text-red-500 py-4 rounded-xl shadow-sm font-medium flex items-center justify-center gap-2">
          <LogOut size={20} />
          退出登录
        </button>
      </div>

      <MobileNav />
    </div>
  )
}
