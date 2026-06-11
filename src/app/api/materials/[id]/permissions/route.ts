import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

const updatePermissionSchema = z.object({
  userId: z.string(),
  canView: z.boolean().default(true),
  canEdit: z.boolean().default(false),
  canDownload: z.boolean().default(false),
  canShare: z.boolean().default(false),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requireRole(request.headers, [UserRole.ADMIN, UserRole.EDITOR_SUPERVISOR])
    const body = await request.json()
    const data = updatePermissionSchema.parse(body)

    const permission = await prisma.materialPermission.upsert({
      where: {
        materialId_userId: {
          materialId: id,
          userId: data.userId,
        },
      },
      create: {
        materialId: id,
        userId: data.userId,
        canView: data.canView,
        canEdit: data.canEdit,
        canDownload: data.canDownload,
        canShare: data.canShare,
      },
      update: {
        canView: data.canView,
        canEdit: data.canEdit,
        canDownload: data.canDownload,
        canShare: data.canShare,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ success: true, data: permission })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
