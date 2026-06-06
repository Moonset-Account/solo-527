'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Camera, Bell, LogOut, User, Calendar, Package, Settings, Home } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      const fetchUnread = async () => {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false)
        setUnreadCount(count || 0)
      }
      fetchUnread()
    }
  }, [user])

  if (!user) return null

  const isStaff = profile?.role === 'staff' || profile?.role === 'admin'

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Camera className="h-8 w-8 text-primary-600" />
              <span className="font-bold text-xl text-gray-900">摄影棚管理系统</span>
            </Link>

            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link href="/dashboard" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                <Home className="h-4 w-4 mr-1" />
                首页
              </Link>
              <Link href="/calendar" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                <Calendar className="h-4 w-4 mr-1" />
                排期日历
              </Link>
              <Link href="/orders" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                <Package className="h-4 w-4 mr-1" />
                订单管理
              </Link>
              {isStaff && (
                <>
                  <Link href="/equipment" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                    <Camera className="h-4 w-4 mr-1" />
                    器材管理
                  </Link>
                  <Link href="/admin" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900">
                    <Settings className="h-4 w-4 mr-1" />
                    管理后台
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/notifications" className="relative p-2 text-gray-500 hover:text-gray-700">
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>

            <div className="flex items-center space-x-2">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name || profile?.email}</p>
                <p className="text-xs text-gray-500">{profile?.role === 'customer' ? '客户' : profile?.role === 'staff' ? '店员' : '管理员'}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <LogOut className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
