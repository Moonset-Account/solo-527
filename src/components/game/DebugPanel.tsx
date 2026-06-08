import type { Vehicle } from '@/engine/types'
import { Bug } from 'lucide-react'
import { cn } from '@/lib/utils'
import Panel from '@/components/ui/Panel'

interface DebugPanelProps {
  vehicles: Vehicle[]
  time: number
  fps: number
  showHeatmap: boolean
  onToggleHeatmap: () => void
}

export default function DebugPanel({
  vehicles,
  time,
  fps,
  showHeatmap,
  onToggleHeatmap,
}: DebugPanelProps) {
  const formatTime = (t: number) => {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <Panel
      title="Debug"
      className="text-xs"
      titleExtra={<Bug className="h-3.5 w-3.5 text-[#ff8800]" />}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-white/50">车辆数</span>
          <span className="font-mono text-[#00ff88]">{vehicles.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/50">时间</span>
          <span className="font-mono text-[#00ff88]">{formatTime(time)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/50">FPS</span>
          <span className={cn(
            'font-mono',
            fps >= 50 ? 'text-[#00ff88]' : fps >= 30 ? 'text-[#ff8800]' : 'text-red-500',
          )}>
            {fps}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/50">拥堵热力图</span>
          <button
            onClick={onToggleHeatmap}
            className={cn(
              'relative h-5 w-9 rounded-full border transition-all duration-300',
              showHeatmap
                ? 'border-[#ff8800] bg-[#ff8800]/20 shadow-[0_0_8px_rgba(255,136,0,0.4)]'
                : 'border-white/20 bg-white/5',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full transition-all duration-300',
                showHeatmap
                  ? 'translate-x-4 bg-[#ff8800] shadow-[0_0_6px_rgba(255,136,0,0.8)]'
                  : 'bg-white/30',
              )}
            />
          </button>
        </div>
      </div>
    </Panel>
  )
}
