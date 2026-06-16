<script setup lang="ts">
import { onMounted } from 'vue'
import { useAnalyticsStore } from '@/stores/analytics'
import AnomalyTrace from '@/components/analytics/AnomalyTrace.vue'

const analyticsStore = useAnalyticsStore()

onMounted(async () => {
  if (analyticsStore.anomalyConsumptions.length === 0) {
    await analyticsStore.fetchAnomalyConsumptions()
  }
})
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-semibold text-gray-800">异常追溯</h1>
    <AnomalyTrace />
  </div>
</template>
