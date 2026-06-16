import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Appointment } from '@/types'
import api from '@/api'

const mockAppointments: Appointment[] = [
  {
    id: 'APT-001', customerName: '王小姐', customerPhone: '138****1234', consultantName: '李顾问',
    appointmentDate: '2026-06-16', appointmentTime: '10:00', status: 'confirmed',
    items: [
      { id: '1', appointmentId: 'APT-001', serviceName: '法式美甲', productName: '甲油胶-裸粉', quantity: 1, unitPrice: 168, subtotal: 168 },
      { id: '2', appointmentId: 'APT-001', serviceName: '手部护理', productName: '护理精华', quantity: 1, unitPrice: 88, subtotal: 88 },
    ],
    totalAmount: 256, notes: '偏好淡色系', createdAt: '2026-06-14', updatedAt: '2026-06-14',
  },
  {
    id: 'APT-002', customerName: '张女士', customerPhone: '139****5678', consultantName: '王顾问',
    appointmentDate: '2026-06-16', appointmentTime: '14:00', status: 'in_progress',
    items: [
      { id: '3', appointmentId: 'APT-002', serviceName: '光疗延长', productName: '光疗胶-透明', quantity: 2, unitPrice: 298, subtotal: 596 },
    ],
    totalAmount: 596, notes: '', createdAt: '2026-06-15', updatedAt: '2026-06-16',
  },
  {
    id: 'APT-003', customerName: '刘女士', customerPhone: '137****9012', consultantName: '李顾问',
    appointmentDate: '2026-06-16', appointmentTime: '16:30', status: 'pending',
    items: [
      { id: '4', appointmentId: 'APT-003', serviceName: '卸甲+新做', productName: '卸甲水-温和型', quantity: 1, unitPrice: 58, subtotal: 58 },
      { id: '5', appointmentId: 'APT-003', serviceName: '渐变美甲', productName: '甲油胶-经典红', quantity: 1, unitPrice: 198, subtotal: 198 },
    ],
    totalAmount: 256, notes: '过敏体质，注意产品选择', createdAt: '2026-06-15', updatedAt: '2026-06-15',
  },
  {
    id: 'APT-004', customerName: '陈小姐', customerPhone: '136****3456', consultantName: '王顾问',
    appointmentDate: '2026-06-16', appointmentTime: '09:00', status: 'completed',
    items: [
      { id: '6', appointmentId: 'APT-004', serviceName: '简单修甲', productName: '底胶-防脱落', quantity: 1, unitPrice: 68, subtotal: 68 },
    ],
    totalAmount: 68, notes: '', createdAt: '2026-06-13', updatedAt: '2026-06-16',
  },
  {
    id: 'APT-005', customerName: '赵女士', customerPhone: '135****7890', consultantName: '李顾问',
    appointmentDate: '2026-06-16', appointmentTime: '11:00', status: 'no_show',
    items: [
      { id: '7', appointmentId: 'APT-005', serviceName: '日式美甲', productName: '亮片-金色碎片', quantity: 1, unitPrice: 328, subtotal: 328 },
    ],
    totalAmount: 328, notes: '', createdAt: '2026-06-14', updatedAt: '2026-06-16',
  },
]

export const useAppointmentsStore = defineStore('appointments', () => {
  const appointments = ref<Appointment[]>([])
  const isLoading = ref(false)
  const currentAppointment = ref<Appointment | null>(null)

  const todayAppointments = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return appointments.value.filter((a) => a.appointmentDate === today)
  })

  const todayStats = computed(() => {
    const today = todayAppointments.value
    const total = today.length
    const completed = today.filter((a) => a.status === 'completed').length
    const noShow = today.filter((a) => a.status === 'no_show').length
    const visitRate = total > 0 ? Math.round(((total - noShow) / total) * 100) : 0
    const revenue = today.filter((a) => a.status === 'completed').reduce((sum, a) => sum + a.totalAmount, 0)
    return { total, completed, noShow, visitRate, revenue }
  })

  async function fetchAppointments() {
    isLoading.value = true
    try {
      const res = await api.get('/appointments')
      appointments.value = res.data
    } catch {
      appointments.value = mockAppointments
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAppointment(id: string) {
    isLoading.value = true
    try {
      const res = await api.get(`/appointments/${id}`)
      currentAppointment.value = res.data
    } catch {
      currentAppointment.value = mockAppointments.find((a) => a.id === id) || null
    } finally {
      isLoading.value = false
    }
  }

  async function updateStatus(id: string, status: Appointment['status']) {
    try {
      await api.patch(`/appointments/${id}/status`, { status })
    } catch {
      const apt = appointments.value.find((a) => a.id === id)
      if (apt) apt.status = status
    }
  }

  return {
    appointments, isLoading, currentAppointment,
    todayAppointments, todayStats,
    fetchAppointments, fetchAppointment, updateStatus,
  }
})
