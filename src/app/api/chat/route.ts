import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { searchKnowledge, generateReply } from '@/lib/retrieval'
import { getCurrentUser } from '@/lib/auth'
import type { RetrievalSourceType } from '@prisma/client'

const chatSchema = z.object({
  question: z.string().min(1, '问题不能为空').max(1000, '问题不能超过1000个字符'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = chatSchema.parse(body)
    const user = await getCurrentUser()

    const retrievalResults = await searchKnowledge(validated.question)
    const { reply, promptVersionId } = await generateReply(validated.question, retrievalResults)

    const conversation = await prisma.conversation.create({
      data: {
        customerQuestion: validated.question,
        suggestedReply: reply,
        userId: user.id,
        promptVersionId,
      },
    })

    if (retrievalResults.length > 0) {
      await prisma.retrievalRecord.createMany({
        data: retrievalResults.map((r) => ({
          conversationId: conversation.id,
          knowledgeId: r.knowledge.id,
          sourceType: r.sourceType as RetrievalSourceType,
          relevanceScore: r.score,
          isHit: r.isHit,
          position: r.position,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        conversationId: conversation.id,
        question: validated.question,
        reply,
        sources: retrievalResults.map((r) => ({
          id: r.knowledge.id,
          title: r.knowledge.title,
          score: r.score,
          sourceType: r.sourceType,
          isHit: r.isHit,
          position: r.position,
        })),
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
