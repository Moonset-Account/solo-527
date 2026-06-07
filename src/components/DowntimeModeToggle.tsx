import { useFilterStore } from '@/store/filterStore'

export default function DowntimeModeToggle() {
  const downtimeMode = useFilterStore((s) => s.downtimeMode)
  const setDowntimeMode = useFilterStore((s) => s.setDowntimeMode)

  const modes = [
    { value: 'all' as const, label: '全部停机', activeBg: 'bg-[#1B2A4A]' },
    { value: 'planned' as const, label: '仅计划检修', activeBg: 'bg-[#3498DB]' },
    { value: 'unplanned' as const, label: '仅突发停机', activeBg: 'bg-[#E74C3C]' },
  ]

  return (
    <div className="flex gap-2">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => setDowntimeMode(mode.value)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            downtimeMode === mode.value
              ? `${mode.activeBg} text-white`
              : 'bg-[#162236] text-[#94A3B8] border border-[#1E3A5F] hover:text-white'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}
