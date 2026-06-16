<script setup lang="ts">
import { onMounted } from 'vue'
import { Package, AlertTriangle, CalendarCheck, TrendingUp, Bell, AlertCircle } from 'lucide-vue-next'
import { useDashboardStore } from '@/stores/dashboard'
import { useProductsStore } from '@/stores/products'
import { useAppointmentsStore } from '@/stores/appointments'
import { useAnalyticsStore } from '@/stores/analytics'
import { useRemindersStore } from '@/stores/reminders'
import InventoryAlertCard from '@/components/dashboard/InventoryAlertCard.vue'
import AppointmentOverview from '@/components/dashboard/AppointmentOverview.vue'
import ConsumptionTrend from '@/components/dashboard/ConsumptionTrend.vue'
import AnomalyAlerts from '@/components/dashboard/AnomalyAlerts.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const dashboardStore = useDashboardStore()
const productsStore = useProductsStore()
const appointmentsStore = useAppointmentsStore()
const analyticsStore = useAnalyticsStore()
const remindersStore = useRemindersStore()

onMounted(async () => {
  await Promise.all([
    dashboardStore.fetchDashboard(),
    productsStore.fetchProducts(),
    appointmentsStore.fetchAppointments(),
    analyticsStore.fetchAnomalyConsumptions(),
    remindersStore.fetchReminders(),
  ])
})

const iconMap: Record<string, any> = {
  Package, AlertTriangle, CalendarCheck, TrendingUp, Bell, AlertCircle,
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div
        v-for="card in dashboardStore.summaryCards"
        :key="card.label"
        class="bg-white rounded-xl border border-rosegold/10 p-4 hover:border-rosegold/20 transition-colors"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-rosegold/5 flex items-center justify-center">
            <component :is="iconMap[card.icon]" :class="['w-5 h-5', card.color]" />
          </div>
          <div>
            <p class="text-xs text-grayrose">{{ card.label }}</p>
            <p :class="['text-lg font-semibold', card.color]">{{ card.value }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InventoryAlertCard />
      <AppointmentOverview />
    </div>

    <ConsumptionTrend />

    <AnomalyAlerts />
  </div>
</template>
