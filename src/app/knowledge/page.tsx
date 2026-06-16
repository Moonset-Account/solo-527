import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import KnowledgeManager from '@/components/KnowledgeManager'

async function KnowledgeData() {
  const [users, knowledge] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ['TRAINER', 'ADMIN'] } },
      select: { id: true, name: true },
    }),
    prisma.knowledgeBase.findMany({
      include: {
        createdBy: { select: { id: true, name: true } },
        owner: { select: { id: true, name: true } },
        _count: { select: { retrievalRecords: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  const serializedKnowledge = knowledge.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    lastReviewedAt: item.lastReviewedAt ? item.lastReviewedAt.toISOString() : null,
    expireDate: item.expireDate ? item.expireDate.toISOString() : null,
  }))

  return <KnowledgeManager users={users} knowledge={serializedKnowledge} />
}

export default function KnowledgePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">知识库管理</h1>
        <p className="text-gray-600">管理客服知识库，按培训负责人、日期和过期原因分类追踪</p>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-xl" />}>
        <KnowledgeData />
      </Suspense>
    </div>
  )
}
