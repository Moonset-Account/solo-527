import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { useFilterStore } from '@/store/filterStore'
import { equipments, productionLines, faultTypes, maintenancePersons } from '@/mock/data'

function MultiSelectDropdown({
  options,
  selected,
  onChange,
  labelKey,
  valueKey,
}: {
  options: { id: string; name: string }[]
  selected: string[]
  onChange: (values: string[]) => void
  labelKey: string
  valueKey: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val))
    } else {
      onChange([...selected, val])
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-[#162236] border border-[#1E3A5F] rounded px-2 py-1.5 text-sm text-left text-white truncate"
      >
        {selected.length === 0
          ? '请选择'
          : `${selected.length} 项已选`}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#162236] border border-[#1E3A5F] rounded max-h-48 overflow-y-auto">
          {options.map((opt) => {
            const val = (opt as Record<string, string>)[valueKey]
            const label = (opt as Record<string, string>)[labelKey]
            return (
              <label
                key={val}
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-white hover:bg-[#1B2A4A] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(val)}
                  onChange={() => handleToggle(val)}
                  className="accent-[#FF6B35]"
                />
                {label}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CheckboxGroup({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const handleToggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val))
    } else {
      onChange([...selected, val])
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {options.map((opt) => (
        <label
          key={opt}
          className="flex items-center gap-2 text-sm text-white cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => handleToggle(opt)}
            className="accent-[#FF6B35]"
          />
          {opt}
        </label>
      ))}
    </div>
  )
}

export default function Sidebar({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const {
    equipmentIds,
    setEquipmentIds,
    productionLines: selectedLines,
    setProductionLines,
    shifts,
    setShifts,
    faultTypes: selectedFaultTypes,
    setFaultTypes,
    maintenancePersonIds,
    setMaintenancePersonIds,
    downtimeMode,
    setDowntimeMode,
    dateRange,
    setDateRange,
    resetFilters,
  } = useFilterStore()

  if (!isOpen) {
    return (
      <div className="w-[60px] bg-[#0F1B2D] border-r border-[#1E3A5F] flex flex-col items-center py-4 shrink-0">
        <button
          onClick={onToggle}
          className="text-[#94A3B8] hover:text-white"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    )
  }

  return (
    <div className="w-[280px] bg-[#0F1B2D] border-r border-[#1E3A5F] flex flex-col shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E3A5F]">
        <span className="text-sm font-medium text-white">筛选条件</span>
        <button
          onClick={onToggle}
          className="text-[#94A3B8] hover:text-white"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-4 flex-1">
        <div>
          <label className="text-xs text-[#94A3B8] mb-1 block">设备</label>
          <MultiSelectDropdown
            options={equipments.map((e) => ({ id: e.id, name: e.name }))}
            selected={equipmentIds}
            onChange={setEquipmentIds}
            labelKey="name"
            valueKey="id"
          />
        </div>

        <div>
          <label className="text-xs text-[#94A3B8] mb-1 block">产线</label>
          <CheckboxGroup
            options={[...productionLines]}
            selected={selectedLines}
            onChange={setProductionLines}
          />
        </div>

        <div>
          <label className="text-xs text-[#94A3B8] mb-1 block">班次</label>
          <CheckboxGroup
            options={['早班', '中班', '夜班']}
            selected={shifts}
            onChange={(v) => setShifts(v as ('早班' | '中班' | '夜班')[])}
          />
        </div>

        <div>
          <label className="text-xs text-[#94A3B8] mb-1 block">故障类型</label>
          <MultiSelectDropdown
            options={faultTypes.map((f) => ({ id: f, name: f }))}
            selected={selectedFaultTypes}
            onChange={setFaultTypes}
            labelKey="name"
            valueKey="id"
          />
        </div>

        <div>
          <label className="text-xs text-[#94A3B8] mb-1 block">维修人员</label>
          <MultiSelectDropdown
            options={maintenancePersons.map((m) => ({ id: m.id, name: m.name }))}
            selected={maintenancePersonIds}
            onChange={setMaintenancePersonIds}
            labelKey="name"
            valueKey="id"
          />
        </div>

        <div>
          <label className="text-xs text-[#94A3B8] mb-1 block">停机模式</label>
          <div className="flex gap-1">
            {([
              { value: 'all' as const, label: '全部' },
              { value: 'planned' as const, label: '计划检修' },
              { value: 'unplanned' as const, label: '突发停机' },
            ]).map((item) => (
              <button
                key={item.value}
                onClick={() => setDowntimeMode(item.value)}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  downtimeMode === item.value
                    ? item.value === 'all'
                      ? 'bg-[#1B2A4A] text-white'
                      : item.value === 'planned'
                        ? 'bg-[#3498DB] text-white'
                        : 'bg-[#E74C3C] text-white'
                    : 'bg-[#162236] text-[#94A3B8] border border-[#1E3A5F]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-[#94A3B8] mb-1 block">日期范围</label>
          <div className="flex flex-col gap-1">
            <input
              type="date"
              value={dateRange[0]}
              onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
              className="bg-[#162236] border border-[#1E3A5F] rounded px-2 py-1.5 text-sm text-white"
            />
            <input
              type="date"
              value={dateRange[1]}
              onChange={(e) => setDateRange([dateRange[0], e.target.value])}
              className="bg-[#162236] border border-[#1E3A5F] rounded px-2 py-1.5 text-sm text-white"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-[#1E3A5F]">
        <button
          onClick={resetFilters}
          className="w-full flex items-center justify-center gap-2 bg-[#162236] border border-[#1E3A5F] rounded px-3 py-2 text-sm text-[#94A3B8] hover:text-white hover:border-[#FF6B35] transition-colors"
        >
          <RotateCcw size={14} />
          重置筛选
        </button>
      </div>
    </div>
  )
}
