import { Bell, Search, Menu, ChevronDown, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  onToggleSidebar?: () => void
  className?: string
}

export default function Header({ title, onToggleSidebar, className }: HeaderProps) {
  return (
    <header
      className={cn(
        'h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="搜索订单、车辆、客户..."
            className="w-72 pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
          />
        </div>

        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full">
            <span className="absolute inset-0 bg-accent-500 rounded-full animate-ping opacity-75" />
          </span>
        </button>

        <div className="h-6 w-px bg-gray-200" />

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
            <User size={18} className="text-primary-600" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">管理员</p>
            <p className="text-xs text-gray-500">门店负责人</p>
          </div>
          <ChevronDown size={16} className="text-gray-400 group-hover:text-gray-600 hidden sm:block" />
        </div>
      </div>
    </header>
  )
}
