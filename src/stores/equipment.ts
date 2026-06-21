import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEquipmentStore = defineStore('equipment', () => {
  const equipmentList = ref([
    { id: 1, name: '高效液相色谱仪', status: '运行中', utilization: 78, location: '实验室301', lastMaintenance: '2026-05-10', nextMaintenance: '2026-08-10' },
    { id: 2, name: '气相色谱仪', status: '运行中', utilization: 65, location: '实验室301', lastMaintenance: '2026-04-20', nextMaintenance: '2026-07-20' },
    { id: 3, name: '紫外分光光度计', status: '待维修', utilization: 0, location: '实验室302', lastMaintenance: '2026-03-15', nextMaintenance: '2026-06-15' },
    { id: 4, name: '电子天平', status: '运行中', utilization: 92, location: '实验室303', lastMaintenance: '2026-06-01', nextMaintenance: '2026-09-01' },
    { id: 5, name: '离心机', status: '空闲', utilization: 35, location: '实验室302', lastMaintenance: '2026-05-25', nextMaintenance: '2026-08-25' },
    { id: 6, name: 'pH计', status: '运行中', utilization: 48, location: '实验室303', lastMaintenance: '2026-04-05', nextMaintenance: '2026-07-05' },
  ])

  const alerts = ref([
    { id: 1, equipmentId: 3, message: '紫外分光光度计故障，需要维修', severity: 'danger', time: '2026-06-20 09:30', confirmed: false },
    { id: 2, equipmentId: 4, message: '电子天平维护提醒：下次维护日期为2026-09-01', severity: 'warn', time: '2026-06-19 14:00', confirmed: false },
    { id: 3, equipmentId: 6, message: 'pH计校准提醒：建议本周进行校准', severity: 'warn', time: '2026-06-18 10:00', confirmed: true },
  ])

  const monthlyUsage = ref([
    { month: '1月', hours: 320 },
    { month: '2月', hours: 280 },
    { month: '3月', hours: 410 },
    { month: '4月', hours: 380 },
    { month: '5月', hours: 450 },
    { month: '6月', hours: 360 },
  ])

  const showConfirmModal = ref(false)
  const confirmAlertId = ref<number | null>(null)

  function confirmAlert(id: number) {
    const alert = alerts.value.find(a => a.id === id)
    if (alert) alert.confirmed = true
    showConfirmModal.value = false
    confirmAlertId.value = null
  }

  function openConfirmModal(id: number) {
    confirmAlertId.value = id
    showConfirmModal.value = true
  }

  return { equipmentList, alerts, monthlyUsage, showConfirmModal, confirmAlertId, confirmAlert, openConfirmModal }
})
