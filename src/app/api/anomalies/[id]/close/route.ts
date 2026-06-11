import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth'
import { z } from 'zod'
import { UserRole, AnomalyStatus } from '@prisma/client'

const closeAnomalySchema = z.object({
  closeReason: z.string().min(1, '原因不能为空'),
  closeResult: z.string().min(1, '结果不能为空'),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireRole(request.headers, [
      UserRole.ADMIN,
      UserRole.EDITOR_SUPERVISOR,
    ])
    const body = await request.json()
    const data = closeAnomalySchema.parse(body)

    const anomaly = await prisma.anomaly.update({
      where: { id },
      data: {
        status: AnomalyStatus.CLOSED,
        closeReason: data.closeReason,
        closeResult: data.closeResult,
        closedAt: new Date(),
        handlerId: user.id,
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        handler: { select: { id: true, name: true, avatarUrl: true } },
        topic: { select: { id: true, title: true } },
        script: { select: { id: true, version: true } },
      },
    })

    return NextResponse.json({ success: true, data: anomaly })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
