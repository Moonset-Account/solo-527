<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAlertStore } from '@/stores/alerts'
import { POND_NAMES, METRIC_LABELS } from '@/types'
import { AlertTriangle, X, ChevronRight } from 'lucide-vue-next'

const alertStore = useAlertStore()
const isDismissed = ref(false)

const pendingAlerts = computed(() => alertStore.pendingAlerts)

const visibleAlerts = computed(() => {
  if (isDismissed.value) return []
  return pendingAlerts.value
})

function formatTime(iso: string) {
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function dismiss() {
  isDismissed.value = true
}

function handleClick(alertId: string) {
  alertStore.openAckModal(alertId)
}
</script>

<template>
  <div
    v-if="visibleAlerts.length > 0"
    class="bg-[#0A2E36]/80 border-b border-[#0D3B47] px-4 py-2 shrink-0"
  >
    <div class="flex items-center gap-2">
      <AlertTriangle class="w-4 h-4 text-[#F59E0B] shrink-0" />
      <span class="text-xs text-[#F59E0B] font-medium shrink-0">
        {{ visibleAlerts.length }}条待处理警报
      </span>

      <div class="flex-1 overflow-x-auto scrollbar-thin">
        <div class="flex items-center gap-2">
          <button
            v-for="alert in visibleAlerts"
            :key="alert.id"
            class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors shrink-0"
            :class="[
              alert.severity === 'critical'
                ? 'bg-[#EF4444]/15 text-[#EF4444] hover:bg-[#EF4444]/25 border border-[#EF4444]/30'
                : 'bg-[#F59E0B]/15 text-[#F59E0B] hover:bg-[#F59E0B]/25 border border-[#F59E0B]/30',
            ]"
            @click="handleClick(alert.id)"
          >
            <span class="font-medium">{{ POND_NAMES[alert.pondId] || alert.pondId }}</span>
            <span>{{ METRIC_LABELS[alert.metric as keyof typeof METRIC_LABELS] || alert.metric }}</span>
            <span v-if="alert.type === 'threshold'">{{ alert.value }}</span>
            <span v-else>离线</span>
            <span class="text-[10px] opacity-70">{{ formatTime(alert.triggeredAt) }}</span>
            <ChevronRight class="w-3 h-3 opacity-50" />
          </button>
        </div>
      </div>

      <button
        class="shrink-0 p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
        @click="dismiss"
      >
        <X class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
