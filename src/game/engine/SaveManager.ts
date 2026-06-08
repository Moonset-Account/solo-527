import type { GameSave } from '@/types/game'

const SAVE_KEY = 'mini-city-save'

export class SaveManager {
  static save(data: GameSave): void {
    try {
      const serialized = JSON.stringify(data)
      localStorage.setItem(SAVE_KEY, serialized)
    } catch {
      console.error('Failed to save game data')
    }
  }

  static load(): GameSave | null {
    try {
      const serialized = localStorage.getItem(SAVE_KEY)
      if (!serialized) return null
      return JSON.parse(serialized) as GameSave
    } catch {
      console.error('Failed to load game data')
      return null
    }
  }

  static clear(): void {
    try {
      localStorage.removeItem(SAVE_KEY)
    } catch {
      console.error('Failed to clear game data')
    }
  }

  static hasSave(): boolean {
    try {
      return localStorage.getItem(SAVE_KEY) !== null
    } catch {
      return false
    }
  }
}
