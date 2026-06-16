import { NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { getCurrentUser, requireRole } from '@/lib/auth'

const createPromptSchema = z.object({
  version: z.string().min(1, '版本号不能为空'),
  content: z.string().min(1, '提示词内容不能为空'),
  description: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()

    const prompts = await prisma.promptVersion.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            conversations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: prompts,
    })
  } catch (error) {
    console.error('Get prompts error:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireRole('ADMIN')
    const body = await request.json()
    const validated = createPromptSchema.parse(body)
    const user = await getCurrentUser()

    const existing = await prisma.promptVersion.findFirst({
      where: { version: validated.version },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: '版本号已存在' },
        { status: 400 }
      )
    }

    await prisma.promptVersion.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    const prompt = await prisma.promptVersion.create({
      data: {
        version: validated.version,
        content: validated.content,
        description: validated.description,
        isActive: true,
        createdById: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: prompt,
    })
  } catch (error) {
    console.error('Create prompt error:', error)
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
    await requireRole('ADMIN')
    const body = await request.json()
    const { id, isActive } = body
    const user = await getCurrentUser()

    if (!id) {
      return NextResponse.json(
        { success: false, error: '提示词ID不能为空' },
        { status: 400 }
      )
    }

    if (isActive) {
      await prisma.promptVersion.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })
    }

    const updated = await prisma.promptVersion.update({
      where: { id },
      data: { isActive: !!isActive },
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Update prompt error:', error)
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
