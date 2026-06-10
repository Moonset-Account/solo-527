import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse, generateOrderNo } from '../../utils/helpers'
import { z } from 'zod'

const regSchema = z.object({
  tournamentId: z.number().int().positive(),
  userId: z.number().int().positive(),
  teamName: z.string().optional(),
  partnerName: z.string().optional(),
  partnerPhone: z.string().optional(),
  remark: z.string().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAuth(event)
    const method = event.method
    const query = getQuery(event)
    const tournamentId = query.tournamentId ? Number(query.tournamentId) : undefined

    if (method === 'GET') {
      if (!tournamentId) return errorResponse('参数错误', 400)
      const userId = query.userId ? Number(query.userId) : undefined
      const where: any = { tournamentId }
      if (userId) where.userId = userId
      const list = await prisma.tournamentRegistration.findMany({
        where,
        include: {
          user: { select: { id: true, realName: true, phone: true, username: true } },
          tournament: { select: { id: true, name: true, startDate: true } },
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
          checkIn: true
        },
        orderBy: { registeredAt: 'asc' }
      })
      return successResponse(list)
    }

    if (method === 'POST') {
      const body = await readBody(event)
      const data = regSchema.parse(body)

      const tournament = await prisma.tournament.findUnique({ where: { id: data.tournamentId } })
      if (!tournament) return errorResponse('赛事不存在', 404)
      if (tournament.status !== 'REGISTERING' && tournament.status !== 'DRAFT') {
        return errorResponse(`当前赛事状态 [${tournament.status}] 不允许报名`, 400)
      }
      if (new Date() > tournament.regDeadline) {
        return errorResponse('报名已截止', 400)
      }

      const currentCount = await prisma.tournamentRegistration.count({ where: { tournamentId: data.tournamentId, status: 1 } })
      if (currentCount >= tournament.maxPlayers) {
        return errorResponse('报名人数已满', 409)
      }

      let reg: any
      try {
        reg = await prisma.tournamentRegistration.create({
          data: { ...data, status: 1 },
          include: {
            user: true,
            tournament: true
          }
        })
      } catch (err: any) {
        if (err.code === 'P2002') return errorResponse('该用户已报名', 409)
        throw err
      }

      await prisma.tournament.update({
        where: { id: data.tournamentId },
        data: { currentPlayers: currentCount + 1 }
      })

      if (tournament.registrationFee > 0) {
        await prisma.payment.create({
          data: {
            paymentNo: generateOrderNo('PY'),
            tournamentRegId: reg.id,
            userId: data.userId,
            amount: tournament.registrationFee,
            status: 'UNPAID',
            method: 'OTHER',
            subject: `赛事报名-${tournament.name}`,
            description: `报名人: ${reg.user.realName || reg.user.username}`
          }
        })
      }

      return successResponse(reg, '报名成功')
    }

    if (method === 'DELETE') {
      const id = Number(query.id)
      if (!id) return errorResponse('参数错误', 400)
      const reg = await prisma.tournamentRegistration.findUnique({ where: { id }, include: { tournament: true } })
      if (!reg) return errorResponse('报名记录不存在', 404)

      await prisma.tournamentRegistration.update({ where: { id }, data: { status: 0 } })
      const currentCount = await prisma.tournamentRegistration.count({ where: { tournamentId: reg.tournamentId, status: 1 } })
      await prisma.tournament.update({ where: { id: reg.tournamentId }, data: { currentPlayers: Math.max(0, currentCount) } })

      return successResponse(null, '已取消报名')
    }

    return errorResponse('不支持的方法', 405)
  } catch (e: any) {
    if (e instanceof z.ZodError) return errorResponse(e.errors[0].message, 400)
    return errorResponse(e.message || '操作失败', 500)
  }
})
