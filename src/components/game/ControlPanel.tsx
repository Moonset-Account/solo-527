import type { TrafficLightConfig } from '@/engine/types'
import Panel from '@/components/ui/Panel'
import NeonSlider from '@/components/ui/NeonSlider'

interface ControlPanelProps {
  intersectionId: string | null
  config: TrafficLightConfig | null
  onUpdateConfig: (intersectionId: string, patch: Partial<TrafficLightConfig>) => void
}

export default function ControlPanel({
  intersectionId,
  config,
  onUpdateConfig,
}: ControlPanelProps) {
  if (!intersectionId || !config) {
    return (
      <Panel title="路口控制">
        <p className="py-6 text-center text-sm text-white/40">点击路口选择</p>
      </Panel>
    )
  }

  const totalCycle = config.nsGreenDuration + config.ewGreenDuration + config.yellowDuration * 2

  return (
    <Panel title={`路口 ${intersectionId}`}>
      <div className="flex flex-col gap-4">
        <NeonSlider
          label="南北绿灯时长"
          value={config.nsGreenDuration}
          min={10}
          max={90}
          step={1}
          unit="s"
          color="green"
          onChange={(v) => onUpdateConfig(intersectionId, { nsGreenDuration: v })}
        />
        <NeonSlider
          label="东西绿灯时长"
          value={config.ewGreenDuration}
          min={10}
          max={90}
          step={1}
          unit="s"
          color="orange"
          onChange={(v) => onUpdateConfig(intersectionId, { ewGreenDuration: v })}
        />
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/40 px-3 py-2">
          <span className="text-xs text-white/60">总周期</span>
          <span className="text-sm font-semibold text-[#00ff88]">{totalCycle}s</span>
        </div>
      </div>
    </Panel>
  )
}
