import { useStore } from '@/store/useStore'
import type { WarehouseType } from '@/types'

const tabs: { label: string; value: WarehouseType }[] = [
  { label: '全部', value: 'all' },
  { label: '海外仓', value: 'overseas' },
  { label: '国内仓', value: 'domestic' },
]

export default function WarehouseSwitcher() {
  const warehouseType = useStore((s) => s.warehouseType)
  const setWarehouseType = useStore((s) => s.setWarehouseType)

  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setWarehouseType(tab.value)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
            warehouseType === tab.value
              ? 'bg-[#1B2A4A] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
