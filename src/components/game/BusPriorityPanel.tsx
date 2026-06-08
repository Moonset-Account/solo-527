import type { TrafficLightConfig } from '@/engine/types'
import { cn } from '@/lib/utils'
import Panel from '@/components/ui/Panel'
import NeonSlider from '@/components/ui/NeonSlider'

interface BusPriorityPanelProps {
  intersectionId: string | null
  config: TrafficLightConfig | null
  onUpdateConfig: (intersectionId: string, patch: Partial<TrafficLightConfig>) => void
}

export default function BusPriorityPanel({
  intersectionId,
  config,
  onUpdateConfig,
}: BusPriorityPanelProps) {
  if (!intersectionId || !config) {
    return null
  }

  const handleToggle = () => {
    onUpdateConfig(intersectionId, {
      busPriorityEnabled: !config.busPriorityEnabled,
    })
  }

  return (
    <Panel title="公交优先">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/70">优先模式</span>
          <button
            onClick={handleToggle}
            className={cn(
              'relative h-7 w-14 rounded-full border transition-all duration-300',
              config.busPriorityEnabled
                ? 'border-[#00ff88] bg-[#00ff88]/20 shadow-[0_0_12px_rgba(0,255,136,0.5)]'
                : 'border-white/20 bg-white/5',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 h-6 w-6 rounded-full transition-all duration-300',
                config.busPriorityEnabled
                  ? 'translate-x-7 bg-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.8)]'
                  : 'bg-white/30',
              )}
            />
          </button>
        </div>

        {config.busPriorityEnabled && (
          <>
            <NeonSlider
              label="提前秒数"
              value={config.busPriorityAdvanceSeconds}
              min={1}
              max={10}
              step={1}
              unit="s"
              color="green"
              onChange={(v) =>
                onUpdateConfig(intersectionId, { busPriorityAdvanceSeconds: v })
              }
            />
            <NeonSlider
              label="延长时间"
              value={config.busPriorityExtendSeconds}
              min={1}
              max={15}
              step={1}
              unit="s"
              color="orange"
              onChange={(v) =>
                onUpdateConfig(intersectionId, { busPriorityExtendSeconds: v })
              }
            />
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2">
              <span className="text-xs text-white/60">冷却时间</span>
              <span className="text-sm font-semibold text-[#ff8800]">30s</span>
            </div>
          </>
        )}
      </div>
    </Panel>
  )
}
