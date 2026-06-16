import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import PromptManager from '@/components/PromptManager'

async function PromptsData() {
  const prompts = await prisma.promptVersion.findMany({
    include: {
      createdBy: { select: { id: true, name: true } },
      _count: { select: { conversations: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const serialized = prompts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }))

  return <PromptManager prompts={serialized} />
}

export default function PromptsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">提示词版本管理</h1>
        <p className="text-gray-600">管理提示词版本，追踪生成结果变化</p>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-xl" />}>
        <PromptsData />
      </Suspense>
    </div>
  )
}
