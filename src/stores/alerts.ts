import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { fetchAlerts as apiFetchAlerts, acknowledgeAlert as apiAcknowledgeAlert } from '@/services/api'

export const useAlertStore = defineStore('alerts', () => {
  const alerts = ref<any[]>([])
  const showAckModal = ref(false)
  const activeAlertId = ref<string | null>(null)
  const loading = ref(false)

  const pendingAlerts = computed(() =>
    alerts.value.filter(a => a.status === 'pending').sort(
      (a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime()
    )
  )

  const acknowledgedAlerts = computed(() =>
    alerts.value.filter(a => a.status === 'acknowledged').sort(
      (a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime()
    )
  )

  const criticalAlerts = computed(() =>
    pendingAlerts.value.filter(a => a.severity === 'critical')
  )

  async function init() {
    loading.value = true
    try {
      alerts.value = await apiFetchAlerts()
    } finally {
      loading.value = false
    }
  }

  function openAckModal(alertId: string) {
    activeAlertId.value = alertId
    showAckModal.value = true
  }

  function closeAckModal() {
    showAckModal.value = false
    activeAlertId.value = null
  }

  async function acknowledgeAlert(payload: { alertId: string; judgment: string; note?: string }) {
    await apiAcknowledgeAlert(payload.alertId, payload.judgment as any, payload.note)
    closeAckModal()
    alerts.value = await apiFetchAlerts()
  }

  function getAlertById(id: string) {
    return alerts.value.find(a => a.id === id)
  }

  function getAlertsForPond(pondId: string) {
    return alerts.value.filter(a => a.pond_id === pondId)
  }

  function getAlertsForReading(readingId: string) {
    return alerts.value.filter(a => a.type === 'threshold')
  }

  return {
    alerts,
    showAckModal,
    activeAlertId,
    loading,
    pendingAlerts,
    acknowledgedAlerts,
    criticalAlerts,
    init,
    openAckModal,
    closeAckModal,
    acknowledgeAlert,
    getAlertById,
    getAlertsForPond,
    getAlertsForReading,
  }
})
