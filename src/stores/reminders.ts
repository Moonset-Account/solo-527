import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Reminder, ReminderRule } from '@/types'
import api from '@/api'

const mockReminders: Reminder[] = [
  { id: '1', type: 'restock', title: '甲油胶-裸粉库存不足', content: '当前库存8瓶，低于最低库存10瓶，建议补货30瓶', severity: 'medium', isRead: false, relatedId: '2', createdAt: '2026-06-15 09:00', actionUrl: '/inventory/restock' },
  { id: '2', type: 'restock', title: '光疗胶-透明已断货', content: '当前库存0瓶，需立即补货', severity: 'high', isRead: false, relatedId: '3', createdAt: '2026-06-14 18:00', actionUrl: '/inventory/restock' },
  { id: '3', type: 'evaluation', title: '王小姐未提交评价', content: '6月14日预约已完成，等待客户评价', severity: 'low', isRead: false, relatedId: 'APT-004', createdAt: '2026-06-16 10:00', actionUrl: '/reminders' },
  { id: '4', type: 'anomaly', title: '亮片消耗异常', content: '孙女士预约中亮片消耗15罐，超出正常范围', severity: 'high', isRead: true, relatedId: 'ANO-1', createdAt: '2026-06-14 17:00', actionUrl: '/analytics/anomaly' },
  { id: '5', type: 'appointment', title: '赵女士未到店', content: '11:00预约未到店，已超时30分钟', severity: 'medium', isRead: true, relatedId: 'APT-005', createdAt: '2026-06-16 11:30', actionUrl: '/appointments' },
  { id: '6', type: 'evaluation', title: '张女士评价提醒', content: '今日光疗延长服务已完成，3小时后发送评价提醒', severity: 'low', isRead: false, relatedId: 'APT-002', createdAt: '2026-06-16 14:00', actionUrl: '/reminders' },
]

const mockRules: ReminderRule[] = [
  { id: '1', name: '库存不足提醒', type: 'restock', condition: 'stock_below_min', conditionValue: 1, action: 'send_notification', isEnabled: true, createdAt: '2026-01-01', updatedAt: '2026-06-01' },
  { id: '2', name: '断货紧急提醒', type: 'restock', condition: 'stock_zero', conditionValue: 0, action: 'send_notification_and_email', isEnabled: true, createdAt: '2026-01-01', updatedAt: '2026-06-01' },
  { id: '3', name: '服务后评价提醒', type: 'evaluation', condition: 'hours_after_completion', conditionValue: 3, action: 'send_sms', isEnabled: true, createdAt: '2026-02-01', updatedAt: '2026-06-01' },
  { id: '4', name: '预约未到提醒', type: 'appointment', condition: 'minutes_after_appointment', conditionValue: 30, action: 'send_notification', isEnabled: true, createdAt: '2026-03-01', updatedAt: '2026-06-01' },
  { id: '5', name: '消耗异常预警', type: 'anomaly', condition: 'consumption_exceeds_ratio', conditionValue: 3, action: 'send_notification_and_email', isEnabled: true, createdAt: '2026-03-01', updatedAt: '2026-06-01' },
]

export const useRemindersStore = defineStore('reminders', () => {
  const reminders = ref<Reminder[]>([])
  const rules = ref<ReminderRule[]>([])
  const isLoading = ref(false)

  const unreadCount = computed(() => reminders.value.filter((r) => !r.isRead).length)

  const bySeverity = computed(() => ({
    high: reminders.value.filter((r) => r.severity === 'high'),
    medium: reminders.value.filter((r) => r.severity === 'medium'),
    low: reminders.value.filter((r) => r.severity === 'low'),
  }))

  async function fetchReminders() {
    isLoading.value = true
    try {
      const res = await api.get('/reminders')
      reminders.value = res.data
    } catch {
      reminders.value = mockReminders
    } finally {
      isLoading.value = false
    }
  }

  async function fetchRules() {
    isLoading.value = true
    try {
      const res = await api.get('/reminder-rules')
      rules.value = res.data
    } catch {
      rules.value = mockRules
    } finally {
      isLoading.value = false
    }
  }

  async function markAsRead(id: string) {
    try {
      await api.patch(`/reminders/${id}/read`)
    } catch {
      const r = reminders.value.find((r) => r.id === id)
      if (r) r.isRead = true
    }
  }

  async function markAllAsRead() {
    try {
      await api.post('/reminders/read-all')
    } catch {
      reminders.value.forEach((r) => (r.isRead = true))
    }
  }

  async function toggleRule(ruleId: string, isEnabled: boolean) {
    try {
      await api.patch(`/reminder-rules/${ruleId}`, { isEnabled })
    } catch {
      const rule = rules.value.find((r) => r.id === ruleId)
      if (rule) rule.isEnabled = isEnabled
    }
  }

  async function createRule(rule: Partial<ReminderRule>) {
    try {
      await api.post('/reminder-rules', rule)
    } catch {
      rules.value.push({
        id: `RULE-${Date.now()}`,
        name: rule.name || '',
        type: rule.type || 'evaluation',
        condition: rule.condition || '',
        conditionValue: rule.conditionValue || 0,
        action: rule.action || 'send_notification',
        isEnabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
  }

  return {
    reminders, rules, isLoading, unreadCount, bySeverity,
    fetchReminders, fetchRules, markAsRead, markAllAsRead, toggleRule, createRule,
  }
})
