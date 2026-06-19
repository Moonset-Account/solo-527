import { create } from 'zustand'
import type { ReminderRecord, ReplyStatus } from '../../shared/types'

interface ReminderState {
  reminders: ReminderRecord[]
  createReminder: (data: Partial<ReminderRecord>) => Promise<void>
  fetchReminders: (contractId: number) => Promise<void>
  updateReminderReply: (id: number, replyStatus: ReplyStatus) => Promise<void>
}

export const useReminderStore = create<ReminderState>((set) => ({
  reminders: [],

  createReminder: async (data) => {
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      set((state) => ({ reminders: [...state.reminders, json.data] }))
    } catch {}
  },

  fetchReminders: async (contractId) => {
    try {
      const res = await fetch(`/api/reminders?contractId=${contractId}`)
      const json = await res.json()
      set({ reminders: json.data })
    } catch {}
  },

  updateReminderReply: async (id, replyStatus) => {
    try {
      const res = await fetch(`/api/reminders/${id}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyStatus }),
      })
      const json = await res.json()
      set((state) => ({
        reminders: state.reminders.map((r) => (r.id === id ? json.data : r)),
      }))
    } catch {}
  },
}))
