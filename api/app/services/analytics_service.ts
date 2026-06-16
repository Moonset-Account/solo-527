import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class AnalyticsService {
  public static async getConsultantCommissions(
    consultantId: number,
    startDate?: string,
    endDate?: string
  ) {
    const query = db
      .from('appointments')
      .join('appointment_items', 'appointments.id', 'appointment_items.appointment_id')
      .join('services', 'appointment_items.service_id', 'services.id')
      .where('appointments.consultant_id', consultantId)
      .where('appointments.status', 'completed')
      .where('appointment_items.status', 'completed')

    if (startDate) {
      query.where('appointments.appointment_date', '>=', startDate)
    }
    if (endDate) {
      query.where('appointments.appointment_date', '<=', endDate)
    }

    const result = await query
      .select([
        'appointments.consultant_id',
        db.raw('COUNT(DISTINCT appointments.id) as total_appointments'),
        db.raw('SUM(appointment_items.price) as total_revenue'),
        db.raw('SUM(appointment_items.price) * 0.3 as commission'),
      ])
      .groupBy('appointments.consultant_id')
      .first()

    return result || { consultantId, totalAppointments: 0, totalRevenue: 0, commission: 0 }
  }

  public static async getServicePriceAnalysis() {
    const result = await db
      .from('services')
      .leftJoin('appointment_items', 'services.id', 'appointment_items.service_id')
      .where('services.is_active', true)
      .select([
        'services.id',
        'services.name',
        'services.category',
        'services.price as base_price',
        db.raw('COUNT(appointment_items.id) as booking_count'),
        db.raw('COALESCE(AVG(appointment_items.price), services.price) as avg_actual_price'),
      ])
      .groupBy('services.id', 'services.name', 'services.category', 'services.price')
      .orderBy('booking_count', 'desc')

    return result
  }

  public static async getConsumptionRanking(
    startDate?: string,
    endDate?: string,
    limit: number = 20
  ) {
    const query = db
      .from('consumptions')
      .join('products', 'consumptions.product_id', 'products.id')
      .select([
        'products.id',
        'products.name',
        'products.sku',
        'products.category',
        db.raw('SUM(consumptions.quantity) as total_consumed'),
        db.raw('COUNT(DISTINCT consumptions.appointment_item_id) as usage_count'),
      ])
      .groupBy('products.id', 'products.name', 'products.sku', 'products.category')
      .orderBy('total_consumed', 'desc')
      .limit(limit)

    if (startDate) {
      query.where('consumptions.created_at', '>=', startDate)
    }
    if (endDate) {
      query.where('consumptions.created_at', '<=', endDate)
    }

    return query
  }

  public static async getAnomalyTracing(productId: number, days: number = 30) {
    const startDate = DateTime.local().minus({ days }).toISODate()

    const movements = await db
      .from('stock_movements')
      .where('product_id', productId)
      .where('created_at', '>=', startDate)
      .select('*')
      .orderBy('created_at', 'desc')

    const consumptions = await db
      .from('consumptions')
      .join('appointment_items', 'consumptions.appointment_item_id', 'appointment_items.id')
      .join('appointments', 'appointment_items.appointment_id', 'appointments.id')
      .join('products', 'consumptions.product_id', 'products.id')
      .where('consumptions.product_id', productId)
      .where('consumptions.created_at', '>=', startDate)
      .select([
        'consumptions.*',
        'appointments.customer_name',
        'appointments.consultant_id',
      ])
      .orderBy('consumptions.created_at', 'desc')

    const avgDailyConsumption = await db
      .from('consumptions')
      .where('product_id', productId)
      .where('created_at', '>=', startDate)
      .select(db.raw('COALESCE(SUM(quantity) / GREATEST(COUNT(DISTINCT DATE(created_at)), 1), 0) as avg_daily'))
      .first()

    return {
      productId,
      movements,
      consumptions,
      avgDailyConsumption: Number(avgDailyConsumption?.avgDaily || 0),
    }
  }

  public static async getVisitRate(startDate?: string, endDate?: string) {
    const start = startDate || DateTime.local().minus({ days: 30 }).toISODate()
    const end = endDate || DateTime.local().toISODate()

    const total = await db
      .from('appointments')
      .whereBetween('appointment_date', [start, end])
      .count('* as total')
      .first()

    const completed = await db
      .from('appointments')
      .whereBetween('appointment_date', [start, end])
      .where('status', 'completed')
      .count('* as completed')
      .first()

    const noShow = await db
      .from('appointments')
      .whereBetween('appointment_date', [start, end])
      .where('status', 'no_show')
      .count('* as no_show')
      .first()

    const totalAppointments = Number(total?.total || 0)
    const completedAppointments = Number(completed?.completed || 0)
    const noShowAppointments = Number(noShow?.no_show || 0)

    return {
      total: totalAppointments,
      completed: completedAppointments,
      noShow: noShowAppointments,
      visitRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
      noShowRate: totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0,
    }
  }
}
