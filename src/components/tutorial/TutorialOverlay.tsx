import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X } from 'lucide-react'
import type { TutorialStep } from '@/types'

interface TutorialOverlayProps {
  steps: TutorialStep[]
  currentStep: number
  onNext: () => void
  onSkip: () => void
  onComplete: () => void
}

export default function TutorialOverlay({
  steps,
  currentStep,
  onNext,
  onSkip,
  onComplete,
}: TutorialOverlayProps) {
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)
  const observerRef = useRef<MutationObserver | null>(null)

  const step = steps[currentStep]
  const isLastStep = currentStep >= steps.length - 1

  const updateHighlight = useCallback(() => {
    if (!step?.highlightTarget) {
      setHighlightRect(null)
      return
    }
    const el = document.getElementById(step.highlightTarget)
    if (el) {
      const rect = el.getBoundingClientRect()
      setHighlightRect(rect)
    } else {
      setHighlightRect(null)
    }
  }, [step?.highlightTarget])

  useEffect(() => {
    updateHighlight()
    observerRef.current = new MutationObserver(updateHighlight)
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    })
    window.addEventListener('resize', updateHighlight)
    return () => {
      observerRef.current?.disconnect()
      window.removeEventListener('resize', updateHighlight)
    }
  }, [updateHighlight])

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      onNext()
    }
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentStep}
        className="fixed inset-0 z-50 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        {highlightRect && (
          <motion.div
            className="absolute border-2 border-amber-400 rounded pointer-events-none"
            style={{
              left: highlightRect.left - 4,
              top: highlightRect.top - 4,
              width: highlightRect.width + 8,
              height: highlightRect.height + 8,
            }}
            animate={{
              boxShadow: [
                '0 0 8px 2px rgba(251, 191, 36, 0.3)',
                '0 0 20px 6px rgba(251, 191, 36, 0.6)',
                '0 0 8px 2px rgba(251, 191, 36, 0.3)',
              ],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        <button
          onClick={onSkip}
          className="absolute top-4 right-4 z-50 flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-200/70 hover:text-amber-200 transition-colors pointer-events-auto"
        >
          <X size={14} />
          跳过教程
        </button>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-10 px-6 pointer-events-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={step?.id}
              className="bg-black/80 backdrop-blur-sm border border-amber-900/40 rounded-lg px-8 py-6 max-w-lg w-full text-center mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <p className="font-serif text-lg text-[#c8a86e] leading-relaxed">
                {step?.instruction}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-2 mb-5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  i === currentStep
                    ? 'bg-amber-400'
                    : i < currentStep
                    ? 'bg-amber-600'
                    : 'bg-amber-900/50'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-900/60 hover:bg-amber-800/70 border border-amber-700/50 rounded-lg text-amber-200 font-serif transition-colors duration-200"
          >
            {isLastStep ? '完成' : '下一步'}
            <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
