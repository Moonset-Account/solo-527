import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, getRequestContext } from '@/lib/middleware'
import prisma from '@/lib/prisma'
import { recordHistory } from '@/lib/history'

interface RouteParams {
  params: {
    id: string
  }
}

export const POST = authMiddleware()(
  async (req: AuthenticatedRequest, { params }: RouteParams) => {
    try {
      const { id } = params
      const userId = req.user!.userId

      const existingLead = await prisma.lead.findUnique({ where: { id } })
      if (!existingLead) {
        return NextResponse.json(
          { success: false, error: '线索不存在' },
          { status: 404 }
        )
      }

      if (!existingLead.isPublicSea) {
        return NextResponse.json(
          { success: false, error: '该线索不在公海中，无法认领' },
          { status: 400 }
        )
      }

      const updatedLead = await prisma.lead.update({
        where: { id },
        data: {
          consultantId: userId,
          assignedToId: userId,
          isPublicSea: false,
          publicSeaSince: null,
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          consultant: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
        },
      })

      const ctx = getRequestContext(req)
      await recordHistory('Lead', id, 'CLAIM', {
        userId,
        ...ctx,
      }, existingLead, updatedLead)

      return NextResponse.json({
        success: true,
        data: updatedLead,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '认领线索失败' },
        { status: 500 }
      )
    }
  }
)
