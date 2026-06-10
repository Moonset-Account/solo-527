import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Booking from 'App/Models/Booking'
import Customer from 'App/Models/Customer'
import Staff from 'App/Models/Staff'
import TimeSlot from 'App/Models/TimeSlot'
import ExceptionTodo from 'App/Models/ExceptionTodo'
import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'

export default class DashboardController {
  public async index({ response }: HttpContextContract) {
    const today = DateTime.now().toISODate()
    const weekStart = DateTime.now().startOf('week').toISODate()
    const monthStart = DateTime.now().startOf('month').toISODate()

    const todayBookings = await Booking.query()
      .where('booking_date', today)
      .count('* as total')
      .first()

    const todayCompleted = await Booking.query()
      .where('booking_date', today)
      .whereIn('status', ['completed', 'arrived'])
      .count('* as total')
      .first()

    const todayNoShow = await Booking.query()
      .where('booking_date', today)
      .where('is_no_show', true)
      .count('* as total')
      .first()

    const weekBookings = await Booking.query()
      .whereBetween('booking_date', [weekStart, today])
      .count('* as total')
      .first()

    const monthRevenue = await Booking.query()
      .whereBetween('booking_date', [monthStart, today])
      .where('payment_status', 'paid')
      .sum('amount as total')
      .first()

    const pendingExceptions = await ExceptionTodo.query()
      .where('status', 'pending')
      .count('* as total')
      .first()

    const activeDoctors = await Staff.query()
      .where('type', 'doctor')
      .where('is_active', true)
      .count('* as total')
      .first()

    const activeTechnicians = await Staff.query()
      .where('type', 'technician')
      .where('is_active', true)
      .count('* as total')
      .first()

    const todaySlots = await TimeSlot.query()
      .where('slot_date', today)
      .where('status', 'available')
      .andWhereRaw('booked_count < capacity')
      .count('* as total')
      .first()

    const statusStats = await Booking.query()
      .select('status')
      .where('booking_date', today)
      .groupBy('status')
      .count('* as count')

    const sourceStats = await Booking.query()
      .select('source')
      .whereBetween('booking_date', [weekStart, today])
      .groupBy('source')
      .count('* as count')

    const recentBookings = await Booking.query()
      .preload('customer')
      .preload('staff')
      .preload('service')
      .orderBy('created_at', 'desc')
      .limit(10)

    return response.ok({
      data: {
        todayBookings: Number(todayBookings?.$extras.total || 0),
        todayCompleted: Number(todayCompleted?.$extras.total || 0),
        todayNoShow: Number(todayNoShow?.$extras.total || 0),
        weekBookings: Number(weekBookings?.$extras.total || 0),
        monthRevenue: Number(monthRevenue?.$extras.total || 0),
        pendingExceptions: Number(pendingExceptions?.$extras.total || 0),
        activeDoctors: Number(activeDoctors?.$extras.total || 0),
        activeTechnicians: Number(activeTechnicians?.$extras.total || 0),
        todayAvailableSlots: Number(todaySlots?.$extras.total || 0),
        statusStats: statusStats.map((s: any) => ({
          status: s.status,
          count: Number(s.$extras.count),
        })),
        sourceStats: sourceStats.map((s: any) => ({
          source: s.source,
          count: Number(s.$extras.count),
        })),
        recentBookings: recentBookings,
      },
    })
  }

  public async conversion({ request, response }: HttpContextContract) {
    const days = Number(request.input('days', 14))
    const endDate = DateTime.now()
    const startDate = endDate.minus({ days: days - 1 })
    const dates: string[] = []
    for (let i = 0; i < days; i++) {
      dates.push(startDate.plus({ days: i }).toISODate())
    }

    const stats: any[] = []
    for (const date of dates) {
      const dateEnd = DateTime.fromISO(date).toISODate()
      const total = await Booking.query().where('booking_date', dateEnd).count('* as total').first()
      const pending = await Booking.query().where('booking_date', dateEnd).where('status', 'pending').count('* as total').first()
      const arrived = await Booking.query().where('booking_date', dateEnd).whereIn('status', ['arrived', 'completed']).count('* as total').first()
      const cancelled = await Booking.query().where('booking_date', dateEnd).where('status', 'cancelled').count('* as total').first()
      const noShow = await Booking.query().where('booking_date', dateEnd).where('is_no_show', true).count('* as total').first()
      const paid = await Booking.query().where('booking_date', dateEnd).where('payment_status', 'paid').count('* as total').first()
      const revenue = await Booking.query().where('booking_date', dateEnd).where('payment_status', 'paid').sum('amount as total').first()

      const totalNum = Number(total?.$extras.total || 0)
      const arrivedNum = Number(arrived?.$extras.total || 0)
      const noShowNum = Number(noShow?.$extras.total || 0)
      const arrivedRate = totalNum > 0 ? (arrivedNum / totalNum) : 0
      const noShowRate = totalNum > 0 ? (noShowNum / totalNum) : 0

      stats.push({
        date: dateEnd,
        total: totalNum,
        pending: Number(pending?.$extras.total || 0),
        arrived: arrivedNum,
        cancelled: Number(cancelled?.$extras.total || 0),
        noShow: noShowNum,
        paid: Number(paid?.$extras.total || 0),
        revenue: Number(revenue?.$extras.total || 0),
        arrivedRate,
        noShowRate,
      })
    }

    return response.ok({ data: stats })
  }

  public async noShowTrend({ request, response }: HttpContextContract) {
    const months = Number(request.input('months', 6))
    const now = DateTime.now()
    const result = await Database.rawQuery(`
      SELECT
        to_char(booking_date, 'YYYY-MM') as month,
        COUNT(*) as total_bookings,
        SUM(CASE WHEN is_no_show = true THEN 1 ELSE 0 END) as no_show_count,
        ROUND(
          SUM(CASE WHEN is_no_show = true THEN 1 ELSE 0 END)::numeric /
          NULLIF(COUNT(*), 0)::numeric * 100, 2
        ) as no_show_rate
      FROM bookings
      WHERE booking_date >= date_trunc('month', CURRENT_DATE - INTERVAL '${months - 1} months')
      GROUP BY to_char(booking_date, 'YYYY-MM')
      ORDER BY month
    `)

    return response.ok({ data: result.rows || [] })
  }
}
