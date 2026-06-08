import { useFilterStore } from '@/store/filterStore'
import { useDataStore } from '@/store/dataStore'
import { RotateCcw, Filter, Calendar, Users, BookOpen, Building2, Tag } from 'lucide-react'

export default function FilterSidebar() {
  const { filters, setCollectionTypes, setReaderGroups, setThemes, setBranches, setDateRange, resetFilters } = useFilterStore()
  const { filterOptions } = useDataStore()

  const opts = filterOptions

  const activeCount = [
    filters.collectionTypes.length > 0,
    filters.readerGroups.length > 0,
    filters.themes.length > 0,
    filters.branches.length > 0,
  ].filter(Boolean).length

  const toggleItem = (current: string[], setter: (v: string[]) => void, item: string) => {
    if (current.includes(item)) {
      setter(current.filter((i) => i !== item))
    } else {
      setter([...current, item])
    }
  }

  return (
    <aside className="w-60 min-w-[240px] bg-[#1B2838] text-white flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-5 pb-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6C5CE7]" />
            <span className="text-sm font-semibold">筛选器</span>
          </div>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#6C5CE7] font-bold">{activeCount}</span>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-3 space-y-5">
        <div>
          <div className="flex items-center gap-1.5 mb-2 text-[11px] text-slate-400 uppercase tracking-wider font-medium">
            <Calendar className="w-3 h-3" />
            时间范围
          </div>
          <div className="space-y-1.5">
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => setDateRange({ ...filters.dateRange, start: e.target.value })}
              className="w-full px-2 py-1.5 rounded text-xs bg-white/10 border border-white/10 text-white focus:outline-none focus:border-[#6C5CE7]"
            />
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => setDateRange({ ...filters.dateRange, end: e.target.value })}
              className="w-full px-2 py-1.5 rounded text-xs bg-white/10 border border-white/10 text-white focus:outline-none focus:border-[#6C5CE7]"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2 text-[11px] text-slate-400 uppercase tracking-wider font-medium">
            <BookOpen className="w-3 h-3" />
            馆藏类型
          </div>
          <div className="flex flex-wrap gap-1">
            {(opts?.collectionTypes || []).map((ct) => (
              <button
                key={ct}
                onClick={() => toggleItem(filters.collectionTypes, setCollectionTypes, ct)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  filters.collectionTypes.includes(ct)
                    ? 'bg-[#6C5CE7] text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {ct}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2 text-[11px] text-slate-400 uppercase tracking-wider font-medium">
            <Users className="w-3 h-3" />
            读者分组
          </div>
          <div className="flex flex-wrap gap-1">
            {(opts?.readerGroups || []).map((rg) => (
              <button
                key={rg.key}
                onClick={() => toggleItem(filters.readerGroups, setReaderGroups, rg.key)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  filters.readerGroups.includes(rg.key)
                    ? 'bg-[#6C5CE7] text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                } ${rg.aggregationOnly ? 'border border-blue-400/40' : ''}`}
              >
                {rg.label}
                {rg.aggregationOnly && ' 🔒'}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-blue-300/70 mt-1.5">🔒 少儿数据仅聚合展示</p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2 text-[11px] text-slate-400 uppercase tracking-wider font-medium">
            <Tag className="w-3 h-3" />
            主题分类
          </div>
          <div className="flex flex-wrap gap-1">
            {(opts?.themes || []).map((t) => (
              <button
                key={t}
                onClick={() => toggleItem(filters.themes, setThemes, t)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  filters.themes.includes(t)
                    ? 'bg-[#6C5CE7] text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2 text-[11px] text-slate-400 uppercase tracking-wider font-medium">
            <Building2 className="w-3 h-3" />
            分馆
          </div>
          <div className="flex flex-wrap gap-1">
            {(opts?.branches || []).map((b) => (
              <button
                key={b.id}
                onClick={() => toggleItem(filters.branches, setBranches, b.id)}
                className={`px-2 py-1 rounded text-[11px] transition-colors ${
                  filters.branches.includes(b.id)
                    ? 'bg-[#6C5CE7] text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-white/10">
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors w-full justify-center"
        >
          <RotateCcw className="w-3 h-3" />
          重置筛选
        </button>
      </div>
    </aside>
  )
}
