import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getCurrentUser, requireRole } from '@/lib/auth'
import { clearSearchCache } from '@/lib/retrieval'

const createKnowledgeSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  content: z.string().min(1, '内容不能为空'),
  category: z.string().min(1, '分类不能为空'),
  tags: z.array(z.string()).default([]),
  ownerId: z.string().optional(),
  expireDate: z.string().optional(),
  expireReason: z.enum(['OUTDATED', 'POLICY_CHANGED', 'PRODUCT_UPDATED', 'REGULATION_CHANGED', 'DUPLICATE', 'OTHER']).optional(),
})

const updateKnowledgeSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符').optional(),
  content: z.string().min(1, '内容不能为空').optional(),
  category: z.string().min(1, '分类不能为空').optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'UNDER_REVIEW', 'ARCHIVED']).optional(),
  ownerId: z.string().optional(),
  expireDate: z.string().optional(),
  expireReason: z.enum(['OUTDATED', 'POLICY_CHANGED', 'PRODUCT_UPDATED', 'REGULATION_CHANGED', 'DUPLICATE', 'OTHER']).optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const ownerId = searchParams.get('ownerId')
    const search = searchParams.get('search')

    const user = await getCurrentUser()

    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category
    if (ownerId) where.ownerId = ownerId
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { tags: { has: search } },
      ]
    }

    const [knowledge, total] = await Promise.all([
      prisma.knowledgeBase.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
          retrievalRecords: {
            take: 1,
            orderBy: {
              retrievedAt: 'desc',
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.knowledgeBase.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        knowledge,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Get knowledge error:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireRole('ADMIN', 'TRAINER')
    const body = await request.json()
    const validated = createKnowledgeSchema.parse(body)
    const user = await getCurrentUser()

    const knowledge = await prisma.knowledgeBase.create({
      data: {
        title: validated.title,
        content: validated.content,
        category: validated.category,
        tags: validated.tags,
        createdById: user.id,
        ownerId: validated.ownerId || user.id,
        expireDate: validated.expireDate ? new Date(validated.expireDate) : undefined,
        expireReason: validated.expireReason,
      },
    })

    await clearSearchCache()

    return NextResponse.json({
      success: true,
      data: knowledge,
    })
  } catch (error) {
    console.error('Create knowledge error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    await requireRole('ADMIN', 'TRAINER')
    const body = await request.json()
    const id = (body as Record<string, unknown>).id as string | undefined
    const data = updateKnowledgeSchema.parse(body)
    const user = await getCurrentUser()

    if (!id) {
      return NextResponse.json(
        { success: false, error: '知识ID不能为空' },
        { status: 400 }
      )
    }

    const existing = await prisma.knowledgeBase.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '知识不存在' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    if (data.category !== undefined) updateData.category = data.category
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.status !== undefined) updateData.status = data.status
    if (data.ownerId !== undefined) updateData.ownerId = data.ownerId
    if (data.expireDate !== undefined) {
      updateData.expireDate = data.expireDate ? new Date(data.expireDate) : null
    }
    if (data.expireReason !== undefined) updateData.expireReason = data.expireReason
    if (data.status === 'ACTIVE') {
      updateData.lastReviewedAt = new Date()
    }

    const updated = await prisma.knowledgeBase.update({
      where: { id },
      data: updateData,
    })

    await clearSearchCache()

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Update knowledge error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
