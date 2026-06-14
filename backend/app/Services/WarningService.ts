import WarningLog from 'App/Models/WarningLog'
import Redis from '@ioc:Adonis/Addons/Redis'
import ReminderConfig from 'App/Models/ReminderConfig'

export default class WarningService {
  private static RATE_LIMIT_PREFIX = 'warning:rate:'

  public static async create(
    warningType: string,
    level: string,
    title: string,
    content?: string,
    relatedId?: number,
    relatedType?: string
  ) {
    const rateKey = `${this.RATE_LIMIT_PREFIX}${warningType}:${relatedId || 'global'}`
    const lastSent = await Redis.get(rateKey)

    if (lastSent) {
      return null
    }

    const config = await ReminderConfig.query().where('reminder_type', warningType).first()
    const ttl = config?.frequencyMinutes || 60

    await Redis.setex(rateKey, ttl * 60, '1')

    return WarningLog.create({
      warningType,
      level,
      title,
      content,
      relatedId,
      relatedType,
      status: 'pending',
    })
  }

  public static async checkAndCreateWarnings() {
    const warnings: any[] = []

    const unpaidOrders = (await import('App/Models/Order')).default
      .query()
      .where('payment_status', 'unpaid')
      .where('created_at', '<', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const orders = await unpaidOrders
    for (const order of orders) {
      const w = await this.create(
        'unpaid_order',
        'warning',
        `订单 ${order.orderNo} 超24小时未支付`,
        `订单金额: ${order.amount} 元，已超过24小时未支付`,
        order.id,
        'order'
      )
      if (w) warnings.push(w)
    }

    return warnings
  }

  public static async getWarnings(filters: { status?: string; level?: string; type?: string } = {}) {
    const query = WarningLog.query().orderBy('created_at', 'desc')
    if (filters.status) query.where('status', filters.status)
    if (filters.level) query.where('level', filters.level)
    if (filters.type) query.where('warning_type', filters.type)
    return query.limit(100)
  }

  public static async seedInitialReminderConfigs() {
    const configs = [
      { reminderType: 'unpaid_order', label: '未支付订单提醒', frequencyMinutes: 60, isEnabled: true, sendEmail: false, sendSms: false, sendInApp: true, customMessage: '您有订单超过24小时未支付' },
      { reminderType: 'refund_exception', label: '退款异常提醒', frequencyMinutes: 30, isEnabled: true, sendEmail: true, sendSms: false, sendInApp: true, customMessage: '有新的退款异常需要处理' },
      { reminderType: 'partnership_stage', label: '合作阶段超时提醒', frequencyMinutes: 120, isEnabled: true, sendEmail: false, sendSms: false, sendInApp: true, customMessage: '合作项目阶段停留时间过长' },
      { reminderType: 'subscription_expire', label: '会员到期提醒', frequencyMinutes: 1440, isEnabled: true, sendEmail: true, sendSms: false, sendInApp: true, customMessage: '您的会员即将到期' },
      { reminderType: 'delivery_delay', label: '交付延期提醒', frequencyMinutes: 120, isEnabled: true, sendEmail: false, sendSms: false, sendInApp: true, customMessage: '赞助权益交付已延期' },
    ]

    for (const cfg of configs) {
      await ReminderConfig.firstOrCreate({ reminderType: cfg.reminderType }, cfg)
    }
  }
}
