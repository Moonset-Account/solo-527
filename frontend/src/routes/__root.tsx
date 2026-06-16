import { createRootRoute, Outlet, Link, useLocation } from '@tanstack/react-router'
import { useState } from 'react'

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

function RootComponent() {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isAdminPath = location.pathname.startsWith('/admin')

  const navItems = isAdminPath ? adminNavItems : frontNavItems

  const currentPageTitle = pageTitles[location.pathname] || '页面'

  return (
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
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-gray-800">{currentPageTitle}</h2>
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              🔔
            </button>
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})
