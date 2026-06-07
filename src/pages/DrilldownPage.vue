<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchDrilldownData, createNote } from '@/services/api'
import { POND_NAMES, METRIC_LABELS, JUDGMENT_LABELS } from '@/types'
import { ArrowLeft, Plus, AlertTriangle } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const pointId = route.params.pointId as string

const reading = ref<any>(null)
const notes = ref<any[]>([])
const alerts = ref<any[]>([])

onMounted(async () => {
  const data = await fetchDrilldownData(pointId)
  reading.value = data.reading
  notes.value = data.notes
  alerts.value = data.alerts
})

const newNote = ref('')

function formatTime(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

async function addNote() {
  if (!newNote.value.trim()) return
  const created = await createNote({
    readingId: pointId,
    note: newNote.value.trim(),
    createdBy: '当前用户',
  })
  notes.value.push(created)
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

    <div v-if="!reading" class="flex-1 flex items-center justify-center">
      <p class="text-gray-500">未找到对应的采样记录</p>
    </div>

    <template v-else>
      <div class="bg-[#0A2E36] rounded-xl border border-[#0D3B47] p-4 mb-6">
        <h3 class="text-sm font-medium text-gray-200 mb-3">原始采样记录</h3>
        <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div class="flex items-center gap-2">
            <span class="text-gray-500">传感器ID:</span>
            <span class="text-gray-300">{{ reading.sensor_id }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">时间戳:</span>
            <span class="text-gray-300">{{ formatTime(reading.ts) }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">数值:</span>
            <span class="text-gray-300">{{ reading.value }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">数据质量:</span>
            <span
              class="px-1.5 py-0.5 rounded text-[10px] font-medium"
              :class="{
                'bg-emerald-500/20 text-emerald-400': reading.quality === 'good',
                'bg-[#F59E0B]/20 text-[#F59E0B]': reading.quality === 'suspect',
                'bg-[#EF4444]/20 text-[#EF4444]': reading.quality === 'offline',
              }"
            >
              {{ reading.quality === 'good' ? '正常' : reading.quality === 'suspect' ? '可疑' : '离线' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">是否异常:</span>
            <span :class="reading.is_anomaly ? 'text-[#EF4444]' : 'text-emerald-400'">
              {{ reading.is_anomaly ? '是' : '否' }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">塘口:</span>
            <span class="text-gray-300">{{ POND_NAMES[reading.pond_id] }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">指标:</span>
            <span class="text-gray-300">{{ METRIC_LABELS[reading.metric as keyof typeof METRIC_LABELS] }}</span>
          </div>
        </div>
      </div>

      <div class="bg-[#0A2E36] rounded-xl border border-[#0D3B47] p-4 mb-6">
        <h3 class="text-sm font-medium text-gray-200 mb-3">处理记录</h3>
        <div v-if="notes.length === 0" class="py-4 text-center">
          <p class="text-gray-600 text-sm">暂无处理记录</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="note in notes"
            :key="note.id"
            class="bg-[#0D3B47] rounded-lg p-3"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-[#00B4D8]">{{ note.created_by }}</span>
              <span class="text-xs text-gray-600">{{ formatTime(note.created_at) }}</span>
            </div>
            <p class="text-sm text-gray-300">{{ note.note }}</p>
          </div>
        </div>
      </div>

      <div class="bg-[#0A2E36] rounded-xl border border-[#0D3B47] p-4 mb-6">
        <h3 class="text-sm font-medium text-gray-200 mb-3">关联警报</h3>
        <div v-if="alerts.length === 0" class="py-4 text-center">
          <p class="text-gray-600 text-sm">暂无关联警报</p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="alert in alerts"
            :key="alert.id"
            class="bg-[#0D3B47] rounded-lg p-3"
          >
            <div class="flex items-center gap-2 mb-1">
              <AlertTriangle class="w-4 h-4" :class="alert.severity === 'critical' ? 'text-[#EF4444]' : 'text-[#F59E0B]'" />
              <span class="text-xs text-gray-300">{{ POND_NAMES[alert.pond_id] }}</span>
              <span class="text-xs text-gray-500">{{ METRIC_LABELS[alert.metric as keyof typeof METRIC_LABELS] }}</span>
              <span
                class="ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium"
                :class="alert.severity === 'critical' ? 'bg-[#EF4444]/20 text-[#EF4444]' : 'bg-[#F59E0B]/20 text-[#F59E0B]'"
              >
                {{ alert.severity === 'critical' ? '严重' : '警告' }}
              </span>
            </div>
            <div v-if="alert.human_judgment" class="flex items-center gap-2 mt-2">
              <span class="text-xs text-gray-500">人工判定:</span>
              <span
                class="px-1.5 py-0.5 rounded text-[10px] font-medium"
                :class="{
                  'bg-[#00B4D8]/10 text-[#00B4D8]': alert.human_judgment === 'false_alarm',
                  'bg-[#EF4444]/10 text-[#EF4444]': alert.human_judgment === 'real_anomaly',
                  'bg-[#F59E0B]/10 text-[#F59E0B]': alert.human_judgment === 'needs_onsite',
                }"
              >
                {{ JUDGMENT_LABELS[alert.human_judgment] }}
              </span>
              <span v-if="alert.judgment_note" class="text-xs text-gray-400">{{ alert.judgment_note }}</span>
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
