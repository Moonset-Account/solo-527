<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppointmentsStore } from '@/stores/appointments'
import AppointmentTable from '@/components/appointments/AppointmentTable.vue'

const appointmentsStore = useAppointmentsStore()

onMounted(async () => {
  if (appointmentsStore.appointments.length === 0) {
    await appointmentsStore.fetchAppointments()
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-gray-800">预约订单</h1>
      <span class="text-sm text-grayrose">共 {{ appointmentsStore.appointments.length }} 条预约</span>
    </div>
    <AppointmentTable />
  </div>
</template>
