import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  GitCompareArrows,
  BarChart3,
  Map,
  Table2,
  StickyNote,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/hooks/useAppStore'
import { NotesDrawer } from '@/components/NotesDrawer'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '概览仪表盘' },
  { to: '/compare', icon: GitCompareArrows, label: '多维对比' },
  { to: '/visualization', icon: BarChart3, label: '可视化工作台' },
  { to: '/campus-map', icon: Map, label: '校园地图' },
  { to: '/detail', icon: Table2, label: '下钻明细' },
  { to: '/notes', icon: StickyNote, label: '备注管理' },
]

export default function Layout() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()

  return (
    <div className="flex h-screen bg-[#F8F7F4]">
      <aside
        className={`flex flex-col border-r border-zinc-200 bg-white transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-zinc-100 px-3">
          {!sidebarCollapsed && (
            <span className="text-sm font-semibold text-teal-700 truncate">
              心理咨询复盘
            </span>
          )}
          <button
            onClick={toggleSidebar}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-400"
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
        <nav className="flex-1 py-2 space-y-0.5 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-700 font-medium'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                } ${sidebarCollapsed ? 'justify-center' : ''}`
              }
            >
              <item.icon size={18} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-zinc-100 p-3">
          {!sidebarCollapsed && (
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              数据已脱敏 · 仅展示聚合趋势
            </p>
          )}
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <NotesDrawer />
    </div>
  )
}
