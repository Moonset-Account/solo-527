<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMockReadings, mockProcessingNotes, mockAlerts } from '@/mock/data'
import { POND_NAMES, METRIC_LABELS, JUDGMENT_LABELS, type MetricType, type ProcessingNote } from '@/types'
import { ArrowLeft, Plus, AlertTriangle } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const pointId = route.params.pointId as string

const foundReading = computed(() => {
  const ponds = ['pond-1', 'pond-2', 'pond-3', 'pond-4']
  const metrics: MetricType[] = ['dissolved_oxygen', 'temperature', 'ph']
  for (const pondId of ponds) {
    for (const metric of metrics) {
      const readings = getMockReadings(pondId, metric)
      const found = readings.find(r => r.id === pointId)
      if (found) return found
    }
  }
  const stateReading = (window.history.state?.reading) as any
  if (stateReading) return stateReading
  return null
})

const associatedNotes = computed(() =>
  mockProcessingNotes.filter(n => n.readingId === pointId || (foundReading.value && n.alertId && mockAlerts.some(a => a.id === n.alertId)))
)

const associatedAlerts = computed(() => {
  if (!foundReading.value) return []
  return mockAlerts.filter(a => a.pondId === foundReading.value.pondId && a.metric === foundReading.value.metric)
})

const newNote = ref('')
const localNotes = ref<ProcessingNote[]>([])

function formatTime(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

function addNote() {
  if (!newNote.value.trim()) return
  localNotes.value.push({
    id: `local-note-${Date.now()}`,
    alertId: null,
    readingId: pointId,
    note: newNote.value.trim(),
    createdBy: '当前用户',
    createdAt: new Date().toISOString(),
  })
  newNote.value = ''
}

function goBack() {
  router.push({ name: 'dashboard' })
}
</script>

<template>
  <div class="h-full flex flex-col p-6 overflow-y-auto">
    <div class="flex items-center gap-3 mb-6">
      <button
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-[#0A2E36] transition-colors"
        @click="goBack"
      >
        <ArrowLeft class="w-4 h-4" />
        返回看板
      </button>
      <h1 class="text-lg font-medium text-gray-200">异常钻取详情</h1>
    </div>

    <div v-if="!foundReading" class="flex-1 flex items-center justify-center">
      <p class="text-gray-500">未找到对应的采样记录</p>
    </div>

    <template v-else>
      <div class="bg-[#0A2E36] rounded-xl border border-[#0D3B47] p-4 mb-6">
        <h3 class="text-sm font-medium text-gray-200 mb-3">原始采样记录</h3>
        <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-gray-500">传感器ID:</span>
            <span class="text-gray-300">{{ foundReading.sensorId }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">时间戳:</span>
            <span class="text-gray-300">{{ formatTime(foundReading.timestamp) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">数值:</span>
            <span class="text-gray-300">{{ foundReading.value }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">数据质量:</span>
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
          <div class="flex items-center gap-2">
            <span class="text-gray-500">是否异常:</span>
            <span :class="foundReading.isAnomaly ? 'text-[#EF4444]' : 'text-emerald-400'">
              {{ foundReading.isAnomaly ? '是' : '否' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">塘口:</span>
            <span class="text-gray-300">{{ POND_NAMES[foundReading.pondId] }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">指标:</span>
            <span class="text-gray-300">{{ METRIC_LABELS[foundReading.metric as keyof typeof METRIC_LABELS] }}</span>
          </div>
        </div>
      </div>

      <div class="bg-[#0A2E36] rounded-xl border border-[#0D3B47] p-4 mb-6">
        <h3 class="text-sm font-medium text-gray-200 mb-3">处理记录</h3>
        <div v-if="associatedNotes.length === 0 && localNotes.length === 0" class="py-4 text-center">
          <p class="text-gray-600 text-sm">暂无处理记录</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="note in [...associatedNotes, ...localNotes]"
            :key="note.id"
            class="bg-[#0D3B47] rounded-lg p-3"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-[#00B4D8]">{{ note.createdBy }}</span>
              <span class="text-xs text-gray-600">{{ formatTime(note.createdAt) }}</span>
            </div>
            <p class="text-sm text-gray-300">{{ note.note }}</p>
          </div>
        </div>
      </div>

      <div class="bg-[#0A2E36] rounded-xl border border-[#0D3B47] p-4 mb-6">
        <h3 class="text-sm font-medium text-gray-200 mb-3">关联警报</h3>
        <div v-if="associatedAlerts.length === 0" class="py-4 text-center">
          <p class="text-gray-600 text-sm">暂无关联警报</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="alert in associatedAlerts"
            :key="alert.id"
            class="bg-[#0D3B47] rounded-lg p-3"
          >
            <div class="flex items-center gap-2 mb-1">
              <AlertTriangle class="w-4 h-4" :class="alert.severity === 'critical' ? 'text-[#EF4444]' : 'text-[#F59E0B]'" />
              <span class="text-xs text-gray-300">{{ POND_NAMES[alert.pondId] }}</span>
              <span class="text-xs text-gray-500">{{ METRIC_LABELS[alert.metric as keyof typeof METRIC_LABELS] }}</span>
              <span
                class="ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium"
                :class="alert.severity === 'critical' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'"
              >
                {{ alert.severity === 'critical' ? '严重' : '警告' }}
              </span>
            </div>
            <div v-if="alert.humanJudgment" class="flex items-center gap-2 mt-2">
              <span class="text-xs text-gray-500">人工判定:</span>
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
              <span v-if="alert.judgmentNote" class="text-xs text-gray-400">{{ alert.judgmentNote }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-[#0A2E36] rounded-xl border border-[#0D3B47] p-4">
        <h3 class="text-sm font-medium text-gray-200 mb-3">添加备注</h3>
        <textarea
          v-model="newNote"
          rows="3"
          class="w-full bg-[#0D3B47] border border-[#0D3B47] rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-[#00B4D8]/50 resize-none mb-3"
          placeholder="请输入备注信息..."
        />
        <button
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="newNote.trim()
            ? 'bg-[#00B4D8] text-white hover:bg-[#00B4D8]/80'
            : 'bg-[#0D3B47] text-gray-600 cursor-not-allowed'"
          :disabled="!newNote.trim()"
          @click="addNote"
        >
          <Plus class="w-4 h-4" />
          提交备注
        </button>
      </div>
    </template>
  </div>
</template>
