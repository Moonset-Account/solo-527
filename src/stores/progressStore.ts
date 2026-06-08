import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChapterProgress, LevelProgress, PlayStats, SaveData } from '@/types'
import chaptersConfig from '@/config/chapters.json'

export const useProgressStore = defineStore('progress', () => {
  const chapters = ref<ChapterProgress[]>(
    chaptersConfig.map((ch) => ({
      chapterId: ch.id,
      levels: ch.levels.map((lv) => ({
        levelId: lv.id,
        stars: 0,
        bestTime: 0,
        completed: false,
        attempts: 0,
      })),
    }))
  )

  const stats = ref<PlayStats>({
    totalPlayTime: 0,
    totalLevels: 0,
    totalStars: 0,
    perfectClears: 0,
  })

  const unlockedCards = ref<string[]>(['card_rumengling'])
  const tutorialCompleted = ref(false)

  const isChapterUnlocked = computed(() => {
    return (chapterId: string) => {
      const ch = chaptersConfig.find((c) => c.id === chapterId)
      if (!ch) return false
      if (ch.unlockRequirement === 'none') return true
      const match = ch.unlockRequirement.match(/^complete\s+(.+)$/)
      if (!match) return false
      const reqChapterId = match[1]
      const progress = chapters.value.find((c) => c.chapterId === reqChapterId)
      if (!progress) return false
      return progress.levels.every((lv) => lv.completed)
    }
  })

  const isLevelUnlocked = computed(() => {
    return (chapterId: string, levelId: string) => {
      if (!isChapterUnlocked.value(chapterId)) return false
      const ch = chaptersConfig.find((c) => c.id === chapterId)
      if (!ch) return false
      const lv = ch.levels.find((l) => l.id === levelId)
      if (!lv) return false
      if (lv.unlockCondition === 'none') return true
      const match = lv.unlockCondition.match(/^complete\s+(.+)$/)
      if (!match) return false
      const reqLevelId = match[1]
      const chapterProgress = chapters.value.find((c) => c.chapterId === chapterId)
      if (!chapterProgress) return false
      const reqLevel = chapterProgress.levels.find((l) => l.levelId === reqLevelId)
      return reqLevel?.completed ?? false
    }
  })

  const getLevelStars = (chapterId: string, levelId: string): number => {
    const chapterProgress = chapters.value.find((c) => c.chapterId === chapterId)
    if (!chapterProgress) return 0
    const levelProgress = chapterProgress.levels.find((l) => l.levelId === levelId)
    return levelProgress?.stars ?? 0
  }

  const getChapterStars = (chapterId: string): number => {
    const chapterProgress = chapters.value.find((c) => c.chapterId === chapterId)
    if (!chapterProgress) return 0
    return chapterProgress.levels.reduce((sum, lv) => sum + lv.stars, 0)
  }

  const getChapterMaxStars = (chapterId: string): number => {
    const ch = chaptersConfig.find((c) => c.id === chapterId)
    return ch ? ch.levels.length * 3 : 0
  }

  function completeLevel(chapterId: string, levelId: string, stars: number, time: number) {
    const chapterProgress = chapters.value.find((c) => c.chapterId === chapterId)
    if (!chapterProgress) return
    const levelProgress = chapterProgress.levels.find((l) => l.levelId === levelId)
    if (!levelProgress) return
    levelProgress.completed = true
    levelProgress.stars = Math.max(levelProgress.stars, stars)
    levelProgress.bestTime = levelProgress.bestTime === 0 ? time : Math.min(levelProgress.bestTime, time)
    levelProgress.attempts++
    stats.value.totalLevels = chapters.value.reduce(
      (sum, ch) => sum + ch.levels.filter((lv) => lv.completed).length,
      0
    )
    stats.value.totalStars = chapters.value.reduce(
      (sum, ch) => sum + ch.levels.reduce((s, lv) => s + lv.stars, 0),
      0
    )
  }

  function unlockCard(cardId: string) {
    if (!unlockedCards.value.includes(cardId)) {
      unlockedCards.value.push(cardId)
    }
  }

  function isCardUnlocked(cardId: string): boolean {
    return unlockedCards.value.includes(cardId)
  }

  function getSaveData(): SaveData {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      progress: chapters.value,
      stats: stats.value,
      settings: {
        musicVolume: 0.5,
        sfxVolume: 0.7,
        showFps: false,
        frameRateMode: 'auto',
        inputMapping: {},
      },
      unlockedCards: unlockedCards.value,
      analytics: { sessions: [] },
      tutorialCompleted: tutorialCompleted.value,
    }
  }

  function loadSaveData(data: SaveData) {
    chapters.value = data.progress
    stats.value = data.stats
    unlockedCards.value = data.unlockedCards
    tutorialCompleted.value = data.tutorialCompleted
  }

  function resetProgress() {
    chapters.value = chaptersConfig.map((ch) => ({
      chapterId: ch.id,
      levels: ch.levels.map((lv) => ({
        levelId: lv.id,
        stars: 0,
        bestTime: 0,
        completed: false,
        attempts: 0,
      })),
    }))
    stats.value = { totalPlayTime: 0, totalLevels: 0, totalStars: 0, perfectClears: 0 }
    unlockedCards.value = ['card_rumengling']
    tutorialCompleted.value = false
  }

  function hasSaveData(): boolean {
    return chapters.value.some((ch) => ch.levels.some((lv) => lv.completed))
  }

  return {
    chapters,
    stats,
    unlockedCards,
    tutorialCompleted,
    isChapterUnlocked,
    isLevelUnlocked,
    getLevelStars,
    getChapterStars,
    getChapterMaxStars,
    completeLevel,
    unlockCard,
    isCardUnlocked,
    getSaveData,
    loadSaveData,
    resetProgress,
    hasSaveData,
  }
})
