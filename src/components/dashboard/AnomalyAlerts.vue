<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, ArrowRight } from 'lucide-vue-next'
import { useAnalyticsStore } from '@/stores/analytics'
import { useRouter } from 'vue-router'

const analyticsStore = useAnalyticsStore()
const router = useRouter()

const anomalies = computed(() => analyticsStore.anomalyConsumptions.slice(0, 5))
</script>

<template>
  <div class="bg-white rounded-xl border border-rosegold/10 p-5">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <AlertCircle class="w-5 h-5 text-coral" />
        <h3 class="text-sm font-medium text-gray-800">异常预警</h3>
      </div>
      <span v-if="anomalies.length" class="text-xs text-coral bg-coral/10 px-2 py-0.5 rounded-full">{{ anomalies.length }} 条</span>
    </div>
    <div v-if="anomalies.length === 0" class="text-center py-6 text-sm text-grayrose/50">
      暂无异常
    </div>
    <div v-else class="space-y-3">
      <div
        v-for="item in anomalies"
        :key="item.id"
        class="p-3 rounded-lg bg-coral/5 border border-coral/10"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-800">{{ item.productName }}</span>
          <span class="text-xs text-coral">{{ item.consumedAt }}</span>
        </div>
        <p class="text-xs text-grayrose mt-1">{{ item.anomalyReason }}</p>
        <div class="flex items-center gap-2 mt-2 text-xs text-grayrose/70">
          <span>顾问: {{ item.consultantName }}</span>
          <span>·</span>
          <span>数量: {{ item.quantity }}</span>
          <span>·</span>
          <span>金额: ¥{{ item.totalAmount }}</span>
        </div>
      </div>
    </div>
    <button
      v-if="anomalies.length > 0"
      class="w-full mt-4 flex items-center justify-center gap-1 text-sm text-coral hover:text-coral/80 transition-colors"
      @click="router.push('/analytics/anomaly')"
    >
      查看全部 <ArrowRight class="w-4 h-4" />
    </button>
  </div>
</template>
