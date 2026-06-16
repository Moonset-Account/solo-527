<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, ArrowRight, User, Package, Calendar } from 'lucide-vue-next'
import { useAnalyticsStore } from '@/stores/analytics'

const analyticsStore = useAnalyticsStore()
</script>

<template>
  <div class="space-y-6">
    <div
      v-for="anomaly in analyticsStore.anomalyConsumptions"
      :key="anomaly.id"
      class="bg-white rounded-xl border border-coral/20 p-5"
    >
      <div class="flex items-center gap-2 mb-4">
        <AlertCircle class="w-5 h-5 text-coral" />
        <h4 class="text-sm font-medium text-gray-800">{{ anomaly.anomalyReason }}</h4>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <div class="flex items-center gap-1.5 px-3 py-2 bg-warmwhite rounded-lg">
          <Package class="w-4 h-4 text-rosegold" />
          <span class="text-sm text-gray-800">{{ anomaly.productName }}</span>
        </div>
        <ArrowRight class="w-4 h-4 text-grayrose/30" />
        <div class="flex items-center gap-1.5 px-3 py-2 bg-warmwhite rounded-lg">
          <User class="w-4 h-4 text-rosegold" />
          <span class="text-sm text-gray-800">{{ anomaly.consultantName }}</span>
        </div>
        <ArrowRight class="w-4 h-4 text-grayrose/30" />
        <div class="flex items-center gap-1.5 px-3 py-2 bg-warmwhite rounded-lg">
          <User class="w-4 h-4 text-rosegold" />
          <span class="text-sm text-gray-800">{{ anomaly.customerName }}</span>
        </div>
        <ArrowRight class="w-4 h-4 text-grayrose/30" />
        <div class="flex items-center gap-1.5 px-3 py-2 bg-coral/5 rounded-lg border border-coral/10">
          <Calendar class="w-4 h-4 text-coral" />
          <span class="text-sm text-coral font-medium">数量: {{ anomaly.quantity }} · 金额: ¥{{ anomaly.totalAmount }}</span>
        </div>
      </div>
      <p class="mt-3 text-xs text-grayrose/60">异常时间: {{ anomaly.consumedAt }} · 预约单号: {{ anomaly.appointmentId }}</p>
    </div>
    <div v-if="analyticsStore.anomalyConsumptions.length === 0" class="text-center py-12 text-sm text-grayrose/50">
      暂无异常记录
    </div>
  </div>
</template>
