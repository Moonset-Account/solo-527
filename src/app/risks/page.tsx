import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import RiskManager from '@/components/RiskManager'

async function RisksData() {
  const risks = await prisma.riskSample.findMany({
    include: {
      conversation: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
      knowledgeItems: {
        include: {
          knowledge: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const serialized = risks.map((risk) => ({
    ...risk,
    createdAt: risk.createdAt.toISOString(),
    resolvedAt: risk.resolvedAt ? risk.resolvedAt.toISOString() : null,
    conversation: {
      ...risk.conversation,
      createdAt: risk.conversation.createdAt.toISOString(),
    },
  }))

  return <RiskManager risks={serialized} />
}

export default function RisksPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">风险样本管理</h1>
        <p className="text-gray-600">追踪异常来源，管理风险样本，确保服务质量</p>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-xl" />}>
        <RisksData />
      </Suspense>
    </div>
  )
}
