import type { SessionRecord } from '@/types'

export function useAnalytics() {
  function trackEvent(event: string, data?: Record<string, unknown>) {
    console.log(`[Analytics] ${event}`, data)
  }

  function trackLevelStart(chapterId: string, levelId: string) {
    trackEvent('level_start', { chapterId, levelId })
  }

  function trackLevelComplete(record: SessionRecord) {
    trackEvent('level_complete', {
      levelId: record.levelId,
      chapterId: record.chapterId,
      score: record.score,
      stars: record.stars,
      duration: record.duration,
    })
  }

  function trackLevelQuit(record: SessionRecord) {
    trackEvent('level_quit', {
      levelId: record.levelId,
      chapterId: record.chapterId,
      duration: record.duration,
    })
  }

  function trackHintUsed(type: string, levelId: string) {
    trackEvent('hint_used', { type, levelId })
  }

  function trackPageView(page: string) {
    trackEvent('page_view', { page })
  }

  return {
    trackEvent,
    trackLevelStart,
    trackLevelComplete,
    trackLevelQuit,
    trackHintUsed,
    trackPageView,
  }
}
