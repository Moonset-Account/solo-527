import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse, paginate, generateOrderNo } from '../../utils/helpers'
import { z } from 'zod'
import type { DeviceStatus } from '@prisma/client'

const reportSchema = z.object({
  courtId: z.number().int().optional(),
  deviceName: z.string().min(1),
  deviceType: z.string().min(1),
  faultLevel: z.string().min(1),
  description: z.string().min(1),
  images: z.string().optional(),
  affectCoach: z.boolean().optional().default(false),
  affectedCoachIds: z.array(z.number()).optional()
})

const handleSchema = z.object({
  id: z.number().int().positive(),
  action: z.enum(['accept', 'repair', 'complete', 'scrap']),
  repairResult: z.string().optional(),
  repairCost: z.number().min(0).optional(),
  remark: z.string().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAuth(event)
    const method = event.method
    const query = getQuery(event)

    if (method === 'GET') {
      const page = Number(query.page) || 1
      const pageSize = Number(query.pageSize) || 20
      const status = query.status as DeviceStatus | undefined
      const courtId = query.courtId ? Number(query.courtId) : undefined
      const keyword = query.keyword as string || ''

      const where: any = {}
      if (status) where.status = status
      if (courtId) where.courtId = courtId
      if (keyword) {
        where.OR = [
          { deviceName: { contains: keyword } },
          { description: { contains: keyword } },
          { faultNo: { contains: keyword } }
        ]
      }

      const result = await paginate(
        prisma.deviceFault, page, pageSize, where,
        {
          court: { select: { id: true, courtNumber: true, name: true } },
          reporter: { select: { id: true, realName: true, phone: true } },
          handler: { select: { id: true, realName: true, phone: true } }
        },
        { reportedAt: 'desc' }
      )
      return successResponse(result)
    }

    if (method === 'POST') {
      const body = await readBody(event)
      const data = reportSchema.parse(body)

      const fault = await prisma.deviceFault.create({
        data: {
          faultNo: generateOrderNo('FT'),
          ...data,
          reporterId: auth.id,
          affectedCoachIds: data.affectedCoachIds ? JSON.stringify(data.affectedCoachIds) : null,
          status: 'FAULT_REPORTED' as DeviceStatus
        }
      })

      const admins = await prisma.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] } } })
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'DEVICE_FAULT',
            title: '设备故障报修',
            content: `${auth.realName || auth.username} 报告了设备故障: ${data.deviceName} - ${data.description.slice(0, 50)}`,
            relatedId: fault.id,
            relatedType: 'DeviceFault'
          }
        })
      }

      return successResponse(fault, '报修成功')
    }

    if (method === 'PUT') {
      const body = await readBody(event)
      const data = handleSchema.parse(body)
      const fault = await prisma.deviceFault.findUnique({ where: { id: data.id } })
      if (!fault) return errorResponse('故障记录不存在', 404)

      const updates: any = {}
      let newStatus: DeviceStatus = fault.status
      let logRemark = data.remark || ''

      switch (data.action) {
        case 'accept':
          updates.handlerId = auth.id
          updates.acceptedAt = new Date()
          newStatus = 'REPAIRING'
          logRemark = logRemark || '接受维修任务'
          break
        case 'repair':
          if (!data.repairResult) return errorResponse('请填写维修结果', 400)
          updates.repairResult = data.repairResult
          updates.repairCost = data.repairCost ?? null
          newStatus = 'REPAIRED'
          logRemark = logRemark || `维修完成: ${data.repairResult.slice(0, 30)}`
          break
        case 'complete':
          newStatus = 'NORMAL'
          logRemark = logRemark || '设备恢复正常'
          break
        case 'scrap':
          newStatus = 'SCRAPPED'
          logRemark = logRemark || '设备报废'
          break
      }
      updates.status = newStatus
      if (data.action === 'repair' || data.action === 'complete') {
        updates.repairedAt = new Date()
      }

      await prisma.deviceFault.update({ where: { id: data.id }, data: updates })

      if (fault.affectCoach && (data.action === 'repair' || data.action === 'complete')) {
        const coachIds = fault.affectedCoachIds ? JSON.parse(fault.affectedCoachIds) as number[] : []
        for (const coachUserId of coachIds) {
          const coach = await prisma.coachProfile.findFirst({ where: { userId: coachUserId } })
          if (coach) {
            const now = new Date()
            const startOfWeek = new Date(now)
            startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))
            const endOfWeek = new Date(startOfWeek.getTime() + 7 * 86400000)
            const reportNo = `RPT-${coach.id}-${startOfWeek.toISOString().slice(0, 10)}`

            const faultHours = newStatus === 'NORMAL' ? 0 : 2

            await prisma.coachCapacityReport.upsert({
              where: { coachId_weekStart: { coachId: coach.id, weekStart: startOfWeek } },
              update: {
                faultAffectHours: { increment: faultHours },
                deviceFaults: { set: `${fault.deviceName}:${newStatus}${logRemark ? '|' + logRemark : ''}` },
                remark: logRemark || undefined,
                userId: coachUserId
              },
              create: {
                reportNo,
                coachId: coach.id,
                userId: coachUserId,
                reportDate: now,
                weekStart: startOfWeek,
                weekEnd: endOfWeek,
                faultAffectHours: faultHours,
                deviceFaults: `${fault.deviceName}:${newStatus}`,
                remark: logRemark || undefined
              }
            })
          }
        }
      }

      await prisma.notification.create({
        data: {
          userId: fault.reporterId,
          type: 'DEVICE_FAULT',
          title: '设备故障处理更新',
          content: `您报修的 [${fault.deviceName}] 状态已更新为: ${newStatus}。${logRemark}`,
          relatedId: fault.id,
          relatedType: 'DeviceFault'
        }
      })

      return successResponse({ id: data.id, status: newStatus, remark: logRemark }, '处理成功')
    }

    return errorResponse('不支持的方法', 405)
  } catch (e: any) {
    if (e instanceof z.ZodError) return errorResponse(e.errors[0].message, 400)
    return errorResponse(e.message || '操作失败', 500)
  }
})
