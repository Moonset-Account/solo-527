'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppStore } from '@/lib/store'
import { ArrowLeft, Plus, X } from 'lucide-react'

const BRAND_OPTIONS = ['茶研悦色', '醇香咖啡']
const PLATFORM_OPTIONS = ['抖音', '小红书', 'B站', '视频号']

export default function NewTopicPage() {
  const router = useRouter()
  const { addTopic, profiles, currentUserId } = useAppStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [brandLine, setBrandLine] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [publishDate, setPublishDate] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const togglePlatform = (p: string) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])
  }

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const handleSubmit = async () => {
    if (!title.trim() || !brandLine) return

    const currentUser = profiles.find((p) => p.id === currentUserId)

    const newTopic = {
      title: title.trim(),
      description: description.trim(),
      brand_line: brandLine,
      target_platform: platforms,
      expected_publish_date: publishDate || null,
      tags,
      status: 'draft' as const,
      creator_id: currentUserId,
      creator_name: currentUser?.display_name || '',
      reviewer_id: null,
      reviewer_name: null,
    }

    await addTopic(newTopic)

    router.push('/topics')
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/topics" className="btn-ghost">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-brand-500">新建选题</h1>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-brand-500 mb-1">标题</label>
          <input className="input-field" placeholder="请输入选题标题" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-500 mb-1">描述</label>
          <textarea className="input-field min-h-[100px] resize-y" placeholder="请输入选题描述" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-500 mb-1">品牌线</label>
          <select className="select-field w-48" value={brandLine} onChange={(e) => setBrandLine(e.target.value)}>
            <option value="">请选择品牌线</option>
            {BRAND_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-500 mb-1">目标平台</label>
          <div className="flex gap-4">
            {PLATFORM_OPTIONS.map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={platforms.includes(p)}
                  onChange={() => togglePlatform(p)}
                  className="rounded border-surface-300 text-accent-500 focus:ring-accent-300"
                />
                {p}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-500 mb-1">期望发布日期</label>
          <input type="date" className="input-field w-48" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-500 mb-1">标签</label>
          <div className="flex items-center gap-2">
            <input
              className="input-field flex-1"
              placeholder="输入标签后点击添加"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            />
            <button type="button" className="btn-secondary" onClick={addTag}>
              <Plus className="w-4 h-4" />
              添加
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-accent-50 text-accent-600 border border-accent-200">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-accent-800">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 mt-6">
        <Link href="/topics" className="btn-secondary">取消</Link>
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={!title.trim() || !brandLine}
        >
          创建选题
        </button>
      </div>
    </div>
  )
}
