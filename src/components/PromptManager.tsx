'use client'

import { useActionState, useState } from 'react'
import { createPromptVersion, activatePrompt } from '@/app/actions'
import { Settings, Plus, User, Clock, Check, Clock3, GitCompare, ChevronDown, ChevronUp } from 'lucide-react'

interface PromptItem {
  id: string
  version: string
  content: string
  description: string | null
  isActive: boolean
  createdAt: string
  createdBy: { id: string; name: string }
  _count: { conversations: number }
}

interface VersionChange {
  fromVersion: string
  toVersion: string
  fromContent: string
  toContent: string
  changedAt: string
  changedBy: string
}

function DiffViewer({ oldText, newText }: { oldText: string; newText: string }) {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const maxLines = Math.max(oldLines.length, newLines.length)

  return (
    <div className="font-mono text-xs border border-gray-200 rounded-lg overflow-hidden">
      {Array.from({ length: maxLines }).map((_, i) => {
        const oldLine = oldLines[i] || ''
        const newLine = newLines[i] || ''
        const isChanged = oldLine !== newLine
        const isAdded = oldLine === '' && newLine !== ''
        const isRemoved = oldLine !== '' && newLine === ''

        return (
          <div key={i} className={`flex ${isChanged ? 'bg-yellow-50' : ''}`}>
            <div className={`w-1/2 border-r border-gray-200 px-2 py-1 ${isRemoved ? 'bg-red-100 line-through text-red-700' : ''}`}>
              {isRemoved && <span className="text-red-500 mr-1">-</span>}
              {oldLine || ' '}
            </div>
            <div className={`w-1/2 px-2 py-1 ${isAdded ? 'bg-green-100 text-green-700' : ''}`}>
              {isAdded && <span className="text-green-500 mr-1">+</span>}
              {newLine || ' '}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function PromptManager({ prompts }: { prompts: PromptItem[] }) {
  const [createState, createAction] = useActionState(createPromptVersion, {
    success: false,
    error: '',
  })

  const [activateState, activateAction] = useActionState(activatePrompt, {
    success: false,
    error: '',
  })

  const [showChanges, setShowChanges] = useState(true)

  const sortedPrompts = [...prompts].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const versionChanges: VersionChange[] = []
  for (let i = 0; i < sortedPrompts.length - 1; i++) {
    versionChanges.push({
      fromVersion: sortedPrompts[i].version,
      toVersion: sortedPrompts[i + 1].version,
      fromContent: sortedPrompts[i].content,
      toContent: sortedPrompts[i + 1].content,
      changedAt: sortedPrompts[i + 1].createdAt,
      changedBy: sortedPrompts[i + 1].createdBy.name,
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600" />
          创建新版本
        </h3>
        <form action={createAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">版本号</label>
              <input
                type="text"
                name="version"
                required
                placeholder="例如：v1.1.0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
              <input
                type="text"
                name="description"
                placeholder="版本说明"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">提示词内容</label>
              <textarea
                name="content"
                rows={6}
                required
                placeholder="输入提示词模板内容..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
              />
            </div>
            <div className="col-span-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                创建版本
              </button>
            </div>
          </div>
        </form>
        {createState?.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {createState.error}
          </div>
        )}
        {createState?.success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            版本创建成功！
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">总版本数</p>
          <p className="text-2xl font-bold text-gray-900">{prompts.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">当前生效版本</p>
          <p className="text-2xl font-bold text-green-600">
            {prompts.find(p => p.isActive)?.version || '-'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">总使用次数</p>
          <p className="text-2xl font-bold text-blue-600">
            {prompts.reduce((sum, p) => sum + p._count.conversations, 0)}
          </p>
        </div>
      </div>

      {versionChanges.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <button
            onClick={() => setShowChanges(!showChanges)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-purple-600" />
              版本变化历史 ({versionChanges.length} 次变更)
            </h3>
            {showChanges ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {showChanges && (
            <div className="mt-4 space-y-4">
              {versionChanges.map((change, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm font-mono">
                        {change.fromVersion}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-mono font-bold">
                        {change.toVersion}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <User className="w-4 h-4 inline mr-1" />
                      {change.changedBy}
                      <span className="mx-2">·</span>
                      <Clock className="w-4 h-4 inline mr-1" />
                      {new Date(change.changedAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">内容差异对比：</div>
                  <DiffViewer oldText={change.fromContent} newText={change.toContent} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
              prompt.isActive ? 'border-green-300' : 'border-gray-200'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl font-bold text-gray-900">{prompt.version}</span>
                    {prompt.isActive && (
                      <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
                        当前生效
                      </span>
                    )}
                    {prompt.description && (
                      <span className="text-sm text-gray-500">{prompt.description}</span>
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {prompt.content}
                    </pre>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      创建者: {prompt.createdBy.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      创建于: {new Date(prompt.createdAt).toLocaleString('zh-CN')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock3 className="w-4 h-4" />
                      使用次数: {prompt._count.conversations}
                    </span>
                  </div>
                </div>
              </div>

              {!prompt.isActive && (
                <form action={activateAction} className="border-t border-gray-200 pt-4 mt-4">
                  <input type="hidden" name="id" value={prompt.id} />
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">点击按钮将此版本设为当前生效版本</p>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      启用此版本
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
