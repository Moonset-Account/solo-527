<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAlertStore } from '@/stores/alerts'
import { POND_NAMES, METRIC_LABELS, type HumanJudgment, JUDGMENT_LABELS } from '@/types'
import { X, AlertTriangle, WifiOff, ClipboardCheck } from 'lucide-vue-next'

const alertStore = useAlertStore()

const selectedJudgment = ref<HumanJudgment | null>(null)
const note = ref('')

const activeAlert = computed(() => {
  if (!alertStore.activeAlertId) return null
  return alertStore.getAlertById(alertStore.activeAlertId)
})

const canSubmit = computed(() => selectedJudgment.value !== null)

watch(() => alertStore.showAckModal, (val) => {
  if (val) {
    selectedJudgment.value = null
    note.value = ''
  }
})

function handleClose() {
  alertStore.closeAckModal()
}

function handleSubmit() {
  if (!canSubmit.value || !activeAlert.value) return
  alertStore.acknowledgeAlert({
    alertId: activeAlert.value.id,
    judgment: selectedJudgment.value!,
    note: note.value || undefined,
  })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

const judgmentOptions: { value: HumanJudgment; color: string }[] = [
  { value: 'false_alarm', color: 'border-[#00B4D8] text-[#00B4D8] bg-[#00B4D8]/10' },
  { value: 'real_anomaly', color: 'border-[#EF4444] text-[#EF4444] bg-[#EF4444]/10' },
  { value: 'needs_onsite', color: 'border-[#F59E0B] text-[#F59E0B] bg-[#F59E0B]/10' },
]
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div
        v-if="alertStore.showAckModal && activeAlert"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="handleClose"
        />

        <div class="relative bg-[#0A2E36] rounded-xl border border-[#0D3B47] w-full max-w-lg mx-4 shadow-2xl">
          <div class="flex items-center justify-between px-5 py-4 border-b border-[#0D3B47]">
            <div class="flex items-center gap-2">
              <ClipboardCheck class="w-5 h-5 text-[#00B4D8]" />
              <h2 class="text-base font-medium text-gray-200">确认警报</h2>
            </div>
            <button
              class="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
              @click="handleClose"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="px-5 py-4 space-y-4">
            <div
              class="flex items-start gap-3 p-3 rounded-lg"
              :class="activeAlert.severity === 'critical' ? 'bg-[#EF4444]/10 border border-[#EF4444]/30' : 'bg-[#F59E0B]/10 border border-[#F59E0B]/30'"
            >
              <AlertTriangle
                v-if="activeAlert.severity === 'critical'"
                class="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5"
              />
              <WifiOff
                v-else-if="activeAlert.type === 'offline'"
                class="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5"
              />
              <AlertTriangle
                v-else
                class="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5"
              />
              <div class="text-sm space-y-1">
                <div class="flex items-center gap-2">
                  <span
                    class="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    :class="activeAlert.severity === 'critical' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'"
                  >
                    {{ activeAlert.severity === 'critical' ? '严重' : '警告' }}
                  </span>
                  <span class="text-gray-300">{{ POND_NAMES[activeAlert.pond_id] }}</span>
                </div>
                <div class="text-gray-400">
                  <span>{{ METRIC_LABELS[activeAlert.metric as keyof typeof METRIC_LABELS] }}</span>
                  <span v-if="activeAlert.type === 'threshold'" class="ml-2">
                    当前值 <span class="text-gray-200">{{ activeAlert.value }}</span> / 阈值 <span class="text-gray-200">{{ activeAlert.threshold_value }}</span>
                  </span>
                  <span v-else class="ml-2">传感器离线</span>
                </div>
                <div class="text-xs text-gray-500">
                  触发时间: {{ formatTime(activeAlert.triggered_at) }}
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs text-gray-400 mb-2">判定类型 <span class="text-[#EF4444]">*</span></label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="opt in judgmentOptions"
                  :key="opt.value"
                  class="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border text-xs font-medium transition-all"
                  :class="[
                    selectedJudgment === opt.value
                      ? opt.color
                      : 'border-[#0D3B47] text-gray-500 hover:border-gray-600 hover:text-gray-400',
                  ]"
                  @click="selectedJudgment = opt.value"
                >
                  {{ JUDGMENT_LABELS[opt.value] }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs text-gray-400 mb-2">备注（可选）</label>
              <textarea
                v-model="note"
                rows="3"
                class="w-full bg-[#0D3B47] border border-[#0D3B47] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#00B4D8]/50 resize-none"
                placeholder="请输入备注信息..."
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#0D3B47]">
            <button
              class="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-lg hover:bg-white/5 transition-colors"
              @click="handleClose"
            >
              取消
            </button>
            <button
              class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="canSubmit
                ? 'bg-[#00B4D8] text-white hover:bg-[#00B4D8]/80'
                : 'bg-[#0D3B47] text-gray-600 cursor-not-allowed'"
              :disabled="!canSubmit"
              @click="handleSubmit"
            >
              提交确认
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
