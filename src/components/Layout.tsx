import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { LayoutDashboard, BookOpen, Building2, Clock, AlertTriangle, FileText, Library } from 'lucide-react'
import FilterSidebar from './FilterSidebar'
import { useDataStore } from '@/store/dataStore'
import { useFilterStore } from '@/store/filterStore'

const NAV_ITEMS = [
  { path: '/', label: '数据总览', icon: LayoutDashboard },
  { path: '/theme-trends', label: '主题趋势', icon: BookOpen },
  { path: '/branch-compare', label: '分馆对比', icon: Building2 },
  { path: '/reservation-wait', label: '预约等待', icon: Clock },
  { path: '/overdue-heatmap', label: '逾期热区', icon: AlertTriangle },
  { path: '/weekly-reports', label: '周报中心', icon: FileText },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { updatedAt, fetchFilterOptions, fetchUpdateTime } = useDataStore()
  const filters = useFilterStore((s) => s.filters)

  useEffect(() => {
    fetchFilterOptions()
    fetchUpdateTime()
  }, [])

  const activeFilters = [
    ...filters.collectionTypes.map((t) => ({ key: '馆藏', value: t })),
    ...filters.readerGroups.map((g) => ({ key: '读者', value: g })),
    ...filters.themes.map((t) => ({ key: '主题', value: t })),
    ...filters.branches.map((b) => ({ key: '分馆', value: b })),
  ]

  return (
    <div className="flex h-screen bg-[#FAFBFC]">
      <FilterSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <Library className="w-5 h-5 text-[#6C5CE7]" />
              <span className="font-bold text-[#1B2838] text-base" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                图书馆借阅分析
              </span>
            </Link>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-[#6C5CE7]/10 text-[#6C5CE7]'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {activeFilters.slice(0, 4).map((f, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-[#6C5CE7]/10 text-[#6C5CE7]">
                    {f.key}:{f.value}
                  </span>
                ))}
                {activeFilters.length > 4 && (
                  <span className="text-[10px] text-slate-400">+{activeFilters.length - 4}</span>
                )}
              </div>
            )}
            {updatedAt && (
              <span className="text-[10px] text-slate-400">
                更新: {new Date(updatedAt).toLocaleString('zh-CN')}
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
