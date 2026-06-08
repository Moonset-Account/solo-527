import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronLeft } from 'lucide-react'
import { useGameStore } from '@/stores/gameStore'
import { ALL_LEVELS } from '@/levels'
import { SaveManager } from '@/game/engine/SaveManager'
import CityMap from '@/game/map/CityMap'
import TaskPanel from '@/game/task/TaskPanel'
import ResourcePanel from '@/game/resource/ResourcePanel'
import type { TutorialStep } from '@/types/game'

const POSITION_MAP: Record<string, string> = {
  top: 'bottom-full mb-3 left-1/2 -translate-x-1/2',
  bottom: 'top-full mt-3 left-1/2 -translate-x-1/2',
  left: 'right-full mr-3 top-1/2 -translate-y-1/2',
  right: 'left-full ml-3 top-1/2 -translate-y-1/2',
}

const ARROW_MAP: Record<string, string> = {
  top: 'absolute -bottom-2 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-8 border-transparent border-t-[#1a2332]',
  bottom: 'absolute -top-2 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-8 border-transparent border-b-[#1a2332]',
  left: 'absolute -right-2 top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-8 border-transparent border-l-[#1a2332]',
  right: 'absolute -left-2 top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-r-8 border-transparent border-r-[#1a2332]',
}

export default function Tutorial() {
  const navigate = useNavigate()
  const { startGame, currentLevel, gameState } = useGameStore()
  const [stepIndex, setStepIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  const level1 = ALL_LEVELS[0]
  const steps: TutorialStep[] = level1.tutorialSteps ?? []

  useEffect(() => {
    if (gameState === 'idle') {
      startGame(level1)
    }
  }, [])

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1)
    }
  }

  const handleFinish = () => {
    setDismissed(true)
    const save = SaveManager.load() ?? { tutorialCompleted: false, levels: [], totalPlayTime: 0 }
    SaveManager.save({ ...save, tutorialCompleted: true })
  }

  const currentStep = steps[stepIndex]
  const position = currentStep?.position ?? 'bottom'

  return (
    <div className="relative w-full h-full flex flex-col" style={{ background: '#0f1923' }}>
      <div className="absolute top-3 left-3 z-20">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-colors"
          style={{ color: '#8899aa', background: 'rgba(255,255,255,0.05)' }}
        >
          <ChevronLeft size={16} />
          返回
        </button>
      </div>

      <div className="pt-12 px-3">
        <ResourcePanel />
      </div>

      <div className="flex flex-1 min-h-0 px-3 gap-3 pb-3">
        <div className="flex-1 min-w-0">
          <CityMap />
        </div>
        <div className="w-72 flex-shrink-0">
          <TaskPanel />
        </div>
      </div>

      {!dismissed && currentStep && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="relative pointer-events-auto max-w-md" style={{ margin: 'auto' }}>
            <div
              className={`relative p-4 rounded-lg shadow-xl fade-in ${POSITION_MAP[position]}`}
              style={{ background: '#1a2332', border: '1px solid rgba(0, 201, 167, 0.4)' }}
            >
              <div className={ARROW_MAP[position]} />

              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: '#ff6b35', color: '#fff' }}
                >
                  {stepIndex + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed" style={{ color: '#e8edf2' }}>
                    {currentStep.text}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs" style={{ color: '#8899aa' }}>
                      {stepIndex + 1} / {steps.length}
                    </span>
                    {stepIndex < steps.length - 1 ? (
                      <button
                        onClick={handleNext}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                        style={{ background: 'rgba(0, 201, 167, 0.15)', color: '#00c9a7' }}
                      >
                        下一步
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={handleFinish}
                        className="px-4 py-1.5 rounded text-sm font-bold transition-all hover:scale-105"
                        style={{ background: '#ff6b35', color: '#fff' }}
                      >
                        开始调度！
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {dismissed && (
        <div className="absolute top-14 right-4 z-20 fade-in">
          <button
            onClick={() => navigate(`/game/${level1.id}`)}
            className="px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105"
            style={{ background: '#ff6b35', color: '#fff', boxShadow: '0 4px 15px rgba(255,107,53,0.3)' }}
          >
            进入游戏
          </button>
        </div>
      )}
    </div>
  )
}
