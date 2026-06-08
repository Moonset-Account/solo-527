import { create } from 'zustand'
import type { DebugLogEntry } from '@/types/game'

interface DebugStoreState {
  logs: DebugLogEntry[]
}

interface DebugStoreActions {
  addLog: (entry: DebugLogEntry) => void
  clearLogs: () => void
}

export const useDebugStore = create<DebugStoreState & DebugStoreActions>()((set) => ({
  logs: [],

  addLog: (entry) =>
    set((state) => ({
      logs: [...state.logs, entry],
    })),

  clearLogs: () => set({ logs: [] }),
}))
