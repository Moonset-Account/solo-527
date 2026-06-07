import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, Wrench, Package, Activity } from 'lucide-react'

const NAV_ITEMS = [
  { path: '/dashboard', label: '停机总览', icon: BarChart3 },
  { path: '/analysis', label: '停机分析', icon: Wrench },
  { path: '/spare-parts', label: '备件关联', icon: Package },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-base-900 text-base-100 font-sans flex">
      <aside className="w-56 bg-base-800 border-r border-base-600/30 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-base-600/30 flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          <span className="font-mono text-sm font-bold text-accent tracking-wide">停机看板</span>
        </div>
        <nav className="flex-1 py-3">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-all duration-200 ${
                  isActive
                    ? 'text-accent bg-accent/10 border-r-2 border-accent'
                    : 'text-base-300 hover:text-base-100 hover:bg-base-700/50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="px-5 py-3 text-xs text-base-400 border-t border-base-600/30">
          设备停机原因分析系统 v1.0
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
