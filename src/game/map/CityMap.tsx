import { useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { ZONE_TYPE_CONFIG, getZoneStatusColor } from '@/types/game'
import type { Zone } from '@/types/game'

export default function CityMap() {
  const { zones, currentLevel } = useGameStore()
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

  const cols = currentLevel?.gridCols ?? 4
  const rows = currentLevel?.gridRows ?? 4

  const grid: (Zone | null)[][] = Array.from({ length: rows }, (_, y) =>
    Array.from({ length: cols }, (_, x) => {
      return zones.find((z) => z.gridX === x && z.gridY === y) ?? null
    })
  )

  return (
    <div
      className="grid gap-1.5 p-2"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {grid.flat().map((zone, i) => {
        if (!zone) return <div key={`empty-${i}`} className="rounded-lg" style={{ backgroundColor: '#0f1923' }} />

        const statusColor = getZoneStatusColor(zone.status)
        const isSelected = selectedZoneId === zone.id
        const config = ZONE_TYPE_CONFIG[zone.type]

        return (
          <button
            key={zone.id}
            onClick={() => setSelectedZoneId(isSelected ? null : zone.id)}
            className="relative flex flex-col items-center justify-center rounded-lg p-2 transition-all"
            style={{
              backgroundColor: '#1a2332',
              border: isSelected ? `2px solid ${statusColor}` : '2px solid transparent',
              boxShadow: isSelected ? `0 0 12px ${statusColor}44` : 'none',
            }}
          >
            <span className="text-lg leading-none">{config.icon}</span>
            <span className="mt-1 text-[10px] leading-tight text-gray-300 truncate w-full text-center">
              {zone.name}
            </span>
            <div className="mt-1 w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#0f1923' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${zone.currentHealth}%`, backgroundColor: statusColor }}
              />
            </div>
            <span className="text-[9px] text-gray-400 mt-0.5">{Math.round(zone.currentHealth)}%</span>
          </button>
        )
      })}
    </div>
  )
}
