import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ErrorFeedback, HintResult, ScoreResult, SessionRecord, ChoiceRecord } from '@/types'
import { PuzzleEngine } from '@/game/PuzzleEngine'
import { ScoreCalculator } from '@/game/ScoreCalculator'
import chaptersConfig from '@/config/chapters.json'

interface UndoAction {
  type: 'place' | 'remove' | 'swap'
  charId: string
  slotIndex: number
  prevSlotIndex: number | null
  otherCharId?: string
  otherSlotIndex?: number
}

export const useGameStore = defineStore('game', () => {
  const currentChapterId = ref('')
  const currentLevelId = ref('')
  const puzzleEngine = ref<PuzzleEngine | null>(null)
  const elapsedTime = ref(0)
  const errorFeedback = ref<ErrorFeedback | null>(null)
  const lastHint = ref<HintResult | null>(null)
  const isComplete = ref(false)
  const scoreResult = ref<ScoreResult | null>(null)
  const isPaused = ref(false)
  const sessions = ref<SessionRecord[]>([])
  const keyChoices = ref<ChoiceRecord[]>([])
  const undoStack = ref<UndoAction[]>([])

  const hintPoints = computed(() => {
    if (!puzzleEngine.value) return 0
    return (puzzleEngine.value as any).hintSystem?.getRemainingPoints?.() ?? 0
  })

  const errorsCount = computed(() => puzzleEngine.value?.getErrorsCount() ?? 0)
  const hintsUsed = computed(() => puzzleEngine.value?.getHintsUsed() ?? 0)

  function initGame(chapterId: string, levelId: string) {
    currentChapterId.value = chapterId
    currentLevelId.value = levelId
    isComplete.value = false
    errorFeedback.value = null
    lastHint.value = null
    scoreResult.value = null
    isPaused.value = false
    elapsedTime.value = 0
    keyChoices.value = []
    undoStack.value = []
  }

  function setPuzzleEngine(engine: PuzzleEngine) {
    puzzleEngine.value = engine
  }

  function tick(dt: number) {
    if (!isPaused.value && !isComplete.value) {
      elapsedTime.value += dt
    }
  }

  function placeChar(charId: string, slotIndex: number): ErrorFeedback | null {
    if (!puzzleEngine.value) return null
    const chars = puzzleEngine.value.getChars()
    const ch = chars.find((c) => c.id === charId)
    const prevSlot = ch?.slotIndex ?? null
    const placed = puzzleEngine.value.placeChar(charId, slotIndex)
    if (!placed) return null
    undoStack.value.push({ type: 'place', charId, slotIndex, prevSlotIndex: prevSlot })
    const error = puzzleEngine.value.checkPlacement(slotIndex)
    if (error) {
      errorFeedback.value = error
      return error
    }
    errorFeedback.value = null
    if (puzzleEngine.value.checkComplete()) {
      isComplete.value = true
    }
    return null
  }

  function removeChar(slotIndex: number) {
    if (!puzzleEngine.value) return
    const chars = puzzleEngine.value.getChars()
    const ch = chars.find((c) => c.slotIndex === slotIndex)
    if (!ch) return
    undoStack.value.push({ type: 'remove', charId: ch.id, slotIndex, prevSlotIndex: null })
    puzzleEngine.value.removeChar(slotIndex)
  }

  function swapChars(slotA: number, slotB: number) {
    if (!puzzleEngine.value) return
    const chars = puzzleEngine.value.getChars()
    const chA = chars.find((c) => c.slotIndex === slotA)
    const chB = chars.find((c) => c.slotIndex === slotB)
    if (!chA || !chB) return
    undoStack.value.push({ type: 'swap', charId: chA.id, slotIndex: slotB, prevSlotIndex: slotA, otherCharId: chB.id, otherSlotIndex: slotA })
    puzzleEngine.value.swapChars(slotA, slotB)
  }

  function undo() {
    if (!puzzleEngine.value) return
    const action = undoStack.value.pop()
    if (!action) return
    if (action.type === 'place') {
      puzzleEngine.value.removeChar(action.slotIndex)
      if (action.prevSlotIndex !== null) {
        puzzleEngine.value.placeChar(action.charId, action.prevSlotIndex)
      }
    } else if (action.type === 'remove') {
      puzzleEngine.value.placeChar(action.charId, action.slotIndex)
    } else if (action.type === 'swap' && action.otherCharId) {
      puzzleEngine.value.swapChars(action.slotIndex, action.otherSlotIndex ?? 0)
    }
    errorFeedback.value = null
  }

  function resetPuzzle() {
    puzzleEngine.value?.reset()
    elapsedTime.value = 0
    errorFeedback.value = null
    lastHint.value = null
    isComplete.value = false
    scoreResult.value = null
    keyChoices.value = []
    undoStack.value = []
  }

  function useHint(type: 'tone' | 'imagery' | 'position'): HintResult | null {
    if (!puzzleEngine.value) return null
    const result = puzzleEngine.value.getHint(type)
    lastHint.value = result
    if (result.cost > 0) {
      recordChoice({
        timestamp: Date.now(),
        type: 'hint',
        detail: `使用${type === 'tone' ? '声调' : type === 'imagery' ? '意象' : '位置'}提示`,
        correct: false,
      })
    }
    return result
  }

  function calculateScore(): ScoreResult {
    const chapter = chaptersConfig.find((c) => c.id === currentChapterId.value)
    const level = chapter?.levels.find((l) => l.id === currentLevelId.value)
    if (!chapter || !level) {
      return { baseScore: 0, timeBonus: 0, hintPenalty: 0, errorPenalty: 0, totalScore: 0, stars: 0 }
    }
    const calculator = new ScoreCalculator()
    const result = calculator.calculate({
      baseScore: 1000,
      timeUsed: elapsedTime.value,
      timeLimit: level.timeLimit,
      hintsUsed: hintsUsed.value,
      errorsCount: errorsCount.value,
      difficulty: level.difficulty,
      multiplier: chapter.rules.scoreMultiplier,
    })
    scoreResult.value = result
    return result
  }

  function recordChoice(choice: ChoiceRecord) {
    keyChoices.value.push(choice)
  }

  function recordSession(result: 'success' | 'quit') {
    const record: SessionRecord = {
      levelId: currentLevelId.value,
      chapterId: currentChapterId.value,
      startTime: Date.now() - elapsedTime.value * 1000,
      endTime: Date.now(),
      duration: elapsedTime.value,
      failureCount: errorsCount.value,
      hintsUsed: hintsUsed.value,
      keyChoices: [...keyChoices.value],
      result,
      score: scoreResult.value?.totalScore ?? 0,
      stars: scoreResult.value?.stars ?? 0,
    }
    sessions.value.push(record)
  }

  function clearErrorFeedback() {
    errorFeedback.value = null
  }

  return {
    currentChapterId,
    currentLevelId,
    puzzleEngine,
    elapsedTime,
    errorFeedback,
    lastHint,
    isComplete,
    scoreResult,
    isPaused,
    sessions,
    hintPoints,
    errorsCount,
    hintsUsed,
    keyChoices,
    undoStack,
    initGame,
    setPuzzleEngine,
    tick,
    placeChar,
    removeChar,
    swapChars,
    undo,
    resetPuzzle,
    useHint,
    calculateScore,
    recordChoice,
    recordSession,
    clearErrorFeedback,
  }
})
