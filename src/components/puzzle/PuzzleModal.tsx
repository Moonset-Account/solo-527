import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronUp, ChevronDown, Lightbulb } from 'lucide-react'
import useGameStore from '@/systems/GameStateManager'
import chapterManager from '@/systems/ChapterManager'
import analyticsTracker from '@/systems/AnalyticsTracker'
import HintDisplay from './HintDisplay'

interface PuzzleModalProps {
  puzzleId: string
  onSolve: () => void
  onClose: () => void
  onUseHint: () => void
}

const HINT_COSTS: Record<number, number> = { 1: 1, 2: 2, 3: 3 }

export default function PuzzleModal({ puzzleId, onSolve, onClose, onUseHint }: PuzzleModalProps) {
  const puzzleState = useGameStore((s) => s.puzzleStates[puzzleId])
  const hintPoints = useGameStore((s) => s.hintPoints)
  const updatePuzzleState = useGameStore((s) => s.updatePuzzleState)
  const useHintPoint = useGameStore((s) => s.useHintPoint)
  const clearActivePuzzle = useGameStore((s) => s.clearActivePuzzle)

  const puzzleConfig = chapterManager.getPuzzle(puzzleId)

  const [inputValues, setInputValues] = useState<string[]>(
    puzzleState?.currentInput && typeof puzzleState.currentInput === 'string'
      ? puzzleState.currentInput.split('')
      : ['0', '0', '0', '0']
  )
  const [wheelValues, setWheelValues] = useState<number[]>(
    puzzleState?.currentInput
      ? (puzzleState.currentInput as number[])
      : [0, 0, 0, 0]
  )
  const [currentHintLevel, setCurrentHintLevel] = useState<number>(puzzleState?.hintsUsed || 0)
  const [solved, setSolved] = useState(puzzleState?.solved || false)
  const [failed, setFailed] = useState(false)
  const [narrativeShown, setNarrativeShown] = useState(false)

  const attempts = puzzleState?.attempts || 0
  const failCount = puzzleState?.failCount || 0
  const puzzleType = puzzleConfig?.type || 'code'

  const checkSolution = useCallback(() => {
    if (!puzzleConfig) return false

    let isCorrect = false

    if (puzzleType === 'code') {
      const submitted = inputValues.join('')
      const solution = puzzleConfig.solution as string
      isCorrect = submitted === solution
      updatePuzzleState(puzzleId, {
        currentInput: inputValues.join(''),
        attempts: attempts + 1,
      })
    } else {
      const solution = puzzleConfig.solution as number[]
      isCorrect = wheelValues.every((v, i) => v === solution[i])
      updatePuzzleState(puzzleId, {
        currentInput: wheelValues,
        attempts: attempts + 1,
      })
    }

    if (isCorrect) {
      setSolved(true)
      updatePuzzleState(puzzleId, { solved: true })
      setTimeout(() => setNarrativeShown(true), 600)
      setTimeout(() => onSolve(), 2500)
    } else {
      setFailed(true)
      const newFailCount = failCount + 1
      updatePuzzleState(puzzleId, { failCount: newFailCount })
      analyticsTracker.recordPuzzleRetry(puzzleId)
      setTimeout(() => setFailed(false), 600)
    }
  }, [puzzleConfig, puzzleType, inputValues, wheelValues, attempts, failCount, puzzleId, updatePuzzleState, onSolve])

  const handleHint = useCallback(() => {
    if (!puzzleConfig) return
    const nextLevel = currentHintLevel + 1
    if (nextLevel > 3) return
    const cost = HINT_COSTS[nextLevel]
    if (hintPoints < cost) return

    useHintPoint(cost)
    setCurrentHintLevel(nextLevel)
    updatePuzzleState(puzzleId, { hintsUsed: nextLevel })
    analyticsTracker.recordHintUsed()
    onUseHint()
  }, [puzzleConfig, currentHintLevel, hintPoints, puzzleId, useHintPoint, updatePuzzleState, onUseHint])

  const handleCodeInput = useCallback((index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1)
    setInputValues((prev) => {
      const next = [...prev]
      next[index] = digit || '0'
      return next
    })
  }, [])

  const handleWheelUp = useCallback((index: number) => {
    setWheelValues((prev) => {
      const next = [...prev]
      next[index] = (next[index] + 1) % 10
      return next
    })
  }, [])

  const handleWheelDown = useCallback((index: number) => {
    setWheelValues((prev) => {
      const next = [...prev]
      next[index] = (next[index] - 1 + 10) % 10
      return next
    })
  }, [])

  const handleClose = useCallback(() => {
    clearActivePuzzle()
    onClose()
  }, [clearActivePuzzle, onClose])

  if (!puzzleConfig) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/80" onClick={handleClose} />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{
          scale: solved ? 1.02 : failed ? [1, 1.02, 1, 1.02, 1] : 1,
          opacity: 1,
        }}
        transition={{ duration: 0.3 }}
        className={`relative w-full max-w-md mx-4 rounded-lg border overflow-hidden ${
          solved
            ? 'border-green-500/60 shadow-[0_0_40px_rgba(34,197,94,0.3)]'
            : failed
            ? 'border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
            : 'border-[#5a5040]/60'
        }`}
        style={{
          background: 'linear-gradient(145deg, #2a2520 0%, #1a1612 40%, #252018 100%)',
        }}
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-amber-200/40 hover:text-amber-200 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(200,168,110,0.1) 2px, rgba(200,168,110,0.1) 3px)',
          }}
        />

        <div className="relative p-6">
          <p className="font-serif text-amber-200/90 text-center text-sm leading-relaxed mb-6">
            {puzzleConfig.description}
          </p>

          <AnimatePresence mode="wait">
            {puzzleType === 'code' ? (
              <motion.div
                key="code"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center gap-3 mb-6"
              >
                {inputValues.map((val, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val === '0' && !inputValues[i] ? '' : val}
                    onChange={(e) => handleCodeInput(i, e.target.value)}
                    className="w-14 h-16 text-center text-2xl font-bold text-amber-200 rounded border border-[#5a5040]/80 bg-[#1a1612]/80 shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)] focus:outline-none focus:border-amber-600/60 focus:shadow-[0_0_12px_rgba(200,168,110,0.2)] transition-all"
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="combination"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center gap-4 mb-6"
              >
                {wheelValues.map((val, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handleWheelUp(i)}
                      className="w-12 h-8 flex items-center justify-center text-amber-200/50 hover:text-amber-200 hover:bg-amber-900/20 rounded transition-colors"
                    >
                      <ChevronUp size={20} />
                    </button>
                    <div
                      className="w-12 h-14 flex items-center justify-center text-2xl font-bold text-amber-200 rounded border border-[#5a5040]/80 bg-[#1a1612]/80 shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)]"
                    >
                      {val}
                    </div>
                    <button
                      onClick={() => handleWheelDown(i)}
                      className="w-12 h-8 flex items-center justify-center text-amber-200/50 hover:text-amber-200 hover:bg-amber-900/20 rounded transition-colors"
                    >
                      <ChevronDown size={20} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={checkSolution}
              disabled={solved}
              className="px-6 py-2.5 rounded font-serif text-sm text-amber-100 tracking-wide border border-[#5a5040]/80 transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(180deg, #4a4035 0%, #2a2520 100%)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(200,168,110,0.15)',
              }}
            >
              提交
            </button>

            <button
              onClick={handleHint}
              disabled={solved || currentHintLevel >= 3 || hintPoints < HINT_COSTS[currentHintLevel + 1]}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded font-serif text-sm text-amber-300/70 hover:text-amber-300 border border-amber-800/30 hover:border-amber-700/50 bg-amber-950/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Lightbulb size={16} />
              <span>L{currentHintLevel + 1}</span>
              <span className="text-xs text-amber-400/50">(-{HINT_COSTS[currentHintLevel + 1] || 0}pts)</span>
            </button>
          </div>

          <div className="text-center text-xs text-amber-200/30 mb-2">
            失败次数: {failCount}
          </div>

          {currentHintLevel > 0 && puzzleConfig.hints[currentHintLevel - 1] && (
            <HintDisplay
              hintText={puzzleConfig.hints[currentHintLevel - 1]}
              level={currentHintLevel as 1 | 2 | 3}
            />
          )}

          <AnimatePresence>
            {solved && narrativeShown && puzzleConfig.narrativeOnSolve && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 px-4 py-3 rounded border border-green-800/40 bg-green-950/20 text-center"
              >
                <p className="font-serif text-sm text-green-300/80 italic leading-relaxed">
                  {puzzleConfig.narrativeOnSolve}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
