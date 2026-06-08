import { RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import NeonButton from '@/components/ui/NeonButton'

interface ActionButtonsProps {
  onRetry: () => void
  onNextLevel: () => void
  onBackToLevels: () => void
  hasNextLevel: boolean
  passed: boolean
}

export default function ActionButtons({ onRetry, onNextLevel, onBackToLevels, hasNextLevel, passed }: ActionButtonsProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <NeonButton variant="orange" size="lg" onClick={onRetry}>
          <span className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            重试
          </span>
        </NeonButton>

        {hasNextLevel && passed && (
          <NeonButton variant="green" size="lg" onClick={onNextLevel}>
            <span className="flex items-center gap-2">
              下一关
              <ArrowRight className="h-4 w-4" />
            </span>
          </NeonButton>
        )}
      </div>

      <button
        onClick={onBackToLevels}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-white/15 px-5 py-2.5 text-sm text-white/50',
          'transition-all duration-200 hover:border-white/30 hover:text-white/80',
          'bg-transparent',
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        返回关卡选择
      </button>
    </div>
  )
}
