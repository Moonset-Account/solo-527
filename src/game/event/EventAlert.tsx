import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useGameStore } from '@/stores/gameStore'
import { EVENT_TYPE_CONFIG, PRIORITY_CONFIG } from '@/types/game'

interface ShownEvent {
  id: string
  dismissed: boolean
}

export default function EventAlert() {
  const { events, zones } = useGameStore()
  const [shownEvents, setShownEvents] = useState<ShownEvent[]>([])

  const triggeredEvents = events.filter((e) => e.triggered && !e.expired)
  const shownIds = new Set(shownEvents.map((s) => s.id))

  const newTriggered = triggeredEvents.filter((e) => !shownIds.has(e.id))
  if (newTriggered.length > 0) {
    setShownEvents((prev) => [
      ...prev,
      ...newTriggered.map((e) => ({ id: e.id, dismissed: false })),
    ])
  }

  const activeAlerts = shownEvents.filter(
    (s) => !s.dismissed && triggeredEvents.some((e) => e.id === s.id)
  )

  useEffect(() => {
    if (activeAlerts.length === 0) return
    const timer = setTimeout(() => {
      setShownEvents((prev) =>
        prev.map((s) =>
          activeAlerts.some((a) => a.id === s.id) ? { ...s, dismissed: true } : s
        )
      )
    }, 4000)
    return () => clearTimeout(timer)
  }, [activeAlerts.length])

  const dismiss = (id: string) => {
    setShownEvents((prev) => prev.map((s) => (s.id === id ? { ...s, dismissed: true } : s)))
  }

  const getAffectedNames = (zoneIds: string[]) =>
    zoneIds
      .map((id) => zones.find((z) => z.id === id)?.name)
      .filter(Boolean)
      .join('、')

  if (activeAlerts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {activeAlerts.map((shown) => {
        const event = triggeredEvents.find((e) => e.id === shown.id)!
        const eventCfg = EVENT_TYPE_CONFIG[event.type]
        const priorityCfg = PRIORITY_CONFIG[event.urgency]

        return (
          <div
            key={shown.id}
            className="slide-in-right flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg"
            style={{
              backgroundColor: '#1a2332',
              borderLeft: `3px solid ${priorityCfg.color}`,
            }}
          >
            <span className="text-xl leading-none mt-0.5">{eventCfg.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-200">{event.name}</span>
                <AlertTriangle size={12} style={{ color: priorityCfg.color }} />
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate">{event.description}</p>
              <p className="text-[11px] text-gray-500 mt-1">
                影响区域: {getAffectedNames(event.affectedZoneIds)}
              </p>
            </div>
            <button onClick={() => dismiss(shown.id)} className="text-gray-500 hover:text-gray-300 shrink-0">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
