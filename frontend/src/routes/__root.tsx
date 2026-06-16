import { createRootRoute, Outlet, Link, useLocation } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { authApi } from '../lib/api'
import type { User } from '../lib/types'

const frontNavItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/content', label: '播客内容', icon: '🎧' },
  { path: '/membership', label: '会员订阅', icon: '💎' },
]

const adminNavItems = [
  { path: '/admin', label: '数据看板', icon: '📊' },
  { path: '/admin/retention', label: '付费留存', icon: '📈' },
  { path: '/admin/subscriptions', label: '订阅管理', icon: '💳' },
  { path: '/admin/materials', label: '素材授权', icon: '🎬' },
  { path: '/admin/orders', label: '订单节点', icon: '📦' },
  { path: '/admin/exceptions', label: '异常池', icon: '⚠️' },
  { path: '/admin/features', label: '功能开关', icon: '🔧' },
  { path: '/admin/rules', label: '规则版本', icon: '📋' },
]

const pageTitles: Record<string, string> = {
  '/': '首页',
  '/content': '播客内容',
  '/membership': '会员订阅',
  '/admin': '数据看板',
  '/admin/retention': '付费留存',
  '/admin/subscriptions': '订阅管理',
  '/admin/materials': '素材授权',
  '/admin/orders': '订单节点',
  '/admin/exceptions': '异常池',
  '/admin/features': '功能开关',
  '/admin/rules': '规则版本',
}

function HeaderContent({ currentPageTitle }: { currentPageTitle: string }) {
  const { user, membershipStatus, login } = useAuth()
  const [userList, setUserList] = useState<User[]>([])
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [switchingUser, setSwitchingUser] = useState(false)

  useEffect(() => {
    fetchUserList()
  }, [])

  const fetchUserList = async () => {
    try {
      const data = await authApi.getUserList()
      setUserList(data.users)
    } catch (error) {
      console.error('Failed to fetch user list:', error)
      const mockUsers: User[] = [
        { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'member', createdAt: '' },
        { id: 2, name: '李四', email: 'lisi@example.com', role: 'member', createdAt: '' },
        { id: 3, name: '王五', email: 'wangwu@example.com', role: 'member', createdAt: '' },
        { id: 4, name: '赵六', email: 'zhaoliu@example.com', role: 'member', createdAt: '' },
        { id: 5, name: '管理员', email: 'admin@podcast.com', role: 'admin', createdAt: '' },
      ]
      setUserList(mockUsers)
    }
  }

  const handleUserSwitch = async (userId: number) => {
    setSwitchingUser(true)
    try {
      await login(userId)
      setShowUserMenu(false)
    } catch (error) {
      console.error('Failed to switch user:', error)
      alert('切换用户失败')
    } finally {
      setSwitchingUser(false)
    }
  }

  const getMembershipBadge = () => {
    switch (membershipStatus) {
      case 'active':
        return (
          <Link
            to="/membership"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-full hover:bg-green-100 transition-colors"
          >
            <span>💎</span>
            <span>会员</span>
          </Link>
        )
      case 'expired':
        return (
          <Link
            to="/membership"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-medium rounded-full hover:bg-orange-100 transition-colors"
          >
            <span>⏰</span>
            <span>已过期</span>
          </Link>
        )
      case 'loading':
        return (
          <div className="px-3 py-1.5 bg-gray-100 text-gray-400 text-xs font-medium rounded-full">
            加载中...
          </div>
        )
      default:
        return (
          <Link
            to="/membership"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full hover:bg-gray-200 transition-colors"
          >
            <span>🔓</span>
            <span>开通会员</span>
          </Link>
        )
    }
  }

  const getUserInitial = (name: string) => {
    return name.charAt(0).toUpperCase()
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-gray-800">{currentPageTitle}</h2>
      <div className="flex items-center gap-4">
        {getMembershipBadge()}
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
          🔔
        </button>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pr-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={switchingUser}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {user ? getUserInitial(user.name) : '?'}
            </div>
            <span className="text-sm text-gray-700 font-medium">
              {switchingUser ? '切换中...' : user ? user.name : '未登录'}
            </span>
            <span className="text-gray-400 text-xs">▼</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  切换用户
                </p>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {userList.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleUserSwitch(u.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        user?.id === u.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {getUserInitial(u.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      {user?.id === u.id && (
                        <span className="text-blue-500">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function RootComponent() {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isAdminPath = location.pathname.startsWith('/admin')

  const navItems = isAdminPath ? adminNavItems : frontNavItems

  const currentPageTitle = pageTitles[location.pathname] || '页面'

  return (
    <AuthProvider>
      <div className="flex h-screen bg-gray-50">
        <aside
          className={`${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}
        >
          <div className="h-16 flex items-center justify-center border-b border-gray-200">
            {sidebarCollapsed ? (
            <span className="text-2xl">🎙️</span>
          ) : (
            <h1 className="text-xl font-bold text-gray-800">播客收入看板</h1>
          )}
          </div>

          <nav className="flex-1 py-4 overflow-y-auto">
            <div className="px-4 mb-2">
              <p
                className={`text-xs font-semibold text-gray-400 uppercase tracking-wider ${
                  sidebarCollapsed ? 'text-center' : ''
                }`}
              >
                {sidebarCollapsed ? '···' : isAdminPath ? '后台管理' : '前台页面'}
              </p>
            </div>
            <ul className="mt-2 space-y-1 px-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {!sidebarCollapsed && (
              <div className="mt-6 px-4">
                <div className="border-t border-gray-200 pt-4">
                  <Link
                    to={isAdminPath ? '/' : '/admin'}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    <span className="text-lg">{isAdminPath ? '🏠' : '⚙️'}</span>
                    <span>{isAdminPath ? '返回前台' : '后台管理'}</span>
                  </Link>
                </div>
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarCollapsed ? '→' : '← 收起菜单'}
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <HeaderContent currentPageTitle={currentPageTitle} />

          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})
