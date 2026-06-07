import { useFilterStore } from '@/store/filterStore'
import { getEquipmentOptions, getProductionLines, getShifts, getFaultTypes, getMaintenancePeople } from '@/data/mock'
import { RotateCcw, Filter } from 'lucide-react'

function MultiSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="relative">
      <label className="text-xs text-base-400 mb-1 block">{label}</label>
      <select
        multiple
        value={value}
        onChange={(e) => {
          const vals = Array.from(e.target.selectedOptions, (o) => o.value)
          onChange(vals)
        }}
        className="w-full bg-base-700 border border-base-600/50 rounded px-2 py-1.5 text-xs text-base-100 focus:outline-none focus:border-accent/50 min-h-[60px]"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

export default function FilterBar() {
  const { equipmentIds, productionLines, shifts, faultTypes, maintenancePeople, dateRange, downtimeType, setFilter, resetFilters } = useFilterStore()
  const equipOptions = getEquipmentOptions()
  const lineOptions = getProductionLines()
  const shiftOptions = getShifts()
  const faultOptions = getFaultTypes()
  const peopleOptions = getMaintenancePeople()

  return (
    <div className="bg-base-800 border-b border-base-600/30 px-5 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-base-200">筛选条件</span>
        </div>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 text-xs text-base-400 hover:text-accent transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          重置
        </button>
      </div>
      <div className="grid grid-cols-7 gap-3">
        <MultiSelect label="设备" options={equipOptions.map(e => e.id)} value={equipmentIds} onChange={(v) => setFilter('equipmentIds', v)} />
        <MultiSelect label="产线" options={lineOptions} value={productionLines} onChange={(v) => setFilter('productionLines', v)} />
        <MultiSelect label="班次" options={shiftOptions} value={shifts} onChange={(v) => setFilter('shifts', v)} />
        <MultiSelect label="故障类型" options={faultOptions} value={faultTypes} onChange={(v) => setFilter('faultTypes', v)} />
        <MultiSelect label="维修人" options={peopleOptions} value={maintenancePeople} onChange={(v) => setFilter('maintenancePeople', v)} />
        <div>
          <label className="text-xs text-base-400 mb-1 block">时间范围</label>
          <div className="space-y-1">
            <input
              type="date"
              value={dateRange[0]}
              onChange={(e) => setFilter('dateRange', [e.target.value, dateRange[1]])}
              className="w-full bg-base-700 border border-base-600/50 rounded px-2 py-1.5 text-xs text-base-100 focus:outline-none focus:border-accent/50"
            />
            <input
              type="date"
              value={dateRange[1]}
              onChange={(e) => setFilter('dateRange', [dateRange[0], e.target.value])}
              className="w-full bg-base-700 border border-base-600/50 rounded px-2 py-1.5 text-xs text-base-100 focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-base-400 mb-1 block">停机类型</label>
          <div className="flex gap-1 mt-1">
            {(['all', 'planned', 'unplanned'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter('downtimeType', type)}
                className={`flex-1 px-2 py-1.5 rounded text-xs transition-all duration-200 ${
                  downtimeType === type
                    ? type === 'planned'
                      ? 'bg-planned text-white'
                      : type === 'unplanned'
                      ? 'bg-unplanned text-white'
                      : 'bg-accent text-base-900'
                    : 'bg-base-700 text-base-300 hover:bg-base-600'
                }`}
              >
                {type === 'all' ? '全部' : type === 'planned' ? '计划' : '突发'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
