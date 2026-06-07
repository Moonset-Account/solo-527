import type { Note } from '../../shared/types.js'
import { mockNotes } from '../data/mockData.js'

const notesStore: Note[] = [...mockNotes]

export function getNotes(targetKey: string): Note[] {
  return notesStore.filter(n => n.targetKey === targetKey).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getAllNotes(): Note[] {
  return [...notesStore].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function addNote(targetKey: string, content: string, author: string): Note {
  const note: Note = {
    id: `NOTE-${String(notesStore.length + 1).padStart(3, '0')}`,
    targetKey,
    content,
    author,
    createdAt: new Date().toISOString(),
  }
  notesStore.push(note)
  return note
}
