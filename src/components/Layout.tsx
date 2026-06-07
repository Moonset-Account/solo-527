import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, PackageSearch, Truck, ShieldCheck } from 'lucide-react'
import WarehouseSwitcher from './WarehouseSwitcher'

const navItems = [
  { to: '/', label: '总览', icon: LayoutDashboard },
  { to: '/sku', label: 'SKU 排名', icon: PackageSearch },
  { to: '/logistics', label: '物流关联', icon: Truck },
  { to: '/quality', label: '质检分析', icon: ShieldCheck },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="flex w-60 flex-shrink-0 flex-col bg-[#1B2A4A]">
        <div className="flex h-14 items-center px-5">
          <span className="text-lg font-bold text-white tracking-wide">
            退货分析看板
          </span>
        </div>

        <nav className="mt-2 flex flex-1 flex-col gap-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'border-l-[3px] border-white bg-white/10 text-white pl-[calc(0.75rem-3px)]'
                    : 'border-l-[3px] border-transparent text-white/60 hover:bg-white/5 hover:text-white/90'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-3">
          <span className="text-xs text-white/40">v1.0.0</span>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
          <WarehouseSwitcher />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">跨境电商退货分析系统</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#F0F2F5] p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
