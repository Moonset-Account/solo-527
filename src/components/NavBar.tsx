import { Factory } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useFilterStore } from '@/store/filterStore'

export default function NavBar() {
  const getFilterDescription = useFilterStore((s) => s.getFilterDescription)

  const links = [
    { to: '/', label: '看板' },
    { to: '/report', label: '周报' },
    { to: '/data-governance', label: '数据治理' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-[#0A1628] border-b border-[#1E3A5F] flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-2">
        <Factory size={22} className="text-[#FF6B35]" />
        <span className="text-lg font-bold text-white">工厂设备停机原因看板</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm pb-0.5 border-b-2 transition-colors ${
                  isActive
                    ? 'text-white border-[#FF6B35]'
                    : 'text-[#94A3B8] border-transparent hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <span className="text-[10px] text-[#94A3B8] bg-[#162236] border border-[#1E3A5F] rounded px-2 py-1 max-w-xs truncate">
          {getFilterDescription()}
        </span>
      </div>
    </nav>
  )
}
