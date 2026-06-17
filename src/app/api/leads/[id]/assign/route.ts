import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, getRequestContext } from '@/lib/middleware'
import prisma from '@/lib/prisma'
import { recordHistory } from '@/lib/history'
import { z } from 'zod'

interface RouteParams {
  params: {
    id: string
  }
}

const assignSchema = z.object({
  consultantId: z.string().optional(),
  assignedToId: z.string().optional(),
}).refine((data) => data.consultantId || data.assignedToId, {
  message: '至少需要提供 consultantId 或 assignedToId',
})

export const POST = authMiddleware()(
  async (req: AuthenticatedRequest, { params }: RouteParams) => {
    try {
      const { id } = params
      const body = await req.json()
      const validated = assignSchema.safeParse(body)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.issues },
          { status: 400 }
        )
      }

      const existingLead = await prisma.lead.findUnique({ where: { id } })
      if (!existingLead) {
        return NextResponse.json(
          { success: false, error: '线索不存在' },
          { status: 404 }
        )
      }

      const { consultantId, assignedToId } = validated.data

      const updateData: any = {
        isPublicSea: false,
        publicSeaSince: null,
      }

      if (consultantId !== undefined) {
        updateData.consultantId = consultantId
      }
      if (assignedToId !== undefined) {
        updateData.assignedToId = assignedToId
      }

      const updatedLead = await prisma.lead.update({
        where: { id },
        data: updateData,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          consultant: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      })

      const ctx = getRequestContext(req)
      await recordHistory('Lead', id, 'ASSIGN', {
        userId: req.user!.userId,
        ...ctx,
      }, existingLead, updatedLead)

      return NextResponse.json({
        success: true,
        data: updatedLead,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '分配线索失败' },
        { status: 500 }
      )
    }
  }
)
