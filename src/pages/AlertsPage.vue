<script setup lang="ts">
import { computed } from 'vue'
import AlertModal from '@/components/AlertModal.vue'
import { useAlertStore } from '@/stores/alerts'
import type { Alert } from '@/types'
import { JUDGMENT_LABELS, POND_NAMES, METRIC_LABELS } from '@/types'
import { AlertTriangle, WifiOff, Thermometer, CheckCircle } from 'lucide-vue-next'

const alertStore = useAlertStore()

const pendingAlerts = computed(() => alertStore.pendingAlerts)
const acknowledgedAlerts = computed(() => alertStore.acknowledgedAlerts)

function formatTimeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}小时前`
  return `${Math.floor(diffH / 24)}天前`
}

function handleAck(alertId: string) {
  alertStore.openAckModal(alertId)
}
</script>

<template>
  <div class="h-full flex gap-6 p-6 overflow-hidden">
    <div class="flex-1 overflow-y-auto pr-2">
      <h2 class="text-lg font-medium text-gray-200 mb-4">待处理警报</h2>

      <div v-if="pendingAlerts.length === 0" class="flex flex-col items-center justify-center py-20">
        <CheckCircle class="w-16 h-16 text-emerald-500/50 mb-4" />
        <p class="text-gray-500 text-sm">暂无待处理警报</p>
      </div>

      <div v-else class="relative pl-6 space-y-4">
        <div class="absolute left-[11px] top-2 bottom-2 w-px bg-[#0D3B47]" />

        <div
          v-for="alert in pendingAlerts"
          :key="alert.id"
          class="relative bg-[#0A2E36] rounded-xl border border-[#0D3B47] p-4"
        >
          <div class="absolute left-[-21px] top-5 w-3 h-3 rounded-full border-2"
            :class="alert.severity === 'critical' ? 'bg-[#EF4444] border-[#EF4444]/50' : 'bg-[#F59E0B] border-[#F59E0B]/50'"
          />

          <div class="flex items-start gap-3">
            <div
              class="p-2 rounded-lg shrink-0"
              :class="alert.type === 'threshold' ? 'bg-[#F59E0B]/10' : 'bg-[#EF4444]/10'"
            >
              <Thermometer v-if="alert.type === 'threshold'" class="w-5 h-5 text-[#F59E0B]" />
              <WifiOff v-else class="w-5 h-5 text-[#EF4444]" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  :class="alert.severity === 'critical'
                    ? 'bg-[#EF4444]/20 text-[#EF4444]'
                    : 'bg-[#F59E0B]/20 text-[#F59E0B]'"
                >
                  {{ alert.severity === 'critical' ? '严重' : '警告' }}
                </span>
                <span class="text-sm text-gray-300">{{ POND_NAMES[alert.pondId] }}</span>
                <span class="text-xs text-gray-500">{{ METRIC_LABELS[alert.metric as keyof typeof METRIC_LABELS] }}</span>
              </div>

              <div v-if="alert.type === 'threshold'" class="text-xs text-gray-400 mb-2">
                当前值 <span class="text-gray-200 font-medium">{{ alert.value }}</span>
                <span class="mx-1">/</span>
                阈值 <span class="text-gray-200 font-medium">{{ alert.threshold }}</span>
              </div>
              <div v-else class="text-xs text-gray-400 mb-2">传感器离线</div>

              <div class="flex items-center justify-between">
                <span class="text-xs text-gray-600">{{ formatTimeAgo(alert.triggeredAt) }}</span>
                <button
                  class="px-3 py-1 text-xs font-medium rounded-lg bg-[#00B4D8]/10 text-[#00B4D8] hover:bg-[#00B4D8]/20 transition-colors"
                  @click="handleAck(alert.id)"
                >
                  确认处理
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-96 border-l border-[#0D3B47] pl-6 overflow-y-auto">
      <h2 class="text-lg font-medium text-gray-200 mb-4">已确认警报</h2>

      <div v-if="acknowledgedAlerts.length === 0" class="py-10 text-center">
        <p class="text-gray-600 text-sm">暂无已确认警报</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="alert in acknowledgedAlerts"
          :key="alert.id"
          class="bg-[#0A2E36]/50 rounded-lg border border-[#0D3B47]/50 p-3 opacity-70"
        >
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs text-gray-500">{{ POND_NAMES[alert.pondId] }}</span>
            <span class="text-xs text-gray-600">·</span>
            <span class="text-xs text-gray-500">{{ METRIC_LABELS[alert.metric as keyof typeof METRIC_LABELS] }}</span>
          </div>
          <div v-if="alert.humanJudgment" class="flex items-center gap-2 mb-1">
            <span
              class="px-1.5 py-0.5 rounded text-[10px] font-medium"
              :class="{
                'bg-[#00B4D8]/10 text-[#00B4D8]': alert.humanJudgment === 'false_alarm',
                'bg-[#EF4444]/10 text-[#EF4444]': alert.humanJudgment === 'real_anomaly',
                'bg-[#F59E0B]/10 text-[#F59E0B]': alert.humanJudgment === 'needs_onsite',
              }"
            >
              {{ JUDGMENT_LABELS[alert.humanJudgment] }}
            </span>
          </div>
          <div v-if="alert.judgmentNote" class="text-xs text-gray-500 mt-1">
            {{ alert.judgmentNote }}
          </div>
          <div class="text-[10px] text-gray-600 mt-1">
            确认人: {{ alert.acknowledgedBy }} · {{ formatTimeAgo(alert.acknowledgedAt!) }}
          </div>
        </div>
      </div>
    </div>

    <AlertModal />
  </div>
</template>
