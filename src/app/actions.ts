'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { getCurrentUser, requireRole } from '@/lib/auth'
import { searchKnowledge, generateReply, clearSearchCache } from '@/lib/retrieval'
import { checkAccuracyThreshold } from '@/lib/notifications'
import { generateDailyReport } from '@/lib/reports'
import type { RetrievalSourceType, ResultStatus } from '@prisma/client'

const chatSchema = z.object({
  question: z.string().min(1, '问题不能为空').max(1000, '问题不能超过1000个字符'),
})

export async function submitQuestion(prevState: { success: boolean; error: string; data: unknown }, formData: FormData) {
  try {
    const question = formData.get('question') as string
    const validated = chatSchema.parse({ question })
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

    revalidatePath('/')
    revalidatePath('/conversations')
    revalidatePath('/reports')

    return {
      success: true,
      error: '',
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
    }
  } catch (error) {
    console.error('Submit question error:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message, data: null }
    }
    return { success: false, error: '服务器内部错误', data: null }
  }
}

export async function updateConversation(prevState: any, formData: FormData) {
  try {
    const id = formData.get('id') as string
    const finalReply = formData.get('finalReply') as string
    const status = formData.get('status') as ResultStatus
    const accuracyScoreStr = formData.get('accuracyScore') as string
    const changeReason = formData.get('changeReason') as string

    if (!id) {
      return { success: false, error: '会话ID不能为空' }
    }

    const user = await getCurrentUser()

    const conversation = await prisma.conversation.findUnique({
      where: { id },
    })

    if (!conversation) {
      return { success: false, error: '会话不存在' }
    }

    const updateData: any = {}
    let actualFinalReply = finalReply
    let logChangeReason = changeReason

    if (status === 'ACCEPTED') {
      actualFinalReply = conversation.suggestedReply
      updateData.finalReply = actualFinalReply
      updateData.status = 'ACCEPTED'
      if (!logChangeReason) logChangeReason = '直接采纳建议回复'
    } else if (status === 'MODIFIED') {
      if (finalReply && finalReply.trim() !== '') {
        updateData.finalReply = finalReply
        actualFinalReply = finalReply
      }
      updateData.status = 'MODIFIED'
      if (!logChangeReason) logChangeReason = '修改后使用'
    } else if (status === 'REJECTED') {
      updateData.finalReply = null
      actualFinalReply = ''
      updateData.status = 'REJECTED'
      if (!logChangeReason) logChangeReason = '拒绝建议回复'
    } else {
      if (finalReply !== undefined && finalReply !== '') updateData.finalReply = finalReply
      if (status !== undefined) updateData.status = status
    }

    if (accuracyScoreStr !== undefined && accuracyScoreStr !== '') {
      updateData.accuracyScore = parseFloat(accuracyScoreStr)
    }

    const updated = await prisma.conversation.update({
      where: { id },
      data: updateData,
    })

    const shouldCreateLog = status === 'ACCEPTED' || 
                           status === 'REJECTED' || 
                           (finalReply && conversation.suggestedReply !== finalReply) ||
                           (status !== undefined && status !== conversation.status)

    if (shouldCreateLog) {
      await prisma.generationLog.create({
        data: {
          conversationId: id,
          previousResult: conversation.suggestedReply,
          currentResult: actualFinalReply || null,
          changeReason: logChangeReason,
          changedBy: user.name,
        },
      })
    }

    await checkAccuracyThreshold()

    revalidatePath('/conversations')
    revalidatePath('/reports')

    return {
      success: true,
      data: updated,
    }
  } catch (error) {
    console.error('Update conversation error:', error)
    return { success: false, error: '服务器内部错误' }
  }
}

export async function createKnowledge(prevState: any, formData: FormData) {
  try {
    await requireRole('ADMIN', 'TRAINER')
    const user = await getCurrentUser()

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const category = formData.get('category') as string
    const tagsStr = formData.get('tags') as string
    const ownerId = formData.get('ownerId') as string
    const expireDate = formData.get('expireDate') as string
    const expireReason = formData.get('expireReason') as string

    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []

    const knowledge = await prisma.knowledgeBase.create({
      data: {
        title,
        content,
        category,
        tags,
        createdById: user.id,
        ownerId: ownerId || user.id,
        expireDate: expireDate ? new Date(expireDate) : undefined,
        expireReason: expireReason as any || undefined,
      },
    })

    await clearSearchCache()
    revalidatePath('/knowledge')
    revalidatePath('/reports')

    return {
      success: true,
      data: knowledge,
    }
  } catch (error) {
    console.error('Create knowledge error:', error)
    return { success: false, error: '服务器内部错误' }
  }
}

export async function updateKnowledge(prevState: any, formData: FormData) {
  try {
    await requireRole('ADMIN', 'TRAINER')

    const id = formData.get('id') as string
    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const category = formData.get('category') as string
    const tagsStr = formData.get('tags') as string
    const status = formData.get('status') as string
    const ownerId = formData.get('ownerId') as string
    const expireDate = formData.get('expireDate') as string
    const expireReason = formData.get('expireReason') as string

    if (!id) {
      return { success: false, error: '知识ID不能为空' }
    }

    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : []

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (category !== undefined) updateData.category = category
    if (tagsStr !== undefined) updateData.tags = tags
    if (status !== undefined) updateData.status = status
    if (ownerId !== undefined) updateData.ownerId = ownerId
    if (expireDate !== undefined) {
      updateData.expireDate = expireDate ? new Date(expireDate) : null
    }
    if (expireReason !== undefined) updateData.expireReason = expireReason as any
    if (status === 'ACTIVE') {
      updateData.lastReviewedAt = new Date()
    }

    const updated = await prisma.knowledgeBase.update({
      where: { id },
      data: updateData,
    })

    await clearSearchCache()
    revalidatePath('/knowledge')
    revalidatePath('/reports')

    return {
      success: true,
      data: updated,
    }
  } catch (error) {
    console.error('Update knowledge error:', error)
    return { success: false, error: '服务器内部错误' }
  }
}

export async function resolveRisk(prevState: any, formData: FormData) {
  try {
    await requireRole('ADMIN', 'SUPERVISOR')
    const user = await getCurrentUser()

    const id = formData.get('id') as string
    const resolutionNote = formData.get('resolutionNote') as string

    if (!id) {
      return { success: false, error: '风险样本ID不能为空' }
    }

    const updated = await prisma.riskSample.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: user.name,
        resolutionNote,
      },
    })

    revalidatePath('/risks')
    revalidatePath('/reports')

    return {
      success: true,
      data: updated,
    }
  } catch (error) {
    console.error('Resolve risk error:', error)
    return { success: false, error: '服务器内部错误' }
  }
}

export async function createPromptVersion(prevState: any, formData: FormData) {
  try {
    await requireRole('ADMIN', 'TRAINER')
    const user = await getCurrentUser()

    const version = formData.get('version') as string
    const content = formData.get('content') as string
    const description = formData.get('description') as string

    const existing = await prisma.promptVersion.findUnique({
      where: { version },
    })

    if (existing) {
      return { success: false, error: '版本号已存在' }
    }

    await prisma.promptVersion.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    const prompt = await prisma.promptVersion.create({
      data: {
        version,
        content,
        description,
        isActive: true,
        createdById: user.id,
      },
    })

    revalidatePath('/prompts')

    return {
      success: true,
      data: prompt,
    }
  } catch (error) {
    console.error('Create prompt error:', error)
    return { success: false, error: '服务器内部错误' }
  }
}

export async function activatePrompt(prevState: any, formData: FormData) {
  try {
    await requireRole('ADMIN', 'TRAINER')

    const id = formData.get('id') as string

    if (!id) {
      return { success: false, error: '提示词ID不能为空' }
    }

    await prisma.promptVersion.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    const updated = await prisma.promptVersion.update({
      where: { id },
      data: { isActive: true },
    })

    revalidatePath('/prompts')

    return {
      success: true,
      data: updated,
    }
  } catch (error) {
    console.error('Activate prompt error:', error)
    return { success: false, error: '服务器内部错误' }
  }
}

export async function markNotificationRead(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser()
    const id = formData.get('id') as string
    const markAll = formData.get('markAll') === 'true'

    if (markAll) {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          status: 'UNREAD',
        },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      })
    } else if (id) {
      await prisma.notification.updateMany({
        where: {
          id,
          userId: user.id,
        },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      })
    }

    revalidatePath('/')
    revalidatePath('/notifications')

    return { success: true }
  } catch (error) {
    console.error('Mark notification error:', error)
    return { success: false, error: '服务器内部错误' }
  }
}

export async function generateReport(prevState: any, formData: FormData) {
  try {
    const user = await getCurrentUser()
    const dateStr = formData.get('date') as string

    const reportDate = dateStr ? new Date(dateStr) : new Date()
    const report = await generateDailyReport(reportDate, user.id)

    revalidatePath('/reports')

    return {
      success: true,
      data: report,
    }
  } catch (error) {
    console.error('Generate report error:', error)
    return { success: false, error: '服务器内部错误' }
  }
}
