import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Star, RotateCcw, ChevronLeft, ArrowRight } from 'lucide-react'
import { useGameStore } from '@/stores/gameStore'
import { ALL_LEVELS } from '@/levels'
import { SaveManager } from '@/game/engine/SaveManager'
import { calculateStars } from '@/types/game'
import MetricsChart from '@/game/report/MetricsChart'
import DecisionTimeline from '@/game/report/DecisionTimeline'

export default function ResultScreen() {
  const navigate = useNavigate()
  const { levelId } = useParams<{ levelId: string }>()
  const { gameState, currentDelay, currentCost, currentSatisfaction, decisions, currentLevel, resetGame } = useGameStore()
  const [saved, setSaved] = useState(false)

  const isSuccess = gameState === 'success'
  const level = currentLevel ?? ALL_LEVELS.find((l) => l.id === levelId)
  const stars = level ? calculateStars(currentDelay, currentCost, currentSatisfaction, level.thresholds) : 0

  const levelIndex = ALL_LEVELS.findIndex((l) => l.id === levelId)
  const nextLevel = levelIndex >= 0 && levelIndex < ALL_LEVELS.length - 1 ? ALL_LEVELS[levelIndex + 1] : null

  useEffect(() => {
    if (saved || !levelId) return
    setSaved(true)

    const save = SaveManager.load() ?? { tutorialCompleted: true, levels: [], totalPlayTime: 0 }
    const existing = save.levels.find((l) => l.levelId === levelId)

    if (existing) {
      if (stars > existing.bestStars) {
        existing.bestStars = stars
        existing.bestResult = {
          levelId,
          success: isSuccess,
          totalDelay: currentDelay,
          totalCost: currentCost,
          finalSatisfaction: currentSatisfaction,
          stars,
          decisions,
        }
      }
      if (isSuccess) {
        existing.unlocked = true
      }
    } else {
      save.levels.push({
        levelId,
        bestStars: stars,
        unlocked: isSuccess || levelId === 'level-1',
        bestResult: {
          levelId,
          success: isSuccess,
          totalDelay: currentDelay,
          totalCost: currentCost,
          finalSatisfaction: currentSatisfaction,
          stars,
          decisions,
        },
      })
    }

    if (isSuccess && nextLevel) {
      const nextSave = save.levels.find((l) => l.levelId === nextLevel.id)
      if (nextSave) {
        nextSave.unlocked = true
      } else {
        save.levels.push({ levelId: nextLevel.id, bestStars: 0, unlocked: true })
      }
    }

    SaveManager.save(save)
  }, [levelId])

  const handleRetry = () => {
    resetGame()
    navigate(`/game/${levelId}`)
  }

  const handleBack = () => {
    resetGame()
    navigate('/levels')
  }

  const handleNext = () => {
    if (!nextLevel) return
    resetGame()
    navigate(`/game/${nextLevel.id}`)
  }

  const failReason = !isSuccess
    ? currentSatisfaction <= 0
      ? '市民满意度降至零，城市秩序崩溃'
      : (level && currentDelay >= level.thresholds.maxDelay)
        ? '响应延迟过高，错过了关键救援窗口'
        : (level && currentCost >= level.thresholds.maxCost)
          ? '调度成本超出预算上限'
          : '应急调度失败'
    : undefined

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto scrollbar-thin" style={{ background: '#0f1923' }}>
      <div className="flex-1 flex flex-col items-center justify-start px-6 py-10">
        {isSuccess ? (
          <>
            <h1 className="font-display text-4xl font-black mb-2 glow-green" style={{ color: '#00c9a7' }}>
              任务完成！
            </h1>

            <div className="flex gap-2 my-4">
              {[1, 2, 3].map((i) => (
                <Star
                  key={i}
                  size={36}
                  className={i <= stars ? 'star-fill' : ''}
                  fill={i <= stars ? '#ffc107' : 'none'}
                  style={{
                    color: i <= stars ? '#ffc107' : '#2d4052',
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>

            <div className="w-full max-w-2xl mb-6">
              <MetricsChart
                delay={currentDelay}
                cost={currentCost}
                satisfaction={currentSatisfaction}
                maxDelay={level?.thresholds.maxDelay ?? 100}
                maxCost={level?.thresholds.maxCost ?? 100}
              />
            </div>

            <div className="w-full max-w-2xl mb-6">
              <DecisionTimeline decisions={decisions} />
            </div>

            <div className="flex items-center gap-4 text-sm mb-8 px-6 py-3 rounded-lg"
              style={{ background: '#1a2332', border: '1px solid #2d4052' }}>
              <div className="flex items-center gap-2">
                <span style={{ color: '#ef4444' }}>延迟</span>
                <span className="font-mono font-bold" style={{ color: '#e8edf2' }}>{currentDelay.toFixed(0)}</span>
              </div>
              <div style={{ width: 1, height: 16, background: '#2d4052' }} />
              <div className="flex items-center gap-2">
                <span style={{ color: '#ff6b35' }}>成本</span>
                <span className="font-mono font-bold" style={{ color: '#e8edf2' }}>{currentCost.toFixed(0)}</span>
              </div>
              <div style={{ width: 1, height: 16, background: '#2d4052' }} />
              <div className="flex items-center gap-2">
                <span style={{ color: '#00c9a7' }}>满意度</span>
                <span className="font-mono font-bold" style={{ color: '#e8edf2' }}>{currentSatisfaction.toFixed(0)}%</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#8899aa', border: '1px solid #2d4052' }}
              >
                <ChevronLeft size={16} />
                返回关卡选择
              </button>
              {nextLevel && (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
                  style={{ background: '#ff6b35', color: '#fff' }}
                >
                  下一关
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <h1 className="font-display text-4xl font-black mb-4 glitch-text" style={{ color: '#ef4444' }}>
              任务失败
            </h1>

            {failReason && (
              <div className="px-6 py-3 rounded-lg mb-6"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                <p className="text-base font-bold" style={{ color: '#ef4444' }}>{failReason}</p>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm mb-8 px-6 py-3 rounded-lg"
              style={{ background: '#1a2332', border: '1px solid #2d4052' }}>
              <div className="flex items-center gap-2">
                <span style={{ color: '#ef4444' }}>延迟</span>
                <span className="font-mono font-bold" style={{ color: '#e8edf2' }}>{currentDelay.toFixed(0)}</span>
              </div>
              <div style={{ width: 1, height: 16, background: '#2d4052' }} />
              <div className="flex items-center gap-2">
                <span style={{ color: '#ff6b35' }}>成本</span>
                <span className="font-mono font-bold" style={{ color: '#e8edf2' }}>{currentCost.toFixed(0)}</span>
              </div>
              <div style={{ width: 1, height: 16, background: '#2d4052' }} />
              <div className="flex items-center gap-2">
                <span style={{ color: '#00c9a7' }}>满意度</span>
                <span className="font-mono font-bold" style={{ color: '#e8edf2' }}>{currentSatisfaction.toFixed(0)}%</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#8899aa', border: '1px solid #2d4052' }}
              >
                <ChevronLeft size={16} />
                返回关卡选择
              </button>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
                style={{ background: '#ff6b35', color: '#fff' }}
              >
                <RotateCcw size={16} />
                重试
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
