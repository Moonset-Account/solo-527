import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ErrorFeedback, HintResult, ScoreResult, SessionRecord, ChoiceRecord } from '@/types'
import { PuzzleEngine } from '@/game/PuzzleEngine'
import { ScoreCalculator } from '@/game/ScoreCalculator'
import chaptersConfig from '@/config/chapters.json'

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
    const placed = puzzleEngine.value.placeChar(charId, slotIndex)
    if (!placed) return null
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
    puzzleEngine.value?.removeChar(slotIndex)
  }

  function resetPuzzle() {
    puzzleEngine.value?.reset()
    elapsedTime.value = 0
    errorFeedback.value = null
    lastHint.value = null
    isComplete.value = false
    scoreResult.value = null
  }

  function useHint(type: 'tone' | 'imagery' | 'position'): HintResult | null {
    if (!puzzleEngine.value) return null
    const result = puzzleEngine.value.getHint(type)
    lastHint.value = result
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

  function recordSession(result: 'success' | 'quit') {
    const record: SessionRecord = {
      levelId: currentLevelId.value,
      chapterId: currentChapterId.value,
      startTime: Date.now() - elapsedTime.value * 1000,
      endTime: Date.now(),
      duration: elapsedTime.value,
      failureCount: errorsCount.value,
      hintsUsed: hintsUsed.value,
      keyChoices: [],
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
    initGame,
    setPuzzleEngine,
    tick,
    placeChar,
    removeChar,
    resetPuzzle,
    useHint,
    calculateScore,
    recordSession,
    clearErrorFeedback,
  }
})
