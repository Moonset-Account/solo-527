'use client'

import { use, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'
import { ArrowLeft, Save, Send } from 'lucide-react'

export default function ScriptEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { getTopicById, getScriptsByTopicId, addScript, profiles, currentUserId } = useAppStore()

  const topic = getTopicById(id)
  const existingScripts = getScriptsByTopicId(id)

  const nextVersion = useMemo(() => {
    if (existingScripts.length === 0) return 1
    return Math.max(...existingScripts.map((s) => s.version)) + 1
  }, [existingScripts])

  const [content, setContent] = useState('')

  if (!topic) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/topics" className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-brand-500">选题未找到</h1>
        </div>
        <div className="card p-12 text-center text-surface-400">该选题不存在或已被删除</div>
      </div>
    )
  }

  const currentUser = profiles.find((p) => p.id === currentUserId)

  const handleSave = async (status: 'draft' | 'submitted') => {
    await addScript({
      topic_id: id,
      content,
      version: nextVersion,
      status,
      author_id: currentUserId,
      author_name: currentUser?.display_name || '',
    })

    router.push(`/topics/${id}`)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/topics/${id}`} className="btn-ghost">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-brand-500">编写脚本</h1>
        <span className="text-sm text-surface-400">— {topic.title}</span>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-brand-500">脚本版本</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
              v{nextVersion}
            </span>
          </div>
          {existingScripts.length > 0 && (
            <span className="text-xs text-surface-400">已有 {existingScripts.length} 个版本</span>
          )}
        </div>

        <textarea
          className="input-field min-h-[500px] resize-y font-mono text-sm leading-relaxed"
          placeholder="请输入脚本内容...&#10;&#10;建议格式：&#10;开场：...&#10;正文：...&#10;结尾：..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          className="btn-secondary"
          onClick={() => handleSave('draft')}
          disabled={!content.trim()}
        >
          <Save className="w-4 h-4" />
          保存草稿
        </button>
        <button
          className="btn-primary"
          onClick={() => handleSave('submitted')}
          disabled={!content.trim()}
        >
          <Send className="w-4 h-4" />
          提交脚本
        </button>
      </div>
    </div>
  )
}
