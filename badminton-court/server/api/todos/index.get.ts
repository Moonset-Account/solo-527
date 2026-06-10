import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse, dateToStr } from '../../utils/helpers'
import type { BookingStatus, CheckInStatus, TournamentStatus, DeviceStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAuth(event)
    const query = getQuery(event)
    const type = query.type as string
    const date = query.date as string
    const keyword = query.keyword as string || ''

    const today = new Date()
    const dayStart = new Date(dateToStr(date ? new Date(date) : today))
    const dayEnd = new Date(dayStart.getTime() + 86400000)

    const result: any = {
      date: dateToStr(dayStart),
      summary: {
        pendingBookings: 0,
        pendingCheckins: 0,
        upcomingTournaments: 0,
        pendingRegistrations: 0,
        pendingFaults: 0,
        pendingPayments: 0
      },
      items: []
    }

    if (!type || type === 'booking' || type === 'all') {
      const bookingWhere: any = {
        bookingDate: { gte: dayStart, lt: dayEnd },
        status: { in: ['PENDING', 'CONFIRMED', 'PAID', 'CHECKED_IN'] as BookingStatus[] }
      }
      if (keyword) {
        bookingWhere.OR = [
          { orderNo: { contains: keyword } },
          { customer: { realName: { contains: keyword } } },
          { customer: { phone: { contains: keyword } } },
          { checkInCode: { contains: keyword } }
        ]
      }

      const bookings = await prisma.booking.findMany({
        where: bookingWhere,
        include: {
          customer: { select: { id: true, realName: true, phone: true, username: true, balance: true } },
          court: { select: { id: true, courtNumber: true, name: true, location: true } },
          staff: { select: { id: true, realName: true } },
          payments: { orderBy: { createdAt: 'desc' }, take: 1, select: { id: true, status: true, method: true, paidAt: true, paidAmount: true } },
          coachAssignments: { include: { coach: { include: { user: { select: { realName: true, phone: true } } } } },
          tournament: { select: { id: true, name: true } },
          checkIns: { take: 1, orderBy: { checkInTime: 'desc' } }
        },
        orderBy: [{ startTime: 'asc' }]
      })

      result.summary.pendingBookings = bookings.length
      result.summary.pendingCheckins = bookings.filter(b => b.status === 'PAID' || b.status === 'CONFIRMED').length
      result.summary.pendingPayments = bookings.filter(b => b.status === 'PENDING' || b.status === 'CONFIRMED').length

      for (const b of bookings) {
        result.items.push({
          id: b.id,
          type: 'booking',
          title: `${b.court?.name} - ${b.startTime}~${b.endTime}`,
          subtitle: `${b.customer?.realName || b.customer?.username} (${b.customer?.phone})`,
          status: b.status,
          statusText: statusText(b.status),
          priority: calcPriority(b.status, b.startTime),
          createdAt: b.createdAt,
          badge: [
            `${b.court?.courtNumber}`,
            `${b.startTime}-${b.endTime}`,
            b.peopleCount + '人'
          ].filter(Boolean),
          data: {
            booking: b
          }
        })
      }
    }

    if (!type || type === 'tournament' || type === 'all') {
      const regWhere: any = {
        status: 1
      }
      const tournaments = await prisma.tournament.findMany({
        where: {
          status: { in: ['REGISTERING', 'UPCOMING', 'ONGOING'] as TournamentStatus[] },
          ...(keyword ? { name: { contains: keyword } } : {})
        },
        include: {
          registrations: {
            where: regWhere,
            include: { user: { select: { realName: true, phone: true } } },
            take: 50
          }
        },
        orderBy: [{ startDate: 'asc' }]
      })

      result.summary.upcomingTournaments = tournaments.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED').length
      result.summary.pendingRegistrations = tournaments.reduce((s, t) => s + (t.currentPlayers || 0), 0)

      for (const t of tournaments) {
        const regsPendingCheckIn = t.registrations.filter(r => {
          return true
        })

        result.items.push({
          id: t.id,
          type: 'tournament',
          title: `赛事: ${t.name}`,
          subtitle: `${dateToStr(t.startDate)}~${dateToStr(t.endDate)} | ${t.currentPlayers}/${t.maxPlayers}人已报名`,
          status: t.status,
          statusText: statusText(t.status),
          priority: t.status === 'ONGOING' ? 'high' : t.status === 'UPCOMING' ? 'medium' : 'low',
          createdAt: t.startDate,
          badge: [
            t.formatType,
            t.level,
            `${t.currentPlayers}/${t.maxPlayers}`
          ].filter(Boolean),
          data: {
            tournament: t,
            registrations: t.registrations,
            checkInList: t.registrations.map(r => ({
              regId: r.id,
              userId: r.userId,
              userName: r.user?.realName || r.user?.username,
              phone: r.user?.phone,
              status: 'PENDING'
            }))
          }
        })
      }
    }

    if (!type || type === 'checkin' || type === 'all') {
      if (type === 'checkin') {
        const checkinWhere: any = {
          status: { in: ['PENDING', 'LATE', 'CHECKED_IN'] as CheckInStatus[] },
          checkInTime: { gte: dayStart, lt: dayEnd }
        }
        const checkins = await prisma.checkInRecord.findMany({
          where: checkinWhere,
          include: {
            user: { select: { realName: true, phone: true } },
            booking: { select: { orderNo: true, startTime: true, endTime: true, court: { select: { id: true, courtNumber: true, name: true } } } },
            tournament: { select: { name: true } }
          },
          orderBy: { checkInTime: 'desc' }
        })

        for (const c of checkins) {
          result.items.push({
            id: c.id,
            type: 'checkin',
            title: `签到: ${c.user?.realName || c.user?.username}`,
            subtitle: `${c.booking ? c.booking.court?.name + ' ' + c.booking.startTime + '-' + c.booking.endTime : c.tournament?.name || '无关联'}`,
            status: c.status,
            statusText: statusText(c.status),
            priority: c.status === 'LATE' ? 'high' : 'medium',
            createdAt: c.createdAt,
            badge: [c.method || '手动'],
            data: { checkIn: c }
          })
        }
      }
    }

    if (!type || type === 'fault' || type === 'all') {
      const faultWhere: any = {
        status: { in: ['FAULT_REPORTED', 'REPAIRING', 'REPAIRED'] as DeviceStatus[] }
      }
      if (keyword) faultWhere.OR = [{ deviceName: { contains: keyword } }, { description: { contains: keyword } }]

      const faults = await prisma.deviceFault.findMany({
        where: faultWhere,
        include: {
          court: { select: { courtNumber: true, name: true } },
          reporter: { select: { realName: true, phone: true } },
          handler: { select: { realName: true, phone: true } }
        },
        orderBy: { reportedAt: 'desc' }
      })

      result.summary.pendingFaults = faults.filter(f => f.status === 'FAULT_REPORTED' || f.status === 'REPAIRING').length

      for (const f of faults) {
        result.items.push({
          id: f.id,
          type: 'fault',
          title: `故障: ${f.deviceName}`,
          subtitle: `${f.court?.courtNumber || '公共'} | ${f.description.slice(0, 30)}${f.description.length > 30 ? '...' : ''}`,
          status: f.status,
          statusText: statusText(f.status),
          priority: f.status === 'FAULT_REPORTED' ? 'high' : 'medium',
          createdAt: f.reportedAt,
          badge: [f.faultLevel, f.deviceType],
          data: { fault: f }
        })
      }
    }

    result.items.sort((a: any, b: any) => {
      const pRank: Record<string, number> = { high: 0, medium: 1, low: 2 }
      if (pRank[a.priority] !== pRank[b.priority]) return pRank[a.priority] - pRank[b.priority]
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    return successResponse(result)
  } catch (e: any) {
    return errorResponse(e.message || '获取待办失败', 500)
  }
})

function statusText(status: string): string {
  const map: Record<string, string> = {
    PENDING: '待确认', CONFIRMED: '已确认', PAID: '已支付', CHECKED_IN: '已签到',
    IN_USE: '使用中', COMPLETED: '已完成', CANCELLED: '已取消', ABNORMAL: '异常结束', REFUNDED: '已退款',
    CHECKED_OUT: '已签退', LATE: '迟到', NO_SHOW: '未到',
    DRAFT: '草稿', REGISTERING: '报名中', UPCOMING: '即将开始', ONGOING: '进行中',
    FAULT_REPORTED: '待处理', REPAIRING: '维修中', REPAIRED: '已修好', NORMAL: '正常', SCRAPPED: '已报废'
  }
  return map[status] || status
}

function calcPriority(status: string, startTime: string): string {
  if (status === 'CHECKED_IN' || status === 'IN_USE') return 'high'
  if (status === 'ABNORMAL') return 'high'
  const now = new Date()
  const [h, m] = startTime.split(':').map(Number)
  const sTime = new Date(now)
  sTime.setHours(h, m, 0, 0)
  const diff = sTime.getTime() - now.getTime()
  if (diff < 0 && (status === 'PAID' || status === 'CONFIRMED')) return 'high'
  if (diff < 3600000) return 'medium'
  return 'low'
}
