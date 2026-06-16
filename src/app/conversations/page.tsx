import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import ConversationList from '@/components/ConversationList'

async function ConversationsData() {
  const conversations = await prisma.conversation.findMany({
    include: {
      user: { select: { id: true, name: true } },
      retrievalRecords: {
        include: {
          knowledge: { select: { id: true, title: true, category: true } },
        },
      },
      generationLogs: { orderBy: { createdAt: 'desc' } },
      promptVersion: { select: { id: true, version: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const serialized = conversations.map((conv) => ({
    id: conv.id,
    customerQuestion: conv.customerQuestion,
    suggestedReply: conv.suggestedReply,
    finalReply: conv.finalReply,
    status: conv.status as string,
    accuracyScore: conv.accuracyScore,
    createdAt: conv.createdAt.toISOString(),
    userId: conv.userId,
    promptVersionId: conv.promptVersionId,
    user: conv.user,
    promptVersion: conv.promptVersion,
    retrievalRecords: conv.retrievalRecords.map((r) => ({
      id: r.id,
      sourceType: r.sourceType as string,
      relevanceScore: r.relevanceScore,
      isHit: r.isHit,
      position: r.position,
      knowledgeId: r.knowledgeId,
      knowledge: r.knowledge,
    })),
    generationLogs: conv.generationLogs.map((g) => ({
      id: g.id,
      previousResult: g.previousResult,
      currentResult: g.currentResult,
      changeReason: g.changeReason,
      changedBy: g.changedBy,
      createdAt: g.createdAt.toISOString(),
    })),
  }))

  return <ConversationList conversations={serialized} />
}

export default function ConversationsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">会话记录</h1>
        <p className="text-gray-600">查看所有会话记录，追踪回复历史和修改过程</p>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-xl" />}>
        <ConversationsData />
      </Suspense>
    </div>
  )
}
