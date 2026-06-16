import { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import Appointment from '#models/appointment'
import RestockAlert from '#models/restock_alert'
import Consumption from '#models/consumption'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class DashboardController {
  public async index({ response }: HttpContext) {
    const today = DateTime.local().toISODate()
    const sevenDaysAgo = DateTime.local().minus({ days: 7 }).toISODate()

    const [lowStockAlerts, todayAppointments, consumptionTrend, anomalyCount] = await Promise.all([
      this.getLowStockAlerts(),
      this.getTodayAppointmentStats(today),
      this.get7DayConsumptionTrend(sevenDaysAgo),
      this.getAnomalyCount(),
    ])

    return response.ok({
      lowStockAlerts,
      todayAppointments,
      consumptionTrend,
      anomalyCount,
    })
  }

  private async getLowStockAlerts() {
    return Product.query()
      .whereRaw('current_stock <= safety_stock')
      .where('status', 'active')
      .select('id', 'name', 'sku', 'currentStock', 'safetyStock')
      .orderBy('currentStock', 'asc')
      .limit(10)
  }

  private async getTodayAppointmentStats(today: string) {
    const total = await Appointment.query().where('appointmentDate', today).count('* as total').first()
    const completed = await Appointment.query()
      .where('appointmentDate', today)
      .where('status', 'completed')
      .count('* as total')
      .first()
    const scheduled = await Appointment.query()
      .where('appointmentDate', today)
      .where('status', 'scheduled')
      .count('* as total')
      .first()
    const inProgress = await Appointment.query()
      .where('appointmentDate', today)
      .where('status', 'in_progress')
      .count('* as total')
      .first()
    const noShow = await Appointment.query()
      .where('appointmentDate', today)
      .where('status', 'no_show')
      .count('* as total')
      .first()

    return {
      total: Number(total?.$extras.total || 0),
      completed: Number(completed?.$extras.total || 0),
      scheduled: Number(scheduled?.$extras.total || 0),
      inProgress: Number(inProgress?.$extras.total || 0),
      noShow: Number(noShow?.$extras.total || 0),
    }
  }

  private async get7DayConsumptionTrend(startDate: string) {
    return db
      .from('consumptions')
      .join('products', 'consumptions.product_id', 'products.id')
      .where('consumptions.created_at', '>=', startDate)
      .select([
        db.raw('DATE(consumptions.created_at) as date'),
        db.raw('SUM(consumptions.quantity) as total_quantity'),
        db.raw('COUNT(DISTINCT consumptions.product_id) as product_count'),
      ])
      .groupBy(db.raw('DATE(consumptions.created_at)'))
      .orderBy('date', 'asc')
  }

  private async getAnomalyCount() {
    const pendingAlerts = await RestockAlert.query()
      .where('status', 'pending')
      .count('* as total')
      .first()

    const urgentReminders = await db
      .from('reminders')
      .where('is_resolved', false)
      .whereIn('level', ['urgent', 'escalation'])
      .count('* as total')
      .first()

    return {
      pendingRestockAlerts: Number(pendingAlerts?.$extras.total || 0),
      urgentReminders: Number(urgentReminders?.total || 0),
    }
  }
}
