'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type NotificationType = Database['public']['Tables']['notifications']['Insert']['type']
type NotificationChannel = Database['public']['Tables']['notification_queue']['Insert']['channel']
type NotificationRow = Database['public']['Tables']['notifications']['Row']
type NotificationQueueRow = Database['public']['Tables']['notification_queue']['Row']

const SIMULATE_FAILURE_RATE = 0.3

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
    } as Database['public']['Tables']['notifications']['Insert'])
    .select()
    .single()

  if (notificationError) throw notificationError

  const notif = notification as NotificationRow
  const queuePromises: Promise<any>[] = []

  if (options.sendEmail && options.recipientEmail) {
    queuePromises.push(
      supabase.from('notification_queue').insert({
        notification_id: notif.id,
        channel: 'email',
        recipient: options.recipientEmail,
        subject: options.title,
        content: options.content,
        max_retries: 5,
      } as Database['public']['Tables']['notification_queue']['Insert'])
    )
  }

  if (options.sendSms && options.recipientPhone) {
    queuePromises.push(
      supabase.from('notification_queue').insert({
        notification_id: notif.id,
        channel: 'sms',
        recipient: options.recipientPhone,
        subject: options.title,
        content: options.content,
        max_retries: 5,
      } as Database['public']['Tables']['notification_queue']['Insert'])
    )
  }

  if (queuePromises.length > 0) {
    await Promise.all(queuePromises)
  }

  return notif
}

export async function processNotificationQueue() {
  const supabase = createClient()

  const { data: pendingNotifications } = await supabase
    .from('notification_queue')
    .select('*')
    .or('status.eq.pending,and(status.eq.failed,retry_count.lt.max_retries)')
    .order('created_at', { ascending: true })
    .limit(10)

  const items = pendingNotifications as NotificationQueueRow[] | null
  if (!items || items.length === 0) {
    return { processed: 0 }
  }

  const results = await Promise.allSettled(
    items.map(async (item) => {
      await supabase
        .from('notification_queue')
        .update({ status: 'sending', last_attempt_at: new Date().toISOString() } as Database['public']['Tables']['notification_queue']['Update'])
        .eq('id', item.id)

      try {
        if (item.channel === 'email') {
          await sendEmail(item.recipient, item.subject, item.content)
        } else if (item.channel === 'sms') {
          await sendSms(item.recipient, item.content)
        }

        await supabase
          .from('notification_queue')
          .update({ status: 'sent', retry_count: item.retry_count + 1 } as Database['public']['Tables']['notification_queue']['Update'])
          .eq('id', item.id)

        return { id: item.id, success: true }
      } catch (error: any) {
        const newRetryCount = item.retry_count + 1
        const newStatus = newRetryCount >= item.max_retries ? 'failed' : 'pending'

        await supabase
          .from('notification_queue')
          .update({
            status: newStatus,
            retry_count: newRetryCount,
            last_error: error.message,
          } as Database['public']['Tables']['notification_queue']['Update'])
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

export async function retryNotification(notificationId: string) {
  const supabase = createClient()

  const { data: item } = await supabase
    .from('notification_queue')
    .select('*')
    .eq('id', notificationId)
    .single()

  const queueItem = item as NotificationQueueRow | null
  if (!queueItem) {
    throw new Error('通知不存在')
  }

  await supabase
    .from('notification_queue')
    .update({ status: 'sending', last_attempt_at: new Date().toISOString() } as Database['public']['Tables']['notification_queue']['Update'])
    .eq('id', notificationId)

  try {
    if (queueItem.channel === 'email') {
      await sendEmail(queueItem.recipient, queueItem.subject, queueItem.content)
    } else if (queueItem.channel === 'sms') {
      await sendSms(queueItem.recipient, queueItem.content)
    }

    await supabase
      .from('notification_queue')
      .update({ status: 'sent', retry_count: queueItem.retry_count + 1 } as Database['public']['Tables']['notification_queue']['Update'])
      .eq('id', notificationId)

    return { success: true }
  } catch (error: any) {
    const newRetryCount = queueItem.retry_count + 1
    const newStatus = newRetryCount >= queueItem.max_retries ? 'failed' : 'pending'

    await supabase
      .from('notification_queue')
      .update({
        status: newStatus,
        retry_count: newRetryCount,
        last_error: error.message,
      } as Database['public']['Tables']['notification_queue']['Update'])
      .eq('id', notificationId)

    return { success: false, error: error.message }
  }
}

export async function resetNotificationRetry(notificationId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('notification_queue')
    .update({
      status: 'pending',
      retry_count: 0,
      last_error: null,
    } as Database['public']['Tables']['notification_queue']['Update'])
    .eq('id', notificationId)

  if (error) throw error

  return { success: true }
}

export async function deleteNotificationFromQueue(notificationId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('notification_queue')
    .delete()
    .eq('id', notificationId)

  if (error) throw error

  return { success: true }
}

async function sendEmail(to: string, subject: string, content: string) {
  console.log(`[Email] To: ${to}, Subject: ${subject}`)
  
  if (Math.random() < SIMULATE_FAILURE_RATE) {
    const error = new Error('SMTP连接超时：无法连接到邮件服务器')
    console.error(`[Email] 发送失败: ${error.message}`)
    throw error
  }
  
  console.log(`[Email] 发送成功`)
}

async function sendSms(to: string, content: string) {
  console.log(`[SMS] To: ${to}`)
  
  if (Math.random() < SIMULATE_FAILURE_RATE) {
    const error = new Error('短信网关错误：服务商限流')
    console.error(`[SMS] 发送失败: ${error.message}`)
    throw error
  }
  
  console.log(`[SMS] 发送成功`)
}
