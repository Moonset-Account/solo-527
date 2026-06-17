import { NextResponse } from 'next/server'
import { authMiddleware, AuthenticatedRequest, getRequestContext, parseSearchParams } from '@/lib/middleware'
import { followUpSchema, searchSchema } from '@/lib/validation'
import prisma from '@/lib/prisma'
import { recordHistory } from '@/lib/history'
import { LeadStage } from '@/generated/prisma'
import type { FollowUpRecord } from '@/generated/prisma'

export const GET = authMiddleware()(
  async (req: AuthenticatedRequest) => {
    try {
      const params = parseSearchParams(req)
      const validated = searchSchema.safeParse(params)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.issues },
          { status: 400 }
        )
      }

      const { page, pageSize, keyword, sortBy, sortOrder, filters } = validated.data
      const skip = (page - 1) * pageSize

      const where: any = {}
      if (keyword) {
        where.OR = [
          { followUpType: { contains: keyword } },
          { content: { contains: keyword } },
          { nextStep: { contains: keyword } },
          { lead: { customer: { name: { contains: keyword } } } },
          { lead: { customer: { phone: { contains: keyword } } } },
        ]
      }
      if (filters?.leadId) {
        where.leadId = filters.leadId
      }
      if (filters?.consultantId) {
        where.consultantId = filters.consultantId
      }
      if (filters?.stage) {
        where.stage = filters.stage
      }
      if (filters?.followUpType) {
        where.followUpType = filters.followUpType
      }

      const orderBy: any = sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' }

      const [followUps, total] = await Promise.all([
        prisma.followUpRecord.findMany({
          where,
          skip,
          take: pageSize,
          orderBy,
          include: {
            lead: {
              select: {
                id: true,
                source: true,
                stage: true,
                customer: { select: { id: true, name: true, phone: true } },
              },
            },
            consultant: { select: { id: true, name: true } },
            surveyRecord: { select: { id: true, address: true, surveyDate: true } },
          },
        }),
        prisma.followUpRecord.count({ where }),
      ])

      return NextResponse.json({
        success: true,
        data: {
          records: followUps,
          total,
          page,
          pageSize,
        },
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '获取跟进记录列表失败' },
        { status: 500 }
      )
    }
  }
)

export const POST = authMiddleware()(
  async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json()
      const validated = followUpSchema.safeParse(body)

      if (!validated.success) {
        return NextResponse.json(
          { success: false, error: '参数验证失败', details: validated.error.issues },
          { status: 400 }
        )
      }

      const existingLead = await prisma.lead.findUnique({
        where: { id: validated.data.leadId },
      })

      if (!existingLead) {
        return NextResponse.json(
          { success: false, error: '线索不存在' },
          { status: 404 }
        )
      }

      const followUp = await prisma.$transaction(async (tx: any) => {
        const newFollowUp = await tx.followUpRecord.create({
          data: {
            ...validated.data,
            consultantId: req.user!.userId,
            stage: validated.data.stage as LeadStage,
          },
        })

        await tx.lead.update({
          where: { id: validated.data.leadId },
          data: {
            stage: validated.data.stage as LeadStage,
            lastFollowUpAt: new Date(),
            nextFollowUpAt: validated.data.nextFollowUpAt || existingLead.nextFollowUpAt,
          },
        })

        return newFollowUp
      }) as FollowUpRecord

      const ctx = getRequestContext(req)
      await recordHistory('FollowUpRecord', followUp.id, 'CREATE', {
        userId: req.user!.userId,
        ...ctx,
      }, {}, followUp)

      await recordHistory('Lead', validated.data.leadId, 'UPDATE', {
        userId: req.user!.userId,
        ...ctx,
      }, existingLead, {
        ...existingLead,
        stage: validated.data.stage,
        lastFollowUpAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        data: followUp,
      })
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || '创建跟进记录失败' },
        { status: 500 }
      )
    }
  }
)
