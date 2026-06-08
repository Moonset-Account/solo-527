import type { TutorialStep } from '@/engine/types'
import { cn } from '@/lib/utils'
import NeonButton from '@/components/ui/NeonButton'

interface TutorialOverlayProps {
  steps: TutorialStep[]
  currentStep: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  isVisible: boolean
}

export default function TutorialOverlay({
  steps,
  currentStep,
  onNext,
  onPrev,
  onSkip,
  isVisible,
}: TutorialOverlayProps) {
  if (!isVisible || steps.length === 0) return null

  const step = steps[currentStep]
  if (!step) return null

  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className={cn(
          'relative z-10 w-full max-w-md rounded-2xl border border-[#00ff88]/30 p-6',
          'bg-[#0d1526]/80 shadow-[0_0_30px_rgba(0,255,136,0.15)]',
          'backdrop-blur-xl',
        )}
      >
        <div className="mb-4 flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === currentStep
                  ? 'w-6 bg-[#00ff88] shadow-[0_0_8px_rgba(0,255,136,0.6)]'
                  : 'w-2 bg-white/20',
              )}
            />
          ))}
        </div>

        <h2 className="mb-3 text-center text-xl font-bold text-[#00ff88]">
          {step.title}
        </h2>

        <p className="mb-6 text-center leading-relaxed text-white/70">
          {step.description}
        </p>

        <div className="flex items-center justify-between">
          <NeonButton
            variant="orange"
            size="sm"
            onClick={onPrev}
            disabled={isFirst}
          >
            上一步
          </NeonButton>

          <NeonButton variant="orange" size="sm" onClick={onSkip}>
            跳过
          </NeonButton>

          <NeonButton variant="green" size="sm" onClick={onNext}>
            {isLast ? '完成' : '下一步'}
          </NeonButton>
        </div>
      </div>
    </div>
  )
}
