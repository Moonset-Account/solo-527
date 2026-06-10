import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarClock,
  Car,
  CreditCard,
  Package,
  BarChart3,
  FileText,
  Settings,
  Droplets,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  collapsed?: boolean
  className?: string
}

const menuItems = [
  {
    label: '仪表盘',
    icon: LayoutDashboard,
    to: '/dashboard',
  },
  {
    label: '预约调度',
    icon: CalendarClock,
    to: '/appointments',
    badge: 5,
  },
  {
    label: '车辆档案',
    icon: Car,
    to: '/vehicles',
  },
  {
    label: '收银管理',
    icon: CreditCard,
    to: '/cashier',
  },
  {
    label: '配件缺货',
    icon: Package,
    to: '/parts-shortage',
    badge: 3,
    badgeType: 'danger',
  },
  {
    label: '报表中心',
    icon: BarChart3,
    to: '/reports',
  },
  {
    label: '审计日志',
    icon: FileText,
    to: '/audit-logs',
  },
]

const bottomItems = [
  {
    label: '系统设置',
    icon: Settings,
    to: '/settings',
  },
]

export default function Sidebar({ collapsed = false, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col bg-gradient-to-b from-deep-900 to-deep-800 h-screen transition-all duration-300',
        collapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-accent-500 flex items-center justify-center flex-shrink-0">
          <Droplets size={22} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-white font-bold text-lg truncate">洗车管家</h1>
            <p className="text-gray-400 text-xs">Car Wash Manager</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-4 pt-2 pb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
            功能菜单
          </p>
        )}
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group',
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-2'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} className="flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                {item.badge && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      item.badgeType === 'danger'
                        ? 'bg-red-500 text-white'
                        : 'bg-accent-500 text-white'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-2'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon size={20} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
