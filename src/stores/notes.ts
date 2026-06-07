import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ManualNote } from '@/types'
import { mockNotes } from '@/mock/data'

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<ManualNote[]>([...mockNotes])

  function getNotesByTarget(targetType: ManualNote['targetType'], targetId: string) {
    return notes.value.filter(n => n.targetType === targetType && n.targetId === targetId)
  }

  function addNote(note: Omit<ManualNote, 'noteId' | 'createTime' | 'updateTime' | 'author'>) {
    const newNote: ManualNote = {
      ...note,
      noteId: `n${Date.now()}`,
      author: '当前用户',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
    }
    notes.value.unshift(newNote)
    return newNote
  }

  function updateNote(noteId: string, content: string, tags: string[]) {
    const note = notes.value.find(n => n.noteId === noteId)
    if (note) {
      note.content = content
      note.tags = tags
      note.updateTime = new Date().toISOString()
    }
  }

  function deleteNote(noteId: string) {
    const index = notes.value.findIndex(n => n.noteId === noteId)
    if (index > -1) {
      notes.value.splice(index, 1)
    }
  }

  return {
    notes,
    getNotesByTarget,
    addNote,
    updateNote,
    deleteNote,
  }
})
