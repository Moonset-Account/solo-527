export class UIState {
  constructor(saveSystem) {
    this.saveSystem = saveSystem
    this.state = {
      currentLevelId: null,
      selectedLevel: null,
      selectedLearningCard: null,
      gameState: 'idle',
      hoveredElement: null,
      selectedTile: null,
      placedTiles: [],
      hintsShown: 0,
      score: 0,
      combo: 0,
      timeElapsed: 0,
      modalOpen: false,
      notification: null,
      toasts: []
    }
  }

  get(key) {
    return this.state[key]
  }

  set(key, value) {
    this.state[key] = value
  }

  resetGameState() {
    this.state.selectedTile = null
    this.state.placedTiles = []
    this.state.hintsShown = 0
    this.state.score = 0
    this.state.combo = 0
    this.state.timeElapsed = 0
    this.state.gameState = 'playing'
  }

  addToast(message, type = 'info', duration = 2000) {
    const toast = {
      id: Date.now() + Math.random(),
      message,
      type,
      duration,
      createdAt: Date.now()
    }
    this.state.toasts.push(toast)
    setTimeout(() => {
      const idx = this.state.toasts.indexOf(toast)
      if (idx > -1) this.state.toasts.splice(idx, 1)
    }, duration)
    return toast
  }

  showNotification(title, message, type = 'info') {
    this.state.notification = { title, message, type, time: Date.now() }
    setTimeout(() => {
      this.state.notification = null
    }, 3000)
  }

  addScore(points) {
    this.state.score += points
    this.state.combo += 1
    return this.state.score
  }

  resetCombo() {
    this.state.combo = 0
  }
}
