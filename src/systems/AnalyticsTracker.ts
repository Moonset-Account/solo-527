import type { PlayerAnalytics, StepFailure, PuzzleRetry, ChapterTiming } from '@/types'

const STORAGE_KEY = 'old_apartment_analytics'

function createDefaultAnalytics(): PlayerAnalytics {
  return {
    sessionId: crypto.randomUUID(),
    tutorialSkipped: false,
    tutorialCompletedAt: null,
    stepFailures: [],
    puzzleRetries: [],
    totalHintsUsed: 0,
    chapterTimings: [],
    checkpointSaves: 0,
  }
}

class AnalyticsTracker {
  private data: PlayerAnalytics

  constructor() {
    this.data = this.load()
  }

  private load(): PlayerAnalytics {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored) as PlayerAnalytics
      }
    } catch {
      // ignore
    }
    return createDefaultAnalytics()
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data))
    } catch {
      // ignore
    }
  }

  getData(): PlayerAnalytics {
    return { ...this.data }
  }

  reset(): void {
    this.data = createDefaultAnalytics()
    this.save()
  }

  setTutorialSkipped(skipped: boolean): void {
    this.data.tutorialSkipped = skipped
    this.save()
  }

  setTutorialCompleted(): void {
    this.data.tutorialCompletedAt = Date.now()
    this.save()
  }

  recordStepFailure(chapterId: string, roomId: string, stepId: string): void {
    const existing = this.data.stepFailures.find(
      f => f.chapterId === chapterId && f.roomId === roomId && f.stepId === stepId
    )
    if (existing) {
      existing.failCount++
      existing.lastFailAt = Date.now()
    } else {
      this.data.stepFailures.push({
        chapterId,
        roomId,
        stepId,
        failCount: 1,
        lastFailAt: Date.now(),
      })
    }
    this.save()
  }

  recordPuzzleRetry(puzzleId: string): void {
    const existing = this.data.puzzleRetries.find(r => r.puzzleId === puzzleId)
    if (existing) {
      existing.retryCount++
      existing.timeSpent = Date.now() - (existing.timeSpent || Date.now())
    } else {
      this.data.puzzleRetries.push({
        puzzleId,
        retryCount: 1,
        hintsBeforeSolve: 0,
        timeSpent: Date.now(),
      })
    }
    this.save()
  }

  recordHintUsed(): void {
    this.data.totalHintsUsed++
    this.save()
  }

  startChapter(chapterId: string): void {
    const existing = this.data.chapterTimings.find(t => t.chapterId === chapterId && t.endTime === null)
    if (existing) {
      existing.startTime = Date.now()
    } else {
      this.data.chapterTimings.push({
        chapterId,
        startTime: Date.now(),
        endTime: null,
        completionTime: null,
      })
    }
    this.save()
  }

  completeChapter(chapterId: string): void {
    const timing = this.data.chapterTimings.find(t => t.chapterId === chapterId && t.endTime === null)
    if (timing) {
      timing.endTime = Date.now()
      timing.completionTime = timing.endTime - timing.startTime
    }
    this.save()
  }

  incrementCheckpoint(): void {
    this.data.checkpointSaves++
    this.save()
  }
}

const analyticsTracker = new AnalyticsTracker()
export default analyticsTracker