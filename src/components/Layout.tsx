import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Map,
  Sprout,
  ClipboardList,
  Scissors,
  Package,
  Truck,
  FileText,
  Settings,
  Shield,
  FileSearch,
  Download,
  AlertTriangle,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronDown,
  MoreHorizontal,
  TreePine,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
  children?: { label: string; path: string; icon: React.ElementType }[]
}

const navItems: NavItem[] = [
  { label: '仪表盘', path: '/', icon: LayoutDashboard },
  { label: '地块管理', path: '/plots', icon: Map },
  { label: '品种管理', path: '/varieties', icon: Sprout },
  { label: '农事记录', path: '/farm-records', icon: ClipboardList },
  { label: '采收记录', path: '/harvests', icon: Scissors },
  { label: '分拣订单', path: '/sorting-orders', icon: Package },
  { label: '订单履约', path: '/orders', icon: Truck },
  { label: '申报材料', path: '/declarations', icon: FileText },
  {
    label: '系统管理',
    path: '/admin',
    icon: Settings,
    children: [
      { label: '角色权限', path: '/admin/roles', icon: Shield },
      { label: '操作日志', path: '/admin/logs', icon: FileSearch },
      { label: '数据导出', path: '/admin/export', icon: Download },
      { label: '异常提醒', path: '/admin/alerts', icon: AlertTriangle },
    ],
  },
]

const mobileTabItems = navItems.slice(0, 4).concat({ label: '更多', path: '/more', icon: MoreHorizontal })

function SidebarNavItem({ item, collapsed, onClose }: { item: NavItem; collapsed: boolean; onClose?: () => void }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const isActive = item.path === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(item.path)
  const isChildActive = item.children?.some((c) => location.pathname.startsWith(c.path))

  useEffect(() => {
    if (isChildActive) setOpen(true)
  }, [isChildActive])

  const link = (
    <NavLink
      to={item.path === '/' ? '/' : item.path}
      end={item.path === '/'}
      onClick={() => {
        if (item.children) setOpen(!open)
        else onClose?.()
      }}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
        isActive && !item.children
          ? 'bg-primary-700 text-white'
          : isChildActive
          ? 'bg-primary-50 text-primary-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && <span className="flex-1">{item.label}</span>}
      {!collapsed && item.children && (
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      )}
    </NavLink>
  )

  if (!item.children) return link

  return (
    <div>
      {link}
      {!collapsed && open && (
        <div className="ml-5 mt-1 space-y-1 border-l-2 border-primary-100 pl-3">
          {item.children.map((child) => (
            <NavLink
              key={child.path}
              to={child.path}
              end
              onClick={onClose}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                location.pathname === child.path
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              )}
            >
              <child.icon className="h-4 w-4" />
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const remainingNavItems = navItems.slice(4)

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside
        className={cn(
          'hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <div className={cn('flex items-center h-16 border-b border-gray-200 px-4', collapsed ? 'justify-center' : 'gap-3')}>
          <TreePine className="h-8 w-8 text-primary-700 flex-shrink-0" />
          {!collapsed && (
            <span className="font-serif text-lg font-bold text-primary-700 whitespace-nowrap">果园采摘</span>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <SidebarNavItem key={item.path} item={item} collapsed={collapsed} />
          ))}
        </nav>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 border-t border-gray-200 text-gray-400 hover:text-gray-600"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronDown className="h-5 w-5 rotate-90" />}
        </button>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-white shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between h-16 border-b border-gray-200 px-4">
              <div className="flex items-center gap-3">
                <TreePine className="h-8 w-8 text-primary-700" />
                <span className="font-serif text-lg font-bold text-primary-700">果园采摘</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => (
                <SidebarNavItem key={item.path} item={item} collapsed={false} onClose={() => setSidebarOpen(false)} />
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-medium">
                {user?.name?.[0] || 'U'}
              </div>
              <span className="hidden sm:block text-sm text-gray-700">{user?.name || '用户'}</span>
              <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100" title="退出登录">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
          <div className="flex items-center justify-around py-1">
            {mobileTabItems.map((item) => {
              if (item.path === '/more') {
                return (
                  <button
                    key="more"
                    onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                    className="flex flex-col items-center gap-0.5 py-1.5 px-3 text-gray-500"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="text-[10px]">更多</span>
                  </button>
                )
              }
              const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={cn(
                    'flex flex-col items-center gap-0.5 py-1.5 px-3',
                    isActive ? 'text-primary-700' : 'text-gray-500'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px]">{item.label}</span>
                </NavLink>
              )
            })}
          </div>
          {moreMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-3 grid grid-cols-4 gap-2">
              {remainingNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMoreMenuOpen(false)}
                  className="flex flex-col items-center gap-1 py-3 text-gray-600 hover:text-primary-700"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </NavLink>
              ))}
              {navItems[8].children?.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  onClick={() => setMoreMenuOpen(false)}
                  className="flex flex-col items-center gap-1 py-3 text-gray-600 hover:text-primary-700"
                >
                  <child.icon className="h-5 w-5" />
                  <span className="text-xs">{child.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>
      </div>
    </div>
  )
}
