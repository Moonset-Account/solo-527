import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, hasPermission } from '@/lib/auth'
import { z } from 'zod'
import { UserRole, MaterialAccessLevel } from '@prisma/client'

const createMaterialSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  type: z.enum(['VIDEO', 'IMAGE', 'AUDIO', 'DOCUMENT', 'COVER']),
  url: z.string().url('地址无效'),
  thumbnailUrl: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  tags: z.array(z.string()).default([]),
  permission: z.enum(['PUBLIC', 'INTERNAL', 'RESTRICTED']).default('INTERNAL'),
  topicId: z.string().optional(),
  scriptId: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request.headers)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const type = searchParams.get('type')
    const keyword = searchParams.get('keyword')
    const permission = searchParams.get('permission')

    const where: any = {}
    if (type) where.type = type
    if (permission) where.permission = permission as MaterialAccessLevel
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { tags: { hasSome: [keyword] } },
      ]
    }

    if (!hasPermission(user.role, [UserRole.ADMIN, UserRole.EDITOR_SUPERVISOR])) {
      where.OR = [
        ...(where.OR || []),
        { permission: 'PUBLIC' },
        { permission: 'INTERNAL' },
        { uploaderId: user.id },
        {
          permissions: {
            some: {
              userId: user.id,
              canView: true,
            },
          },
        },
      ]
    }

    const [materials, total] = await Promise.all([
      prisma.material.findMany({
        where,
        include: {
          uploader: { select: { id: true, name: true, avatarUrl: true } },
          topic: { select: { id: true, title: true } },
          script: { select: { id: true, version: true } },
          permissions: {
            include: {
              user: { select: { id: true, name: true } },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.material.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items: materials,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request.headers)
    const body = await request.json()
    const data = createMaterialSchema.parse(body)

    const material = await prisma.material.create({
      data: {
        name: data.name,
        type: data.type,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        tags: data.tags,
        permission: data.permission as MaterialAccessLevel,
        topicId: data.topicId,
        scriptId: data.scriptId,
        uploaderId: user.id,
      },
      include: {
        uploader: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    return NextResponse.json({ success: true, data: material })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
