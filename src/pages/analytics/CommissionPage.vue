<script setup lang="ts">
import { onMounted } from 'vue'
import { useAnalyticsStore } from '@/stores/analytics'
import CommissionTable from '@/components/analytics/CommissionTable.vue'

const analyticsStore = useAnalyticsStore()

onMounted(async () => {
  if (analyticsStore.commissions.length === 0) {
    await analyticsStore.fetchCommissions()
  }
})
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-semibold text-gray-800">顾问提成</h1>
    <CommissionTable />
  </div>
</template>
