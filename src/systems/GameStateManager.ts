import { create } from 'zustand'
import type { GameState, Clue, PuzzleState } from '@/types'

interface GameActions {
  setPhase: (phase: GameState['gamePhase']) => void
  enterRoom: (roomId: string) => void
  setChapter: (chapterId: string) => void
  addClue: (clue: Clue) => void
  addClueLink: (from: string, to: string) => void
  removeClueLink: (from: string, to: string) => void
  addItem: (itemId: string) => void
  removeItem: (itemId: string) => void
  updatePuzzleState: (puzzleId: string, updates: Partial<PuzzleState>) => void
  setHintPoints: (n: number) => void
  useHintPoint: (cost: number) => void
  unlockChapter: (chapterId: string) => void
  completeTutorial: () => void
  skipTutorial: () => void
  setNarrativeText: (text: string) => void
  clearNarrative: () => void
  examineItem: (itemId: string) => void
  stopExamining: () => void
  setActivePuzzle: (puzzleId: string) => void
  clearActivePuzzle: () => void
  resetGame: () => void
  incrementPlayTime: (ms: number) => void
}

const initialState: GameState = {
  currentChapter: 'chapter1',
  currentRoom: 'room_201',
  inventory: [],
  notebook: [],
  clueLinks: [],
  puzzleStates: {},
  hintPoints: 5,
  chaptersUnlocked: ['chapter1'],
  tutorialCompleted: false,
  tutorialSkipped: false,
  totalPlayTime: 0,
  gamePhase: 'menu',
  activePuzzleId: null,
  narrativeText: null,
  itemBeingExamined: null,
}

const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ gamePhase: phase }),

  enterRoom: (roomId) => set({ currentRoom: roomId }),

  setChapter: (chapterId) => set({ currentChapter: chapterId }),

  addClue: (clue) =>
    set((state) => {
      if (state.notebook.some((c) => c.id === clue.id)) return state
      return { notebook: [...state.notebook, clue] }
    }),

  addClueLink: (from, to) =>
    set((state) => ({
      clueLinks: [...state.clueLinks, { from, to }],
    })),

  removeClueLink: (from, to) =>
    set((state) => ({
      clueLinks: state.clueLinks.filter(
        (link) => !(link.from === from && link.to === to),
      ),
    })),

  addItem: (itemId) =>
    set((state) => ({
      inventory: [...state.inventory, itemId],
    })),

  removeItem: (itemId) =>
    set((state) => ({
      inventory: state.inventory.filter((id) => id !== itemId),
    })),

  updatePuzzleState: (puzzleId, updates) =>
    set((state) => ({
      puzzleStates: {
        ...state.puzzleStates,
        [puzzleId]: { ...state.puzzleStates[puzzleId], ...updates } as PuzzleState,
      },
    })),

  setHintPoints: (n) => set({ hintPoints: n }),

  useHintPoint: (cost) =>
    set((state) => ({ hintPoints: Math.max(0, state.hintPoints - cost) })),

  unlockChapter: (chapterId) =>
    set((state) => {
      if (state.chaptersUnlocked.includes(chapterId)) return state
      return { chaptersUnlocked: [...state.chaptersUnlocked, chapterId] }
    }),

  completeTutorial: () => set({ tutorialCompleted: true }),

  skipTutorial: () => set({ tutorialSkipped: true }),

  setNarrativeText: (text) => set({ narrativeText: text }),

  clearNarrative: () => set({ narrativeText: null }),

  examineItem: (itemId) => set({ itemBeingExamined: itemId }),

  stopExamining: () => set({ itemBeingExamined: null }),

  setActivePuzzle: (puzzleId) => set({ activePuzzleId: puzzleId }),

  clearActivePuzzle: () => set({ activePuzzleId: null }),

  resetGame: () => set(initialState),

  incrementPlayTime: (ms) =>
    set((state) => ({ totalPlayTime: state.totalPlayTime + ms })),
}))

export default useGameStore
