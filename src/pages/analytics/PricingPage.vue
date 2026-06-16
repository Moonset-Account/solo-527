<script setup lang="ts">
import { onMounted } from 'vue'
import { useAnalyticsStore } from '@/stores/analytics'
import PriceAnalysisChart from '@/components/analytics/PriceAnalysisChart.vue'

const analyticsStore = useAnalyticsStore()

onMounted(async () => {
  if (analyticsStore.priceAnalysis.length === 0) {
    await analyticsStore.fetchPriceAnalysis()
  }
})
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-semibold text-gray-800">项目价格分析</h1>
    <PriceAnalysisChart />
  </div>
</template>
