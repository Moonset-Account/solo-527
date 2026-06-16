import { Suspense } from 'react'
import ChatForm from '@/components/ChatForm'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { MessageSquare } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'

async function RecentConversations() {
  const user = await getCurrentUser()
  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    include: {
      retrievalRecords: {
        include: {
          knowledge: { select: { title: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
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
                <span>{conv.createdAt.toLocaleString('zh-CN')}</span>
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
    prisma.conversation.count({ where: { createdAt: { gte: today } } }),
    prisma.retrievalRecord.aggregate({
      where: { retrievedAt: { gte: today } },
      _avg: { relevanceScore: true },
    }),
    prisma.knowledgeBase.count({ where: { status: 'ACTIVE' } }),
    prisma.conversation.count({ where: { status: 'PENDING' } }),
  ])

  const stats = [
    { label: '今日会话', value: totalConversations.toString(), color: 'bg-blue-500' },
    { label: '平均命中率', value: `${((hitRate._avg.relevanceScore || 0) * 100).toFixed(1)}%`, color: 'bg-green-500' },
    { label: '活跃知识', value: activeKnowledge.toString(), color: 'bg-purple-500' },
    { label: '待处理', value: pendingCount.toString(), color: 'bg-orange-500' },
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
          <ChatForm />
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
