<script setup lang="ts">
import { onMounted } from 'vue'
import { useAnalyticsStore } from '@/stores/analytics'
import ConsumptionRanking from '@/components/analytics/ConsumptionRanking.vue'

const analyticsStore = useAnalyticsStore()

onMounted(async () => {
  if (analyticsStore.consumptionRanking.length === 0) {
    await analyticsStore.fetchConsumptionRanking()
  }
})
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-semibold text-gray-800">耗材排行</h1>
    <ConsumptionRanking />
  </div>
</template>
