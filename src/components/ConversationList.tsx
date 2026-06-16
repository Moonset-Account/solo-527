'use client'

import { useActionState } from 'react'
import { updateConversation } from '@/app/actions'
import StatusBadge from '@/components/StatusBadge'
import { MessageSquare, User, Clock, BookOpen, History } from 'lucide-react'

interface RetrievalRecord {
  id: string
  sourceType: string
  relevanceScore: number
  isHit: boolean
  position: number
  knowledge: {
    id: string
    title: string
    category: string
  }
}

interface GenerationLog {
  id: string
  previousResult: string | null
  currentResult: string
  changeReason: string | null
  changedBy: string | null
  createdAt: string
}

interface ConversationItem {
  id: string
  customerQuestion: string
  suggestedReply: string
  finalReply: string | null
  status: string
  accuracyScore: number | null
  createdAt: string
  userId: string
  promptVersionId: string | null
  user: { id: string; name: string }
  promptVersion: { id: string; version: string } | null
  retrievalRecords: RetrievalRecord[]
  generationLogs: GenerationLog[]
}

export default function ConversationList({ conversations }: { conversations: ConversationItem[] }) {
  const [state, formAction] = useActionState(updateConversation, {
    success: false,
    error: '',
  })

  if (conversations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">暂无会话记录</h3>
        <p className="text-gray-500">开始输入客户问题，获取回复建议</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {conversations.map((conv) => (
        <div key={conv.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={conv.status} type="result" />
                  {conv.promptVersion && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      提示词: {conv.promptVersion.version}
                    </span>
                  )}
                  {conv.accuracyScore !== null && (
                    <span className="text-sm text-gray-500">
                      准确率: {(conv.accuracyScore * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <User className="w-4 h-4" />
                  <span>{conv.user.name}</span>
                  <span className="mx-2">·</span>
                  <Clock className="w-4 h-4" />
                  <span>{new Date(conv.createdAt).toLocaleString('zh-CN')}</span>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    客户问题：
                  </p>
                  <p className="text-gray-900">{conv.customerQuestion}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    建议回复：
                  </p>
                  <p className="text-gray-900 whitespace-pre-wrap">{conv.suggestedReply}</p>
                </div>
                {conv.finalReply && conv.finalReply !== conv.suggestedReply && (
                  <div className="bg-yellow-50 rounded-lg p-4 mb-4 border border-yellow-200">
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      最终回复：
                    </p>
                    <p className="text-gray-900 whitespace-pre-wrap">{conv.finalReply}</p>
                  </div>
                )}
                {conv.retrievalRecords.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      引用知识：
                    </p>
                    <div className="space-y-2">
                      {conv.retrievalRecords.map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <StatusBadge status={record.sourceType} type="source" />
                            <span className="font-medium text-gray-900">{record.knowledge.title}</span>
                            <span className="text-sm text-gray-500">{record.knowledge.category}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${record.isHit ? 'bg-green-500' : 'bg-gray-400'}`}
                                style={{ width: `${Math.min(record.relevanceScore * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">
                              {(record.relevanceScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {conv.generationLogs.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      修改历史：
                    </p>
                    <div className="space-y-2">
                      {conv.generationLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 bg-gray-50 rounded-lg text-sm"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-600">
                              由 {log.changedBy || '未知'} 修改
                              {log.changeReason && ` - ${log.changeReason}`}
                            </span>
                            <span className="text-gray-500">
                              {new Date(log.createdAt).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {conv.status === 'PENDING' && (
              <form action={formAction} className="border-t border-gray-200 pt-4 mt-4">
                <input type="hidden" name="id" value={conv.id} />
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      处理状态
                    </label>
                    <select
                      name="status"
                      defaultValue="PENDING"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="PENDING">待处理</option>
                      <option value="ACCEPTED">已采纳</option>
                      <option value="MODIFIED">已修改</option>
                      <option value="REJECTED">已拒绝</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      准确率评分
                    </label>
                    <input
                      type="number"
                      name="accuracyScore"
                      step="0.01"
                      min="0"
                      max="1"
                      defaultValue="0.8"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      修改原因
                    </label>
                    <input
                      type="text"
                      name="changeReason"
                      placeholder="修改原因说明"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    更新状态
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
