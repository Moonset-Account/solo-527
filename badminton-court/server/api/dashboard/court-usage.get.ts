import prisma from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import { successResponse, errorResponse, dateToStr, parseTimeToMinutes, minutesToTime } from '../../utils/helpers'
import type { BookingStatus, CourtStatus } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    const query = getQuery(event)
    const date = query.date as string || dateToStr(new Date())
    const courtId = query.courtId ? Number(query.courtId) : undefined

    const targetDate = new Date(date)
    const dayStart = new Date(dateToStr(targetDate))
    const dayEnd = new Date(dayStart.getTime() + 86400000)

    const courts = await prisma.court.findMany({
      where: courtId ? { id: courtId } : { status: { not: 'CLOSED' as CourtStatus } },
      orderBy: [{ sortOrder: 'asc' }, { courtNumber: 'asc' }],
      include: {
        prices: { where: { status: 1 } }
      }
    })

    const bookings = await prisma.booking.findMany({
      where: {
        bookingDate: { gte: dayStart, lt: dayEnd },
        status: { notIn: ['CANCELLED', 'REFUNDED'] as BookingStatus[] },
        ...(courtId ? { courtId } : {})
      },
      include: {
        customer: { select: { id: true, realName: true, phone: true, username: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { startTime: 'asc' }
    })

    const timeSlots: string[] = []
    for (let h = 6; h <= 23; h++) {
      timeSlots.push(`${String(h).padStart(2, '0')}:00`)
    }

    const courtBoard = courts.map(court => {
      const courtBookings = bookings.filter(b => b.courtId === court.id)

      const timeStatuses: Record<string, any> = {}
      for (let m = 360; m <= 1440; m += 30) {
        const t = minutesToTime(m)
        const overlap = courtBookings.find(b => {
          const bs = parseTimeToMinutes(b.startTime)
          const be = parseTimeToMinutes(b.endTime)
          return m >= bs && m < be
        })
        timeStatuses[t] = overlap ? {
          type: overlap.status,
          booking: {
            id: overlap.id,
            orderNo: overlap.orderNo,
            startTime: overlap.startTime,
            endTime: overlap.endTime,
            customer: overlap.customer,
            status: overlap.status,
            actualAmount: overlap.actualAmount,
            paidAmount: overlap.paidAmount
          }
        } : { type: court.status }
      }

      const bookedMinutes = courtBookings.reduce((sum, b) => sum + b.duration, 0)
      const totalMinutes = 18 * 60
      const utilization = Math.round((bookedMinutes / totalMinutes) * 10000) / 100

      const revenue = courtBookings.reduce((sum, b) => sum + Number(b.paidAmount || b.actualAmount || 0), 0)
      const bookingCount = courtBookings.length
      const peopleCount = courtBookings.reduce((sum, b) => sum + b.peopleCount, 0)

      return {
        court: {
          id: court.id,
          courtNumber: court.courtNumber,
          name: court.name,
          courtType: court.courtType,
          location: court.location,
          status: court.status,
          maxCapacity: court.maxCapacity
        },
        bookings: courtBookings,
        timeStatuses,
        stats: {
          utilization,
          revenue: Math.round(revenue * 100) / 100,
          bookingCount,
          peopleCount
        }
      }
    })

    const overallStats = {
      totalCourts: courts.length,
      totalBookings: bookings.length,
      totalRevenue: Math.round(courtBoard.reduce((s, c) => s + c.stats.revenue, 0) * 100) / 100,
      avgUtilization: courts.length > 0
        ? Math.round((courtBoard.reduce((s, c) => s + c.stats.utilization, 0) / courts.length) * 100) / 100
        : 0,
      totalPeople: courtBoard.reduce((s, c) => s + c.stats.peopleCount, 0),
      statusBreakdown: {
        pending: bookings.filter(b => b.status === 'PENDING').length,
        confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
        paid: bookings.filter(b => b.status === 'PAID').length,
        checkedIn: bookings.filter(b => b.status === 'CHECKED_IN').length,
        completed: bookings.filter(b => b.status === 'COMPLETED').length,
        abnormal: bookings.filter(b => b.status === 'ABNORMAL').length
      }
    }

    const statusCounts: Record<string, number> = {
      available: 0,
      booked: 0,
      maintenance: 0,
      closed: 0
    }
    for (const court of courts) {
      if (court.status === 'AVAILABLE') statusCounts.available++
      else if (court.status === 'MAINTENANCE') statusCounts.maintenance++
      else if (court.status === 'CLOSED') statusCounts.closed++
      else statusCounts.booked++
    }

    return successResponse({
      date,
      timeSlots,
      courtBoard,
      overallStats,
      statusCounts
    })
  } catch (e: any) {
    return errorResponse(e.message || '获取看板数据失败', 500)
  }
})
