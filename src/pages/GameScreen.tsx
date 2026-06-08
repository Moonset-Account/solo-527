import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Pause, Play, RotateCcw, ChevronLeft } from 'lucide-react'
import { useGameStore } from '@/stores/gameStore'
import { ALL_LEVELS } from '@/levels'
import { GameLoop } from '@/game/engine/GameLoop'
import { formatTime } from '@/types/game'
import CityMap from '@/game/map/CityMap'
import TaskPanel from '@/game/task/TaskPanel'
import ResourcePanel from '@/game/resource/ResourcePanel'
import EventAlert from '@/game/event/EventAlert'

export default function GameScreen() {
  const navigate = useNavigate()
  const { levelId } = useParams<{ levelId: string }>()
  const gameStore = useGameStore()
  const gameLoopRef = useRef<GameLoop | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    gameState,
    currentLevel,
    elapsedTime,
    currentDelay,
    currentCost,
    currentSatisfaction,
    tick,
    pauseGame,
    resumeGame,
    startGame,
    resetGame,
  } = gameStore

  useEffect(() => {
    const level = ALL_LEVELS.find((l) => l.id === levelId)
    if (level && gameState === 'idle') {
      startGame(level)
    }
  }, [levelId])

  useEffect(() => {
    const loop = new GameLoop()
    loop.setTickCallback((dt) => {
      useGameStore.getState().tick(dt)
    })
    gameLoopRef.current = loop
    loop.start()

    return () => {
      loop.stop()
      gameLoopRef.current = null
    }
  }, [])

  useEffect(() => {
    const loop = gameLoopRef.current
    if (!loop) return

    if (gameState === 'paused') {
      loop.pause()
    } else if (gameState === 'playing' && loop.isPaused()) {
      loop.resume()
    } else if (gameState === 'playing' && !loop.isRunning()) {
      loop.start()
    }
  }, [gameState])

  useEffect(() => {
    if (gameState === 'success' || gameState === 'failed') {
      gameLoopRef.current?.stop()
      const timer = setTimeout(() => {
        navigate(`/result/${levelId}`)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [gameState, levelId, navigate])

  const handlePause = useCallback(() => {
    if (gameState === 'playing') pauseGame()
  }, [gameState, pauseGame])

  const handleResume = useCallback(() => {
    if (gameState === 'paused') resumeGame()
  }, [gameState, resumeGame])

  const handleBack = useCallback(() => {
    if (gameState === 'playing') {
      pauseGame()
      setShowConfirm(true)
    } else {
      resetGame()
      navigate('/levels')
    }
  }, [gameState, pauseGame, resetGame, navigate])

  const confirmQuit = useCallback(() => {
    resetGame()
    navigate('/levels')
  }, [resetGame, navigate])

  const progress = currentLevel ? Math.min((elapsedTime / currentLevel.duration) * 100, 100) : 0

  return (
    <div className="relative w-full h-full flex flex-col" style={{ background: '#0f1923' }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid #2d4052' }}>
        <button
          onClick={handleBack}
          className="flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors"
          style={{ color: '#8899aa' }}
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-4">
          <span className="text-sm font-mono" style={{ color: '#e8edf2' }}>
            {formatTime(elapsedTime)} / {currentLevel ? formatTime(currentLevel.duration) : '0:00'}
          </span>

          {gameState === 'playing' && (
            <button onClick={handlePause} className="p-1.5 rounded transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#8899aa' }}>
              <Pause size={16} />
            </button>
          )}
        </div>
      </div>

      <ResourcePanel />

      <div className="flex flex-1 min-h-0 px-3 gap-3">
        <div className="flex-1 min-w-0">
          <CityMap />
        </div>
        <div className="w-72 flex-shrink-0">
          <TaskPanel />
        </div>
      </div>

      <div className="px-4 py-2" style={{ borderTop: '1px solid #2d4052' }}>
        <div className="flex items-center gap-4 mb-1.5">
          <div className="flex items-center gap-1.5 text-xs">
            <span style={{ color: '#ef4444' }}>延迟</span>
            <span className="font-mono font-bold" style={{ color: '#ef4444' }}>{currentDelay.toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span style={{ color: '#ff6b35' }}>成本</span>
            <span className="font-mono font-bold" style={{ color: '#ff6b35' }}>{currentCost.toFixed(0)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span style={{ color: '#00c9a7' }}>满意度</span>
            <span className="font-mono font-bold" style={{ color: '#00c9a7' }}>{currentSatisfaction.toFixed(0)}%</span>
          </div>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#1a2332' }}>
          <div
            className="h-full rounded-full progress-bar-fill"
            style={{
              width: `${progress}%`,
              background: progress < 70
                ? 'linear-gradient(90deg, #00c9a7, #00c9a7)'
                : 'linear-gradient(90deg, #ff6b35, #ef4444)',
            }}
          />
        </div>
      </div>

      <EventAlert />

      {gameState === 'paused' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center"
          style={{ background: 'rgba(15, 25, 35, 0.85)' }}>
          <div className="flex flex-col items-center gap-4">
            <p className="font-display text-2xl font-bold" style={{ color: '#e8edf2' }}>已暂停</p>
            <button
              onClick={handleResume}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all hover:scale-105"
              style={{ background: '#ff6b35', color: '#fff' }}
            >
              <Play size={18} />
              继续
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(15, 25, 35, 0.9)' }}>
          <div className="rounded-lg p-6 max-w-sm w-full mx-4" style={{ background: '#1a2332', border: '1px solid #2d4052' }}>
            <p className="text-base font-bold mb-4" style={{ color: '#e8edf2' }}>
              确定要退出当前游戏吗？
            </p>
            <p className="text-sm mb-5" style={{ color: '#8899aa' }}>
              退出后当前进度将丢失
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 rounded text-sm font-medium transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#8899aa', border: '1px solid #2d4052' }}
              >
                取消
              </button>
              <button
                onClick={confirmQuit}
                className="flex-1 py-2 rounded text-sm font-bold transition-colors"
                style={{ background: '#ef4444', color: '#fff' }}
              >
                退出
              </button>
            </div>
          </div>
        </div>
      )}

      {(gameState === 'success' || gameState === 'failed') && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(15, 25, 35, 0.6)' }}>
          <p className={`font-display text-4xl font-black ${gameState === 'failed' ? 'glitch-text' : ''}`}
            style={{ color: gameState === 'success' ? '#00c9a7' : '#ef4444' }}>
            {gameState === 'success' ? '任务完成' : '任务失败'}
          </p>
        </div>
      )}
    </div>
  )
}
