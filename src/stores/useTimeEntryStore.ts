import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimeEntry {
  id: string;
  projectId: string;
  taskId?: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes: number;
  description?: string;
  isBillable: boolean;
  synced?: boolean;
}

interface TimeEntryState {
  entries: TimeEntry[];
  activeTimer: TimeEntry | null;
  offlineQueue: TimeEntry[];
  isLoading: boolean;
  isOnline: boolean;
  startTimer: (projectId: string, taskId?: string, description?: string) => void;
  stopTimer: () => Promise<void>;
  pauseTimer: () => void;
  resumeTimer: () => void;
  addManualEntry: (entry: Omit<TimeEntry, 'id'>) => Promise<void>;
  fetchEntries: () => Promise<void>;
  syncOfflineEntries: () => Promise<void>;
  setOnlineStatus: (online: boolean) => void;
}

function generateId() {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export const useTimeEntryStore = create<TimeEntryState>()(
  persist(
    (set, get) => ({
      entries: [],
      activeTimer: null,
      offlineQueue: [],
      isLoading: false,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

      startTimer: (projectId, taskId, description) => {
        const entry: TimeEntry = {
          id: generateId(),
          projectId,
          taskId,
          startTime: new Date(),
          durationMinutes: 0,
          description,
          isBillable: true,
          synced: false,
        };
        set({ activeTimer: entry });
      },

      stopTimer: async () => {
        const { activeTimer, isOnline } = get();
        if (!activeTimer) return;

        const endTime = new Date();
        const durationMs = endTime.getTime() - new Date(activeTimer.startTime).getTime();
        const durationMinutes = Math.round(durationMs / 60000);

        const completedEntry: TimeEntry = {
          ...activeTimer,
          endTime,
          durationMinutes,
          synced: false,
        };

        if (isOnline) {
          try {
            const res = await fetch('/api/time-entries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId: completedEntry.projectId,
                taskId: completedEntry.taskId,
                startTime: completedEntry.startTime,
                endTime: completedEntry.endTime,
                durationMinutes: completedEntry.durationMinutes,
                description: completedEntry.description,
                isBillable: completedEntry.isBillable,
              }),
            });

            if (res.ok) {
              completedEntry.synced = true;
            } else {
              throw new Error('Failed to sync');
            }
          } catch (error) {
            set((state) => ({
              offlineQueue: [...state.offlineQueue, completedEntry],
            }));
          }
        } else {
          set((state) => ({
            offlineQueue: [...state.offlineQueue, completedEntry],
          }));
        }

        set((state) => ({
          entries: [completedEntry, ...state.entries],
          activeTimer: null,
        }));
      },

      pauseTimer: () => {
        set((state) => {
          if (!state.activeTimer) return state;
          const endTime = new Date();
          const durationMs = endTime.getTime() - new Date(state.activeTimer.startTime).getTime();
          return {
            activeTimer: {
              ...state.activeTimer,
              endTime,
              durationMinutes: Math.round(durationMs / 60000),
            },
          };
        });
      },

      resumeTimer: () => {
        set((state) => {
          if (!state.activeTimer) return state;
          return {
            activeTimer: {
              ...state.activeTimer,
              startTime: new Date(),
              endTime: undefined,
            },
          };
        });
      },

      addManualEntry: async (entry) => {
        const newEntry: TimeEntry = {
          ...entry,
          id: generateId(),
          synced: false,
        };

        const { isOnline } = get();
        if (isOnline) {
          try {
            const res = await fetch('/api/time-entries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(entry),
            });
            if (res.ok) {
              newEntry.synced = true;
            } else {
              throw new Error('Failed to sync');
            }
          } catch (error) {
            set((state) => ({
              offlineQueue: [...state.offlineQueue, newEntry],
            }));
          }
        } else {
          set((state) => ({
            offlineQueue: [...state.offlineQueue, newEntry],
          }));
        }

        set((state) => ({
          entries: [newEntry, ...state.entries],
        }));
      },

      fetchEntries: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/time-entries');
          if (!res.ok) throw new Error('Failed to fetch');
          const data = await res.json();
          set({ entries: data.data, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
        }
      },

      syncOfflineEntries: async () => {
        const { offlineQueue } = get();
        if (offlineQueue.length === 0) return;

        const syncedIds: string[] = [];

        for (const entry of offlineQueue) {
          try {
            const res = await fetch('/api/time-entries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId: entry.projectId,
                taskId: entry.taskId,
                startTime: entry.startTime,
                endTime: entry.endTime,
                durationMinutes: entry.durationMinutes,
                description: entry.description,
                isBillable: entry.isBillable,
              }),
            });
            if (res.ok) {
              syncedIds.push(entry.id);
            }
          } catch (error) {
            console.error('Failed to sync entry:', error);
          }
        }

        set((state) => ({
          offlineQueue: state.offlineQueue.filter((e) => !syncedIds.includes(e.id)),
          entries: state.entries.map((e) =>
            syncedIds.includes(e.id) ? { ...e, synced: true } : e
          ),
        }));
      },

      setOnlineStatus: (online) => {
        set({ isOnline: online });
        if (online) {
          get().syncOfflineEntries();
        }
      },
    }),
    {
      name: 'time-entry-storage',
      partialize: (state) => ({
        entries: state.entries,
        activeTimer: state.activeTimer,
        offlineQueue: state.offlineQueue,
      }),
    }
  )
);
