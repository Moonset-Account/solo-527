import { useState } from 'react'
import { useAnnotationStore } from '@/store/annotationStore'
import { X, Tag, User } from 'lucide-react'

interface AnnotationModalProps {
  date: string
  onClose: () => void
}

export default function AnnotationModal({ date, onClose }: AnnotationModalProps) {
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [tags, setTags] = useState('')
  const addAnnotation = useAnnotationStore(s => s.addAnnotation)

  const handleSubmit = () => {
    if (!content.trim()) return
    addAnnotation({
      id: `ann-${Date.now()}`,
      date,
      content: content.trim(),
      author: author.trim() || '匿名',
      createdAt: new Date().toISOString(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-base-800 rounded-lg border border-base-600/50 w-96 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-600/30">
          <h3 className="text-sm font-medium text-base-200">添加注释 - {date}</h3>
          <button onClick={onClose} className="text-base-400 hover:text-alert transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-3 space-y-3">
          <div>
            <label className="text-xs text-base-400 mb-1 flex items-center gap-1"><User className="w-3 h-3" />作者</label>
            <input
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="w-full bg-base-700 border border-base-600/50 rounded px-3 py-1.5 text-sm text-base-100 focus:outline-none focus:border-accent/50"
              placeholder="输入作者名称"
            />
          </div>
          <div>
            <label className="text-xs text-base-400 mb-1 block">注释内容</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
              className="w-full bg-base-700 border border-base-600/50 rounded px-3 py-1.5 text-sm text-base-100 focus:outline-none focus:border-accent/50 resize-none"
              placeholder="描述异常原因..."
            />
          </div>
          <div>
            <label className="text-xs text-base-400 mb-1 flex items-center gap-1"><Tag className="w-3 h-3" />标签（逗号分隔）</label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full bg-base-700 border border-base-600/50 rounded px-3 py-1.5 text-sm text-base-100 focus:outline-none focus:border-accent/50"
              placeholder="突发停机, 液压泄露"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-base-600/30">
          <button onClick={onClose} className="px-3 py-1.5 text-xs text-base-300 hover:text-base-100 transition-colors">取消</button>
          <button onClick={handleSubmit} className="px-3 py-1.5 bg-accent text-base-900 text-xs font-medium rounded hover:bg-accent-light transition-colors">保存注释</button>
        </div>
      </div>
    </div>
  )
}
