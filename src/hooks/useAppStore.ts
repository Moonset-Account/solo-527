import { create } from 'zustand'

interface Note {
  id: string
  targetKey: string
  content: string
  author: string
  createdAt: string
}

interface AnomalyNote {
  targetKey: string
  label: string
}

interface AppState {
  sidebarCollapsed: boolean
  notesDrawerOpen: boolean
  currentNoteTarget: AnomalyNote | null
  notes: Note[]
  timeRange: string
  setTimeRange: (range: string) => void
  toggleSidebar: () => void
  openNotesDrawer: (target: AnomalyNote) => void
  closeNotesDrawer: () => void
  fetchNotes: (targetKey?: string) => Promise<void>
  addNote: (targetKey: string, content: string) => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: false,
  notesDrawerOpen: false,
  currentNoteTarget: null,
  notes: [],
  timeRange: '30',
  setTimeRange: (range) => set({ timeRange: range }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openNotesDrawer: (target) => set({ notesDrawerOpen: true, currentNoteTarget: target }),
  closeNotesDrawer: () => set({ notesDrawerOpen: false, currentNoteTarget: null }),
  fetchNotes: async (targetKey) => {
    try {
      const url = targetKey ? `/api/notes/${encodeURIComponent(targetKey)}` : '/api/notes'
      const res = await fetch(url)
      const data = await res.json()
      set({ notes: Array.isArray(data) ? data : [] })
    } catch {
      set({ notes: [] })
    }
  },
  addNote: async (targetKey, content) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetKey, content, author: '当前教师' }),
      })
      const note = await res.json()
      set((s) => ({ notes: [note, ...s.notes] }))
    } catch {}
  },
}))
