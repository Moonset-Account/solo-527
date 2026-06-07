import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, Check, X } from 'lucide-react'

interface FilterSelectProps {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function FilterSelect({ label, options, selected, onChange }: FilterSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
  const allSelected = selected.length === options.length && options.length > 0

  const toggleAll = () => {
    onChange(allSelected ? [] : options.map((o) => o.value))
  }

  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val])
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-slate-500 transition-colors"
      >
        <span className="truncate">
          {selected.length === 0 ? '全部' : selected.length === options.length ? '全部' : `已选 ${selected.length} 项`}
        </span>
        <span className="flex items-center gap-1 ml-2 shrink-0">
          {selected.length > 0 && (
            <span onClick={clearAll} className="p-0.5 hover:bg-slate-600 rounded">
              <X size={12} />
            </span>
          )}
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg shadow-xl max-h-64 flex flex-col">
          <div className="p-2 border-b border-slate-600">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索..."
                className="w-full pl-7 pr-2 py-1.5 text-xs bg-slate-800 border border-slate-600 rounded text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-600">
            <button type="button" onClick={toggleAll} className="text-xs text-emerald-400 hover:text-emerald-300">
              {allSelected ? '清除全部' : '全选'}
            </button>
            <span className="text-xs text-slate-400">{selected.length}/{options.length}</span>
          </div>
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-600 transition-colors text-left"
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    selected.includes(opt.value) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'
                  }`}
                >
                  {selected.includes(opt.value) && <Check size={10} className="text-white" />}
                </span>
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="px-3 py-2 text-xs text-slate-500 text-center">无匹配项</div>}
          </div>
        </div>
      )}
    </div>
  )
}
