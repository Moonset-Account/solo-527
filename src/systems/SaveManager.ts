import type { GameState } from '@/types'

const SAVE_KEY = 'old_apartment_save'

class SaveManager {
  save(state: Partial<GameState>): void {
    try {
      const saveData = {
        currentChapter: state.currentChapter,
        currentRoom: state.currentRoom,
        inventory: state.inventory,
        notebook: state.notebook,
        clueLinks: state.clueLinks,
        puzzleStates: state.puzzleStates,
        hintPoints: state.hintPoints,
        chaptersUnlocked: state.chaptersUnlocked,
        tutorialCompleted: state.tutorialCompleted,
        tutorialSkipped: state.tutorialSkipped,
        totalPlayTime: state.totalPlayTime,
        savedAt: Date.now(),
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
    } catch {
      // ignore
    }
  }

  load(): Partial<GameState> | null {
    try {
      const stored = localStorage.getItem(SAVE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        return {
          currentChapter: data.currentChapter,
          currentRoom: data.currentRoom,
          inventory: data.inventory || [],
          notebook: data.notebook || [],
          clueLinks: data.clueLinks || [],
          puzzleStates: data.puzzleStates || {},
          hintPoints: data.hintPoints || 5,
          chaptersUnlocked: data.chaptersUnlocked || ['chapter1'],
          tutorialCompleted: data.tutorialCompleted || false,
          tutorialSkipped: data.tutorialSkipped || false,
          totalPlayTime: data.totalPlayTime || 0,
        }
      }
    } catch {
      // ignore
    }
    return null
  }

  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null
  }

  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY)
  }
}

const saveManager = new SaveManager()
export default saveManager