'use client'

import { useActionState } from 'react'
import { createPromptVersion, activatePrompt } from '@/app/actions'
import { Settings, Plus, User, Clock, Check, Clock3 } from 'lucide-react'

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

export default function PromptManager({ prompts }: { prompts: PromptItem[] }) {
  const [createState, createAction] = useActionState(createPromptVersion, {
    success: false,
    error: '',
  })

  const [activateState, activateAction] = useActionState(activatePrompt, {
    success: false,
    error: '',
  })

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
                  <div className="flex justify-end">
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
