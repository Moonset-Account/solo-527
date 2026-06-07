<script setup lang="ts">
import { ref, computed } from 'vue'
import { getMockReadings, mockProcessingNotes, mockAlerts } from '@/mock/data'
import { POND_NAMES, METRIC_LABELS, JUDGMENT_LABELS, type SensorReading, type ProcessingNote, type Alert, type MetricType } from '@/types'
import { X, Plus, AlertTriangle, FileText } from 'lucide-vue-next'

const props = defineProps<{
  readingId: string | null
}>()

const emit = defineEmits<{
  close: []
}>()

const newNote = ref('')
const localNotes = ref<ProcessingNote[]>([])

const foundReading = computed<SensorReading | null>(() => {
  if (!props.readingId) return null
  const ponds = ['pond-1', 'pond-2', 'pond-3', 'pond-4']
  const metrics: MetricType[] = ['dissolved_oxygen', 'temperature', 'ph']
  for (const pondId of ponds) {
    for (const metric of metrics) {
      const readings = getMockReadings(pondId, metric)
      const found = readings.find(r => r.id === props.readingId)
      if (found) return found
    }
  }
  return null
})

const associatedNotes = computed(() => {
  if (!props.readingId) return []
  return mockProcessingNotes.filter(n =>
    n.readingId === props.readingId ||
    (foundReading.value && n.alertId && mockAlerts.some(a => a.id === n.alertId && a.pondId === foundReading.value!.pondId))
  )
})

const associatedAlerts = computed<Alert[]>(() => {
  if (!foundReading.value) return []
  return mockAlerts.filter(a =>
    a.pondId === foundReading.value.pondId &&
    a.metric === foundReading.value.metric
  )
})

function formatTime(iso: string) {
  const d = new Date(iso)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${m}-${day} ${h}:${min}`
}

function addNote() {
  if (!newNote.value.trim() || !props.readingId) return
  localNotes.value.push({
    id: `local-note-${Date.now()}`,
    alertId: null,
    readingId: props.readingId,
    note: newNote.value.trim(),
    createdBy: '当前用户',
    createdAt: new Date().toISOString(),
  })
  newNote.value = ''
}
</script>

<template>
  <transition name="slide">
    <div
      v-if="readingId !== null"
      class="fixed top-0 right-0 h-full w-[400px] bg-[#0A2E36] border-l border-[#0D3B47] z-40 flex flex-col shadow-2xl"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-[#0D3B47] shrink-0">
        <div class="flex items-center gap-2">
          <FileText class="w-4 h-4 text-[#00B4D8]" />
          <h3 class="text-sm font-medium text-gray-200">采样详情</h3>
        </div>
        <button
          class="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <template v-if="foundReading">
          <div class="bg-[#0D3B47] rounded-lg p-3">
            <h4 class="text-xs text-gray-500 mb-2">原始采样值</h4>
            <div class="space-y-1.5 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-gray-500">时间戳</span>
                <span class="text-gray-300">{{ formatTime(foundReading.timestamp) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">数值</span>
                <span class="text-gray-300">{{ foundReading.value }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">传感器</span>
                <span class="text-gray-300">{{ foundReading.sensorId }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">数据质量</span>
                <span
                  class="px-1.5 py-0.5 rounded text-[10px] font-medium"
                  :class="{
                    'bg-emerald-500/20 text-emerald-400': foundReading.quality === 'good',
                    'bg-[#F59E0B]/20 text-[#F59E0B]': foundReading.quality === 'suspect',
                    'bg-[#EF4444]/20 text-[#EF4444]': foundReading.quality === 'offline',
                  }"
                >
                  {{ foundReading.quality === 'good' ? '正常' : foundReading.quality === 'suspect' ? '可疑' : '离线' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-gray-500">是否异常</span>
                <span :class="foundReading.isAnomaly ? 'text-[#EF4444]' : 'text-emerald-400'">
                  {{ foundReading.isAnomaly ? '是' : '否' }}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-xs text-gray-500 mb-2">处理记录</h4>
            <div v-if="associatedNotes.length === 0 && localNotes.length === 0" class="text-xs text-gray-600 py-2">
              暂无处理记录
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="note in [...associatedNotes, ...localNotes]"
                :key="note.id"
                class="bg-[#0D3B47] rounded-lg p-2.5"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[10px] text-[#00B4D8]">{{ note.createdBy }}</span>
                  <span class="text-[10px] text-gray-600">{{ formatTime(note.createdAt) }}</span>
                </div>
                <p class="text-xs text-gray-300">{{ note.note }}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-xs text-gray-500 mb-2">关联警报</h4>
            <div v-if="associatedAlerts.length === 0" class="text-xs text-gray-600 py-2">
              暂无关联警报
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="alert in associatedAlerts"
                :key="alert.id"
                class="bg-[#0D3B47] rounded-lg p-2.5"
              >
                <div class="flex items-center gap-2 mb-1">
                  <AlertTriangle class="w-3 h-3" :class="alert.severity === 'critical' ? 'text-[#EF4444]' : 'text-[#F59E0B]'" />
                  <span class="text-xs text-gray-300">{{ POND_NAMES[alert.pondId] }}</span>
                  <span class="text-[10px] text-gray-500">{{ METRIC_LABELS[alert.metric as keyof typeof METRIC_LABELS] }}</span>
                </div>
                <div v-if="alert.humanJudgment" class="flex items-center gap-2 mt-1">
                  <span
                    class="px-1 py-0.5 rounded text-[10px] font-medium"
                    :class="{
                      'bg-[#00B4D8]/10 text-[#00B4D8]': alert.humanJudgment === 'false_alarm',
                      'bg-[#EF4444]/10 text-[#EF4444]': alert.humanJudgment === 'real_anomaly',
                      'bg-[#F59E0B]/10 text-[#F59E0B]': alert.humanJudgment === 'needs_onsite',
                    }"
                  >
                    {{ JUDGMENT_LABELS[alert.humanJudgment] }}
                  </span>
                  <span v-if="alert.judgmentNote" class="text-[10px] text-gray-400">{{ alert.judgmentNote }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="py-10 text-center">
          <p class="text-gray-600 text-sm">未找到采样记录</p>
        </div>
      </div>

      <div class="border-t border-[#0D3B47] p-4 shrink-0">
        <textarea
          v-model="newNote"
          rows="2"
          class="w-full bg-[#0D3B47] border border-[#0D3B47] rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#00B4D8]/50 resize-none mb-2"
          placeholder="添加备注..."
        />
        <button
          class="flex items-center justify-center gap-1 w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors"
          :class="newNote.trim()
            ? 'bg-[#00B4D8] text-white hover:bg-[#00B4D8]/80'
            : 'bg-[#0D3B47] text-gray-600 cursor-not-allowed'"
          :disabled="!newNote.trim()"
          @click="addNote"
        >
          <Plus class="w-3 h-3" />
          添加备注
        </button>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
