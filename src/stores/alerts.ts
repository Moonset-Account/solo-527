import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Alert, AcknowledgePayload, HumanJudgment } from '@/types'
import { mockAlerts } from '@/mock/data'

export const useAlertStore = defineStore('alerts', () => {
  const alerts = ref<Alert[]>([...mockAlerts])
  const showAckModal = ref(false)
  const activeAlertId = ref<string | null>(null)

  const pendingAlerts = computed(() =>
    alerts.value.filter(a => a.status === 'pending').sort(
      (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    )
  )

  const acknowledgedAlerts = computed(() =>
    alerts.value.filter(a => a.status === 'acknowledged').sort(
      (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    )
  )

  const criticalAlerts = computed(() =>
    pendingAlerts.value.filter(a => a.severity === 'critical')
  )

  function openAckModal(alertId: string) {
    activeAlertId.value = alertId
    showAckModal.value = true
  }

  function closeAckModal() {
    showAckModal.value = false
    activeAlertId.value = null
  }

  function acknowledgeAlert(payload: AcknowledgePayload) {
    const alert = alerts.value.find(a => a.id === payload.alertId)
    if (alert) {
      alert.status = 'acknowledged'
      alert.acknowledgedBy = '当前用户'
      alert.acknowledgedAt = new Date().toISOString()
      alert.humanJudgment = payload.judgment
      alert.judgmentNote = payload.note || null
    }
    closeAckModal()
  }

  function getAlertById(id: string): Alert | undefined {
    return alerts.value.find(a => a.id === id)
  }

  function getAlertsForPond(pondId: string): Alert[] {
    return alerts.value.filter(a => a.pondId === pondId)
  }

  function getAlertsForReading(readingId: string): Alert[] {
    return alerts.value.filter(a => a.type === 'threshold' && a.id.includes(readingId))
  }

  return {
    alerts,
    showAckModal,
    activeAlertId,
    pendingAlerts,
    acknowledgedAlerts,
    criticalAlerts,
    openAckModal,
    closeAckModal,
    acknowledgeAlert,
    getAlertById,
    getAlertsForPond,
    getAlertsForReading,
  }
})
