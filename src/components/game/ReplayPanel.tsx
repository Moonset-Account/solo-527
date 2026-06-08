import type { AnimationState } from '@/engine/types'
import { Play, Pause, FastForward, Square, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import NeonButton from '@/components/ui/NeonButton'
import { getLabelForState, getSpeedForState } from '@/animation/AnimationState'

interface ReplayPanelProps {
  animationState: AnimationState
  onPlay: () => void
  onPause: () => void
  onFastForward: () => void
  onStop: () => void
  onReplay: () => void
}

export default function ReplayPanel({
  animationState,
  onPlay,
  onPause,
  onFastForward,
  onStop,
  onReplay,
}: ReplayPanelProps) {
  const isPlaying = animationState === 'playing' || animationState === 'fastForward' || animationState === 'replaying'
  const speed = getSpeedForState(animationState)
  const label = getLabelForState(animationState)

  return (
    <div className="flex items-center gap-3">
      {isPlaying ? (
        <NeonButton size="sm" onClick={onPause}>
          <Pause className="h-4 w-4" />
        </NeonButton>
      ) : (
        <NeonButton size="sm" onClick={onPlay}>
          <Play className="h-4 w-4" />
        </NeonButton>
      )}
      <NeonButton size="sm" variant="orange" onClick={onFastForward}>
        <FastForward className="h-4 w-4" />
      </NeonButton>
      <NeonButton size="sm" onClick={onStop}>
        <Square className="h-4 w-4" />
      </NeonButton>
      <NeonButton size="sm" variant="orange" onClick={onReplay}>
        <RotateCcw className="h-4 w-4" />
      </NeonButton>
      <div className="flex items-center gap-2">
        <span className={cn(
          'rounded-md border px-2 py-1 text-xs font-semibold',
          isPlaying
            ? 'border-[#00ff88] text-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.3)]'
            : 'border-white/20 text-white/50',
        )}>
          {label}
        </span>
        {speed > 0 && (
          <span className="text-xs font-medium text-[#ff8800]">
            {speed}x
          </span>
        )}
      </div>
    </div>
  )
}
