import { useEffect, useState } from 'react'
import { useAppStore } from '@/hooks/useAppStore'
import { StickyNote, Trash2 } from 'lucide-react'

interface Note {
  id: string
  targetKey: string
  content: string
  author: string
  createdAt: string
}

export default function Notes() {
  const { fetchNotes, notes } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchNotes()
      .finally(() => setLoading(false))
  }, [fetchNotes])

  const grouped = notes.reduce<Record<string, Note[]>>((acc, n) => {
    if (!acc[n.targetKey]) acc[n.targetKey] = []
    acc[n.targetKey].push(n)
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-800">备注管理</h1>
        <p className="text-sm text-zinc-500 mt-0.5">查看和管理所有人工备注，追踪分析结论</p>
      </div>

      {loading ? (
        <div className="animate-pulse text-zinc-400 text-sm text-center py-12">加载中...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16">
          <StickyNote size={40} className="mx-auto text-zinc-300 mb-4" />
          <p className="text-sm text-zinc-400">暂无备注</p>
          <p className="text-xs text-zinc-400 mt-1">在其他页面点击备注按钮添加</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([targetKey, targetNotes]) => (
            <div key={targetKey} className="rounded-xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50/50 px-4 py-2.5">
                <StickyNote size={14} className="text-teal-500" />
                <span className="text-xs font-medium text-zinc-700">{targetKey}</span>
                <span className="text-[10px] text-zinc-400 ml-auto">{targetNotes.length} 条备注</span>
              </div>
              <div className="divide-y divide-zinc-50">
                {targetNotes.map((note) => (
                  <div key={note.id} className="px-4 py-3 flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-zinc-700 leading-relaxed">{note.content}</p>
                      <div className="mt-1.5 flex items-center gap-3">
                        <span className="text-[10px] text-zinc-400">{note.author}</span>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(note.createdAt).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
