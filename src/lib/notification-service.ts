'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

type NotificationType = Database['public']['Tables']['notifications']['Insert']['type']
type NotificationChannel = Database['public']['Tables']['notification_queue']['Insert']['channel']
type NotificationRow = Database['public']['Tables']['notifications']['Row']
type NotificationQueueRow = Database['public']['Tables']['notification_queue']['Row']

interface CreateNotificationOptions {
  userId: string
  type: NotificationType
  title: string
  content: string
  relatedOrderId?: string
  sendEmail?: boolean
  sendSms?: boolean
  recipientEmail?: string | null
  recipientPhone?: string | null
  priority?: 'low' | 'normal' | 'high'
}

interface SendResult {
  success: boolean
  error?: string
  retryable?: boolean
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

  const priority = options.priority || 'normal'

  if (options.sendEmail && options.recipientEmail) {
    queuePromises.push(
      supabase.from('notification_queue').insert({
        notification_id: notif.id,
        channel: 'email',
        recipient: options.recipientEmail as string,
        subject: options.title,
        content: options.content,
        max_retries: priority === 'high' ? 10 : 5,
        priority,
      } as Database['public']['Tables']['notification_queue']['Insert'])
    )
  }

  if (options.sendSms && options.recipientPhone) {
    queuePromises.push(
      supabase.from('notification_queue').insert({
        notification_id: notif.id,
        channel: 'sms',
        recipient: options.recipientPhone as string,
        subject: options.title,
        content: options.content,
        max_retries: priority === 'high' ? 10 : 5,
        priority,
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
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(20)

  const items = pendingNotifications as NotificationQueueRow[] | null
  if (!items || items.length === 0) {
    return { processed: 0 }
  }

  const results = await Promise.allSettled(
    items.map(async (item) => {
      await supabase
        .from('notification_queue')
        .update({ 
          status: 'sending', 
          last_attempt_at: new Date().toISOString() 
        } as Database['public']['Tables']['notification_queue']['Update'])
        .eq('id', item.id)

      let sendResult: SendResult = { success: false, error: '未知错误', retryable: true }

      try {
        if (item.channel === 'email') {
          sendResult = await sendEmail(item.recipient, item.subject, item.content)
        } else if (item.channel === 'sms') {
          sendResult = await sendSms(item.recipient, item.content)
        }

        if (sendResult.success) {
          await supabase
            .from('notification_queue')
            .update({ 
              status: 'sent', 
              retry_count: item.retry_count + 1,
              sent_at: new Date().toISOString(),
              last_error: null,
            } as Database['public']['Tables']['notification_queue']['Update'])
            .eq('id', item.id)

          return { id: item.id, success: true }
        } else {
          throw new Error(sendResult.error || '发送失败')
        }
      } catch (error: any) {
        const newRetryCount = item.retry_count + 1
        const maxRetriesReached = newRetryCount >= item.max_retries
        const newStatus = maxRetriesReached ? 'failed' : 'pending'

        const nextRetryAt = maxRetriesReached 
          ? null 
          : calculateNextRetryTime(newRetryCount)

        await supabase
          .from('notification_queue')
          .update({
            status: newStatus,
            retry_count: newRetryCount,
            last_error: error.message,
            next_retry_at: nextRetryAt,
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

function calculateNextRetryTime(retryCount: number): string {
  const backoffMinutes = Math.min(Math.pow(2, retryCount) * 5, 1440)
  const next = new Date()
  next.setMinutes(next.getMinutes() + backoffMinutes)
  return next.toISOString()
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
    .update({ 
      status: 'sending', 
      last_attempt_at: new Date().toISOString(),
      next_retry_at: null,
    } as Database['public']['Tables']['notification_queue']['Update'])
    .eq('id', notificationId)

  let sendResult: SendResult

  try {
    if (queueItem.channel === 'email') {
      sendResult = await sendEmail(queueItem.recipient, queueItem.subject, queueItem.content)
    } else if (queueItem.channel === 'sms') {
      sendResult = await sendSms(queueItem.recipient, queueItem.content)
    } else {
      sendResult = { success: false, error: '不支持的渠道', retryable: false }
    }

    if (sendResult.success) {
      await supabase
        .from('notification_queue')
        .update({ 
          status: 'sent', 
          retry_count: queueItem.retry_count + 1,
          sent_at: new Date().toISOString(),
          last_error: null,
        } as Database['public']['Tables']['notification_queue']['Update'])
        .eq('id', notificationId)

      return { success: true }
    } else {
      throw new Error(sendResult.error || '发送失败')
    }
  } catch (error: any) {
    const newRetryCount = queueItem.retry_count + 1
    const maxRetriesReached = newRetryCount >= queueItem.max_retries
    const newStatus = maxRetriesReached ? 'failed' : 'pending'

    const nextRetryAt = maxRetriesReached 
      ? null 
      : calculateNextRetryTime(newRetryCount)

    await supabase
      .from('notification_queue')
      .update({
        status: newStatus,
        retry_count: newRetryCount,
        last_error: error.message,
        next_retry_at: nextRetryAt,
      } as Database['public']['Tables']['notification_queue']['Update'])
      .eq('id', notificationId)

    return { success: false, error: error.message, retryable: !maxRetriesReached }
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
      next_retry_at: null,
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

async function sendEmail(to: string, subject: string, content: string): Promise<SendResult> {
  console.log(`[Email] 正在发送邮件 To: ${to}, Subject: ${subject}`)
  
  try {
    const result = await simulateEmailDelivery(to, subject, content)
    console.log(`[Email] 发送成功: ${to}`)
    return { success: true }
  } catch (error: any) {
    console.error(`[Email] 发送失败 To: ${to}, 错误: ${error.message}`)
    return {
      success: false,
      error: error.message,
      retryable: isRetryableError(error.message),
    }
  }
}

async function sendSms(to: string, content: string): Promise<SendResult> {
  console.log(`[SMS] 正在发送短信 To: ${to}`)
  
  try {
    const result = await simulateSmsDelivery(to, content)
    console.log(`[SMS] 发送成功: ${to}`)
    return { success: true }
  } catch (error: any) {
    console.error(`[SMS] 发送失败 To: ${to}, 错误: ${error.message}`)
    return {
      success: false,
      error: error.message,
      retryable: isRetryableError(error.message),
    }
  }
}

async function simulateEmailDelivery(to: string, subject: string, content: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const failureScenarios = [
    { condition: to.includes('fail'), message: '收件人邮箱不存在' },
    { condition: to.includes('spam'), message: '邮件被标记为垃圾邮件' },
    { condition: Math.random() < 0.1, message: 'SMTP服务器连接超时' },
    { condition: Math.random() < 0.05, message: '发件人域名验证失败' },
  ]

  for (const scenario of failureScenarios) {
    if (scenario.condition) {
      throw new Error(scenario.message)
    }
  }

  return true
}

async function simulateSmsDelivery(to: string, content: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const failureScenarios = [
    { condition: to.includes('0000'), message: '手机号码格式错误' },
    { condition: to.includes('9999'), message: '用户已关机' },
    { condition: Math.random() < 0.1, message: '短信网关限流' },
    { condition: Math.random() < 0.05, message: '运营商网络异常' },
  ]

  for (const scenario of failureScenarios) {
    if (scenario.condition) {
      throw new Error(scenario.message)
    }
  }

  return true
}

function isRetryableError(errorMessage: string): boolean {
  const nonRetryableErrors = [
    '收件人邮箱不存在',
    '手机号码格式错误',
    '用户已关机',
  ]
  
  return !nonRetryableErrors.some(err => errorMessage.includes(err))
}
