import { Users, Package, Truck } from 'lucide-react'
import { useGameStore } from '@/stores/gameStore'
import { RESOURCE_TYPE_CONFIG } from '@/types/game'
import type { ResourceType } from '@/types/game'

const ICON_MAP: Record<ResourceType, React.ReactNode> = {
  repair_team: <Users size={16} />,
  supply: <Package size={16} />,
  vehicle: <Truck size={16} />,
}

export default function ResourcePanel() {
  const { resources } = useGameStore()

  return (
    <div className="flex items-center gap-4 px-4 py-2" style={{ backgroundColor: '#1a2332' }}>
      {resources.map((res) => {
        const config = RESOURCE_TYPE_CONFIG[res.type]
        const isDepleted = res.available === 0

        return (
          <div key={res.id} className="flex items-center gap-2">
            <span className={isDepleted ? 'text-red-400' : 'text-gray-300'}>
              {ICON_MAP[res.type]}
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-400 leading-tight">{config.label}</span>
              <span className={`text-sm font-semibold leading-tight ${isDepleted ? 'text-red-400' : 'text-gray-200'}`}>
                {res.available}<span className="text-gray-500">/{res.total}</span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
