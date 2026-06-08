const STORAGE_KEY = 'poetry_puzzle_save_v1'

const DEFAULT_SAVE = {
  playerName: '墨客',
  currentLevel: 0,
  unlockedLevels: [0],
  levelScores: {},
  totalCoins: 0,
  totalStars: 0,
  unlockedLearningCards: [],
  settings: {
    sfxVolume: 0.8,
    bgmVolume: 0.3,
    sfxMuted: false,
    bgmMuted: false,
    difficulty: 'normal',
    showHints: true
  },
  statistics: {
    gamesPlayed: 0,
    puzzlesSolved: 0,
    hintsUsed: 0,
    wrongAttempts: 0,
    perfectLevels: 0,
    totalTimePlayed: 0
  },
  lastPlayedTime: null
}

export class SaveSystem {
  constructor() {
    this.data = this._load()
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return { ...DEFAULT_SAVE }
      const parsed = JSON.parse(raw)
      return {
        ...DEFAULT_SAVE,
        ...parsed,
        settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings || {}) },
        statistics: { ...DEFAULT_SAVE.statistics, ...(parsed.statistics || {}) },
        levelScores: parsed.levelScores || {},
        unlockedLevels: parsed.unlockedLevels || [0],
        unlockedLearningCards: parsed.unlockedLearningCards || []
      }
    } catch (e) {
      console.error('Failed to load save:', e)
      return { ...DEFAULT_SAVE }
    }
  }

  save() {
    try {
      this.data.lastPlayedTime = Date.now()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data))
      return true
    } catch (e) {
      console.error('Failed to save:', e)
      return false
    }
  }

  get(key, defaultValue = null) {
    if (key in this.data) return this.data[key]
    const keys = key.split('.')
    let val = this.data
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k]
      } else {
        return defaultValue
      }
    }
    return val
  }

  set(key, value) {
    if (key.includes('.')) {
      const keys = key.split('.')
      let obj = this.data
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in obj)) obj[keys[i]] = {}
        obj = obj[keys[i]]
      }
      obj[keys[keys.length - 1]] = value
    } else {
      this.data[key] = value
    }
    this.save()
  }

  getLevelScore(levelId) {
    return this.data.levelScores[levelId] || null
  }

  setLevelScore(levelId, score, stars, coins) {
    const existing = this.data.levelScores[levelId]
    if (!existing || score > existing.score) {
      this.data.levelScores[levelId] = {
        score,
        stars,
        coins,
        timestamp: Date.now()
      }
    }
    this.data.totalCoins += coins
    this.data.totalStars += stars
    this.save()
  }

  isLevelUnlocked(levelId) {
    return this.data.unlockedLevels.includes(levelId)
  }

  unlockLevel(levelId) {
    if (!this.data.unlockedLevels.includes(levelId)) {
      this.data.unlockedLevels.push(levelId)
      this.save()
    }
  }

  isLearningCardUnlocked(cardId) {
    return this.data.unlockedLearningCards.includes(cardId)
  }

  unlockLearningCard(cardId) {
    if (!this.data.unlockedLearningCards.includes(cardId)) {
      this.data.unlockedLearningCards.push(cardId)
      this.save()
    }
  }

  addStatistic(key, amount = 1) {
    if (key in this.data.statistics) {
      this.data.statistics[key] += amount
      this.save()
    }
  }

  getSettings() {
    return { ...this.data.settings }
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings }
    this.save()
  }

  reset() {
    this.data = { ...DEFAULT_SAVE }
    this.save()
  }

  exportSave() {
    return JSON.stringify(this.data)
  }

  importSave(jsonString) {
    try {
      const parsed = JSON.parse(jsonString)
      this.data = {
        ...DEFAULT_SAVE,
        ...parsed,
        settings: { ...DEFAULT_SAVE.settings, ...(parsed.settings || {}) },
        statistics: { ...DEFAULT_SAVE.statistics, ...(parsed.statistics || {}) }
      }
      this.save()
      return true
    } catch (e) {
      return false
    }
  }
}
