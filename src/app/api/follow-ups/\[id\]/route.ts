import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, getRequestContext } from '@/lib/middleware'
import { followUpSchema } from '@/lib/validation'
import prisma from '@/lib/prisma'
import { recordHistory } from '@/lib/history'
import { LeadStage } from '@/generated/prisma'
import type { FollowUpRecord } from '@/generated/prisma'

interface Params {
  params: { id: string }
}

export const GET = authMiddleware()(
  async (req: AuthenticatedRequest, { params }: Params) => {
    try {
      const followUp = await prisma.followUpRecord.findUnique({
        where: { id: params.id },
        include: {
          lead: {
            select: {
              id: true,
              source: true,
              stage: true,
              lastFollowUpAt: true,
              nextFollowUpAt: true,
              customer: { select: { id: true, name: true, phone: true, email: true } },
              consultant: { select: { id: true, name: true, phone: true } },
            },
          },
          consultant: { select: { id: true, name: true, phone: true } },
          surveyRecord: {
            select: {
              id: true,
              address: true,
              area: true,
              houseType: true,
              surveyDate: true,
            },
          },
        },
      })

      if (!followUp) {
        return NextResponse.json(
          { success: false, error: '跟进记录不存在' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: followUp,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '获取跟进记录详情失败' },
        { status: 500 }
      )
    }
  }
)

export const PUT = authMiddleware()(
  async (req: AuthenticatedRequest, { params }: Params) => {
    try {
      const existing = await prisma.followUpRecord.findUnique({
        where: { id: params.id },
      })

      if (!existing) {
        return NextResponse.json(
          { success: false, error: '跟进记录不存在' },
          { status: 404 }
        )
      }

      const body = await req.json()
      const validated = followUpSchema.partial().safeParse(body)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.issues },
          { status: 400 }
        )
      }

      const updatedData = validated.data
      const leadId = updatedData.leadId || existing.leadId
      const existingLead = await prisma.lead.findUnique({ where: { id: leadId } })

      const followUp = await prisma.$transaction(async (tx: any) => {
        const updateData: any = { ...updatedData }
        if (updatedData.stage) {
          updateData.stage = updatedData.stage as LeadStage
        }

        const updatedFollowUp = await tx.followUpRecord.update({
          where: { id: params.id },
          data: updateData,
        })

        if (updatedData.stage || updatedData.nextFollowUpAt) {
          await tx.lead.update({
            where: { id: leadId },
            data: {
              ...(updatedData.stage && { stage: updatedData.stage as LeadStage }),
              ...(updatedData.nextFollowUpAt && { nextFollowUpAt: updatedData.nextFollowUpAt }),
            },
          })
        }

        return updatedFollowUp
      }) as FollowUpRecord

      const ctx = getRequestContext(req)
      await recordHistory('FollowUpRecord', followUp.id, 'UPDATE', {
        userId: req.user!.userId,
        ...ctx,
      }, existing, followUp)

      if (existingLead && (updatedData.stage || updatedData.nextFollowUpAt)) {
        const updatedLead = {
          ...existingLead,
          ...(updatedData.stage && { stage: updatedData.stage }),
          ...(updatedData.nextFollowUpAt && { nextFollowUpAt: updatedData.nextFollowUpAt }),
        }
        await recordHistory('Lead', leadId, 'UPDATE', {
          userId: req.user!.userId,
          ...ctx,
        }, existingLead, updatedLead)
      }

      return NextResponse.json({
        success: true,
        data: followUp,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '更新跟进记录失败' },
        { status: 500 }
      )
    }
  }
)
