import type { NotificationType } from '@/types/database'
import { createClient } from '@/lib/supabase/server'

export class NotificationService {
  private supabase: ReturnType<typeof createClient>

  constructor(supabase?: ReturnType<typeof createClient>) {
    this.supabase = supabase || createClient()
  }

  async createNotification(params: {
    type: NotificationType
    recipient: string
    subject: string
    content: string
    booking_id?: string
  }) {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert(params)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async sendBookingCreatedNotification(booking: any) {
    await this.createNotification({
      type: 'email',
      recipient: booking.clients.email,
      subject: `订单确认 - ${booking.booking_no}`,
      content: `您的订单已创建，订单号：${booking.booking_no}，拍摄时间：${new Date(booking.start_time).toLocaleString()}`,
      booking_id: booking.id,
    })

    await this.createNotification({
      type: 'sms',
      recipient: booking.clients.phone,
      subject: '订单确认',
      content: `您的订单${booking.booking_no}已创建，拍摄时间：${new Date(booking.start_time).toLocaleDateString()}`,
      booking_id: booking.id,
    })
  }

  async sendBookingUpdatedNotification(booking: any, changes: string[]) {
    await this.createNotification({
      type: 'in_app',
      recipient: booking.client_id,
      subject: '订单更新',
      content: `您的订单${booking.booking_no}已更新：${changes.join('、')}`,
      booking_id: booking.id,
    })
  }

  async sendPaymentReminder(booking: any, daysUntil: number) {
    await this.createNotification({
      type: 'sms',
      recipient: booking.clients.phone,
      subject: '尾款提醒',
      content: `订单${booking.booking_no}将于${daysUntil}天后拍摄，请及时支付尾款${booking.total_amount - booking.paid_amount}元`,
      booking_id: booking.id,
    })

    await this.createNotification({
      type: 'email',
      recipient: booking.clients.email,
      subject: `尾款提醒 - 订单${booking.booking_no}`,
      content: `尊敬的客户，您的订单${booking.booking_no}将于${daysUntil}天后拍摄，剩余尾款${booking.total_amount - booking.paid_amount}元，请及时支付。`,
      booking_id: booking.id,
    })
  }

  async sendEquipmentReturnReminder(booking: any) {
    await this.createNotification({
      type: 'in_app',
      recipient: booking.created_by,
      subject: '器材归还提醒',
      content: `订单${booking.booking_no}的器材请及时归还`,
      booking_id: booking.id,
    })
  }

  async processPendingNotifications() {
    const { data: notifications } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('status', 'pending')
      .limit(10)

    if (!notifications) return

    for (const notification of notifications) {
      try {
        await this.sendNotification(notification)
        await this.supabase
          .from('notifications')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', notification.id)
      } catch (error: any) {
        await this.supabase
          .from('notifications')
          .update({ status: 'failed', error_message: error.message })
          .eq('id', notification.id)
      }
    }
  }

  private async sendNotification(notification: any) {
    switch (notification.type) {
      case 'email':
        console.log(`Sending email to ${notification.recipient}: ${notification.subject}`)
        break
      case 'sms':
        console.log(`Sending SMS to ${notification.recipient}: ${notification.content}`)
        break
      case 'in_app':
        console.log(`In-app notification for user ${notification.recipient}: ${notification.subject}`)
        break
    }
  }

  async getNotifications(filters?: {
    booking_id?: string
    status?: string
    type?: NotificationType
  }) {
    let query = this.supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.booking_id) {
      query = query.eq('booking_id', filters.booking_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }
}
