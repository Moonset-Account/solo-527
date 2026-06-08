import { create } from 'zustand';
import type { DebugLogEntry } from '@/types';

const MAX_LOGS = 500;

interface DebugStore {
  logs: DebugLogEntry[];
  fps: number;
  isRecording: boolean;
  addLog: (action: string, details: string, state?: Record<string, unknown>) => void;
  clearLogs: () => void;
  setFps: (fps: number) => void;
  toggleRecording: () => void;
}

export const useDebugStore = create<DebugStore>()((set) => ({
  logs: [],
  fps: 0,
  isRecording: true,

  addLog: (action, details, state) =>
    set((prev) => {
      const entry: DebugLogEntry = {
        timestamp: Date.now(),
        action,
        details,
        state,
      };
      const next = [...prev.logs, entry];
      if (next.length > MAX_LOGS) {
        return { logs: next.slice(next.length - MAX_LOGS) };
      }
      return { logs: next };
    }),

  clearLogs: () => set({ logs: [] }),

  setFps: (fps) => set({ fps }),

  toggleRecording: () => set((state) => ({ isRecording: !state.isRecording })),
}));
