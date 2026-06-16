import { Suspense } from 'react'
import { useActionState } from 'react'
import { submitQuestion, updateConversation } from './actions'
import StatusBadge from '@/components/StatusBadge'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { MessageSquare, Send, Check, X, Edit3, RefreshCw } from 'lucide-react'

function ChatForm() {
  const [state, formAction, isPending] = useActionState(submitQuestion, {
    success: false,
    error: null,
    data: null,
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-blue-600" />
        输入客户问题，获取回复建议
      </h2>
      
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
            客户问题
          </label>
          <textarea
            id="question"
            name="question"
            rows={4}
            placeholder="请输入客户的问题，例如：我想退货，怎么操作？"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            required
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                获取回复建议
              </>
            )}
          </button>
        </div>
      </form>

      {state?.error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {state.error}
        </div>
      )}
    </div>
  )
}

interface ReplyDisplayProps {
  data: {
    conversationId: string
    question: string
    reply: string
    sources: Array<{
      id: string
      title: string
      score: number
      sourceType: string
      isHit: boolean
      position: number
    }>
  }
}

function ReplyDisplay({ data }: ReplyDisplayProps) {
  const [state, formAction, isPending] = useActionState(updateConversation, {
    success: false,
    error: null,
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">回复建议</h3>
      
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-600 mb-2">客户问题：</p>
        <p className="text-gray-900">{data.question}</p>
      </div>

      <div className="bg-green-50 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-600 mb-2">建议回复：</p>
        <p className="text-gray-900 whitespace-pre-wrap">{data.reply}</p>
      </div>

      {data.sources.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">引用来源：</p>
          <div className="space-y-2">
            {data.sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">#{source.position}</span>
                  <span className="font-medium text-gray-900">{source.title}</span>
                  <StatusBadge status={source.sourceType} type="source" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${source.isHit ? 'bg-green-500' : 'bg-gray-400'}`}
                      style={{ width: `${Math.min(source.score * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {(source.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={data.conversationId} />
        
        <div>
          <label htmlFor="finalReply" className="block text-sm font-medium text-gray-700 mb-2">
            最终回复（可编辑）
          </label>
          <textarea
            id="finalReply"
            name="finalReply"
            rows={6}
            defaultValue={data.reply}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none font-mono text-sm"
          />
        </div>

        <div>
          <label htmlFor="changeReason" className="block text-sm font-medium text-gray-700 mb-2">
            修改原因（如有修改）
          </label>
          <input
            type="text"
            id="changeReason"
            name="changeReason"
            placeholder="例如：补充了物流查询方式"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              处理状态
            </label>
            <select
              id="status"
              name="status"
              defaultValue="PENDING"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="PENDING">待处理</option>
              <option value="ACCEPTED">已采纳</option>
              <option value="MODIFIED">已修改</option>
              <option value="REJECTED">已拒绝</option>
            </select>
          </div>

          <div>
            <label htmlFor="accuracyScore" className="block text-sm font-medium text-gray-700 mb-2">
              准确率评分 (0-1)
            </label>
            <input
              type="number"
              id="accuracyScore"
              name="accuracyScore"
              step="0.01"
              min="0"
              max="1"
              defaultValue="0.8"
              placeholder="0.85"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            name="status"
            value="REJECTED"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:ring-4 focus:ring-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
            拒绝
          </button>
          <button
            type="submit"
            name="status"
            value="MODIFIED"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 focus:ring-4 focus:ring-blue-100 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            修改后使用
          </button>
          <button
            type="submit"
            name="status"
            value="ACCEPTED"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 transition-colors"
          >
            <Check className="w-4 h-4" />
            直接采纳
          </button>
        </div>
      </form>

      {state?.success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          会话状态已更新！
        </div>
      )}
    </div>
  )
}

async function RecentConversations() {
  const user = await getCurrentUser()
  const conversations = await prisma.conversation.findMany({
    where: {
      userId: user.id,
    },
    include: {
      retrievalRecords: {
        include: {
          knowledge: {
            select: {
              title: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">最近会话</h3>
      
      {conversations.length === 0 ? (
        <p className="text-gray-500 text-center py-8">暂无会话记录</p>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900 line-clamp-1">{conv.customerQuestion}</p>
                <StatusBadge status={conv.status} type="result" />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {conv.retrievalRecords.length > 0
                    ? `引用了 ${conv.retrievalRecords.length} 条知识`
                    : '无引用知识'}
                </span>
                <span>{new Date(conv.createdAt).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

async function QuickStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [totalConversations, hitRate, activeKnowledge, pendingCount] = await Promise.all([
    prisma.conversation.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    }),
    prisma.retrievalRecord.aggregate({
      where: {
        retrievedAt: {
          gte: today,
        },
      },
      _avg: {
        relevanceScore: true,
      },
    }),
    prisma.knowledgeBase.count({
      where: {
        status: 'ACTIVE',
      },
    }),
    prisma.conversation.count({
      where: {
        status: 'PENDING',
      },
    }),
  ])

  const stats = [
    {
      label: '今日会话',
      value: totalConversations.toString(),
      color: 'bg-blue-500',
    },
    {
      label: '平均命中率',
      value: `${((hitRate._avg.relevanceScore || 0) * 100).toFixed(1)}%`,
      color: 'bg-green-500',
    },
    {
      label: '活跃知识',
      value: activeKnowledge.toString(),
      color: 'bg-purple-500',
    },
    {
      label: '待处理',
      value: pendingCount.toString(),
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
              <span className="text-white text-xl">
                {index === 0 ? '💬' : index === 1 ? '🎯' : index === 2 ? '📚' : '⏳'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">会话检索工作台</h1>
        <p className="text-gray-600">输入客户问题，智能检索知识库并生成回复建议</p>
      </div>

      <Suspense fallback={<div className="h-32 animate-pulse bg-gray-100 rounded-xl mb-6" />}>
        <QuickStats />
      </Suspense>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-xl" />}>
            <ChatForm />
          </Suspense>
        </div>
        <div className="col-span-1">
          <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-xl" />}>
            <RecentConversations />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
