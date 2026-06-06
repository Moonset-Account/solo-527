'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type NotificationType = Database['public']['Tables']['notifications']['Insert']['type']
type NotificationChannel = Database['public']['Tables']['notification_queue']['Insert']['channel']

interface CreateNotificationOptions {
  userId: string
  type: NotificationType
  title: string
  content: string
  relatedOrderId?: string
  sendEmail?: boolean
  sendSms?: boolean
  recipientEmail?: string
  recipientPhone?: string
}

export async function createNotification(options: CreateNotificationOptions) {
  const supabase = createClient()

  const { data: notification, error: notificationError } = await supabase
    .from('notifications')
    .insert({
      user_id: options.userId,
      type: options.type,
      title: options.title,
      content: options.content,
      related_order_id: options.relatedOrderId,
    })
    .select()
    .single()

  if (notificationError) throw notificationError

  const queuePromises: Promise<any>[] = []

  if (options.sendEmail && options.recipientEmail) {
    queuePromises.push(
      supabase.from('notification_queue').insert({
        notification_id: notification.id,
        channel: 'email',
        recipient: options.recipientEmail,
        subject: options.title,
        content: options.content,
        max_retries: 5,
      })
    )
  }

  if (options.sendSms && options.recipientPhone) {
    queuePromises.push(
      supabase.from('notification_queue').insert({
        notification_id: notification.id,
        channel: 'sms',
        recipient: options.recipientPhone,
        subject: options.title,
        content: options.content,
        max_retries: 5,
      })
    )
  }

  if (queuePromises.length > 0) {
    await Promise.all(queuePromises)
  }

  return notification
}

export async function processNotificationQueue() {
  const supabase = createClient()

  const { data: pendingNotifications } = await supabase
    .from('notification_queue')
    .select('*')
    .or('status.eq.pending,and(status.eq.failed,retry_count.lt.max_retries)')
    .order('created_at', { ascending: true })
    .limit(10)

  if (!pendingNotifications || pendingNotifications.length === 0) {
    return { processed: 0 }
  }

  const results = await Promise.allSettled(
    pendingNotifications.map(async (item) => {
      await supabase
        .from('notification_queue')
        .update({ status: 'sending', last_attempt_at: new Date().toISOString() })
        .eq('id', item.id)

      try {
        if (item.channel === 'email') {
          await sendEmail(item.recipient, item.subject, item.content)
        } else if (item.channel === 'sms') {
          await sendSms(item.recipient, item.content)
        }

        await supabase
          .from('notification_queue')
          .update({ status: 'sent', retry_count: item.retry_count + 1 })
          .eq('id', item.id)

        return { id: item.id, success: true }
      } catch (error: any) {
        const newRetryCount = item.retry_count + 1
        const newStatus = newRetryCount >= item.max_retries ? 'failed' : 'failed'

        await supabase
          .from('notification_queue')
          .update({
            status: newStatus,
            retry_count: newRetryCount,
            last_error: error.message,
          })
          .eq('id', item.id)

        return { id: item.id, success: false, error: error.message }
      }
    })
  )

  return {
    processed: results.length,
    results,
  }
}

async function sendEmail(to: string, subject: string, content: string) {
  console.log(`[Email] To: ${to}, Subject: ${subject}, Content: ${content}`)
  // TODO: 集成实际的邮件服务（如 Resend、SendGrid 等）
  // await resend.emails.send({ to, subject, html: content })
}

async function sendSms(to: string, content: string) {
  console.log(`[SMS] To: ${to}, Content: ${content}`)
  // TODO: 集成实际的短信服务（如阿里云、腾讯云短信等）
}
