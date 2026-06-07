import { useAppStore } from '@/hooks/useAppStore'
import { Send, X, StickyNote } from 'lucide-react'
import { useState, useEffect } from 'react'

export function NotesDrawer() {
  const { notesDrawerOpen, currentNoteTarget, closeNotesDrawer, notes, fetchNotes, addNote } = useAppStore()
  const [input, setInput] = useState('')

  useEffect(() => {
    if (notesDrawerOpen && currentNoteTarget) {
      fetchNotes(currentNoteTarget.targetKey)
    }
  }, [notesDrawerOpen, currentNoteTarget, fetchNotes])

  const handleSubmit = async () => {
    if (!input.trim() || !currentNoteTarget) return
    await addNote(currentNoteTarget.targetKey, input.trim())
    setInput('')
    fetchNotes(currentNoteTarget.targetKey)
  }

  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 w-80 transform bg-white shadow-xl border-l border-zinc-200 transition-transform duration-300 ${
        notesDrawerOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex h-14 items-center justify-between border-b border-zinc-100 px-4">
        <div className="flex items-center gap-2">
          <StickyNote size={16} className="text-teal-600" />
          <span className="text-sm font-semibold text-zinc-800">人工备注</span>
        </div>
        <button
          onClick={closeNotesDrawer}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-zinc-100 text-zinc-400"
        >
          <X size={16} />
        </button>
      </div>
      {currentNoteTarget && (
        <div className="border-b border-zinc-100 px-4 py-2 bg-teal-50/50">
          <p className="text-xs text-teal-700 font-medium">{currentNoteTarget.label}</p>
          <p className="text-[10px] text-teal-600/70 mt-0.5">{currentNoteTarget.targetKey}</p>
        </div>
      )}
      <div className="flex-1 overflow-auto p-4 space-y-3" style={{ height: 'calc(100vh - 180px)' }}>
        {notes.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-8">暂无备注，添加第一条备注</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="rounded-lg border border-zinc-100 p-3 bg-zinc-50/50">
              <p className="text-sm text-zinc-700 leading-relaxed">{note.content}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">{note.author}</span>
                <span className="text-[10px] text-zinc-400">
                  {new Date(note.createdAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="border-t border-zinc-100 p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入备注内容..."
            className="flex-1 resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-teal-400 focus:border-teal-400"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors self-end"
          >
            <Send size={14} />
          </button>
        </div>
        <p className="mt-1 text-[10px] text-zinc-400">Ctrl+Enter 发送</p>
      </div>
    </div>
  )
}
