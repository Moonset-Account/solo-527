<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-bark">排产日历</h2>
      <div class="flex items-center gap-3">
        <button
          class="flex items-center gap-1 rounded-btn border border-brand/20 px-3 py-1.5 text-sm text-bark/70 transition-colors hover:bg-brand/5"
          @click="prevWeek"
        >
          <ChevronLeft :size="16" />
          上一周
        </button>
        <span class="text-sm font-medium text-bark">{{ weekRangeLabel }}</span>
        <button
          class="flex items-center gap-1 rounded-btn border border-brand/20 px-3 py-1.5 text-sm text-bark/70 transition-colors hover:bg-brand/5"
          @click="nextWeek"
        >
          下一周
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <div class="card overflow-x-auto">
      <div class="grid min-w-[900px] grid-cols-7 gap-px rounded-btn bg-brand/10">
        <div
          v-for="(day, i) in weekDays"
          :key="i"
          class="min-h-[200px] bg-white p-2"
        >
          <div
            class="mb-2 text-center text-xs font-medium"
            :class="day.isToday ? 'text-accent' : 'text-bark/60'"
          >
            {{ day.label }}
            <div :class="day.isToday ? 'text-accent' : 'text-bark/40'">{{ day.date }}</div>
          </div>
          <div class="space-y-1.5">
            <div
              v-for="s in day.schedules"
              :key="s._id"
              :style="{ backgroundColor: getTeamColor(s.teamId) + '15', borderLeftColor: getTeamColor(s.teamId) }"
              class="cursor-pointer rounded-sm border-l-3 p-2 text-xs transition-shadow hover:shadow-md"
              @click="openDetail(s)"
            >
              <div class="font-medium text-bark">{{ s.teamName }}</div>
              <div
                v-for="b in s.batches"
                :key="b.batchId"
                class="mt-1 text-bark/60"
              >
                {{ b.recipeName }} {{ b.plannedQty }}{{ b.unit }}
              </div>
              <span
                class="mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                :class="statusClass(s.status)"
              >
                {{ statusLabel(s.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Modal :visible="detailVisible" title="排产详情" @close="detailVisible = false">
      <div v-if="selectedSchedule" class="space-y-4 text-sm">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-bark/50">日期</div>
            <div class="font-medium text-bark">{{ selectedSchedule.date }}</div>
          </div>
          <div class="text-right">
            <div class="text-bark/50">班组</div>
            <div class="font-medium text-bark">{{ selectedSchedule.teamName }}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-bark/50">状态：</span>
          <span
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            :class="statusClass(selectedSchedule.status)"
          >
            {{ statusLabel(selectedSchedule.status) }}
          </span>
        </div>
        <div>
          <div class="mb-2 text-bark/50">批次明细</div>
          <table class="w-full text-xs">
            <thead>
              <tr class="border-b border-brand/10 text-left text-bark/50">
                <th class="pb-1.5 pr-2 font-medium">批次号</th>
                <th class="pb-1.5 pr-2 font-medium">配方</th>
                <th class="pb-1.5 font-medium text-right">计划量</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="b in selectedSchedule.batches"
                :key="b.batchId"
                class="border-b border-brand/5"
              >
                <td class="py-1.5 pr-2 text-bark">{{ b.batchNo }}</td>
                <td class="py-1.5 pr-2 text-bark/70">{{ b.recipeName }}</td>
                <td class="py-1.5 text-right text-bark/70">{{ b.plannedQty }} {{ b.unit }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import Modal from '@/components/common/Modal.vue'
import { useScheduleStore } from '@/stores/schedule'
import type { Schedule } from '@/api/schedule'

const palette = ['#8B5E3C', '#D4842A', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722']

const scheduleStore = useScheduleStore()

const detailVisible = ref(false)
const selectedSchedule = ref<Schedule | null>(null)
const weekOffset = ref(0)

const getMonday = (offset: number) => {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - diff + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

const formatDateStr = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const weekDays = computed(() => {
  const monday = getMonday(weekOffset.value)
  const todayStr = formatDateStr(new Date())
  const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = formatDateStr(d)
    return {
      label: labels[i],
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      dateStr,
      isToday: dateStr === todayStr,
      schedules: scheduleStore.list.filter((s) => s.date === dateStr),
    }
  })
})

const weekRangeLabel = computed(() => {
  const monday = getMonday(weekOffset.value)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`
  return `${fmt(monday)} - ${fmt(sunday)}`
})

const getTeamColor = (teamId: string) => {
  let hash = 0
  for (let i = 0; i < teamId.length; i++) {
    hash = teamId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return palette[Math.abs(hash) % palette.length]
}

const statusClass = (status: string) => {
  switch (status) {
    case 'planned': return 'bg-blue-50 text-blue-700'
    case 'in_progress': return 'bg-orange-50 text-orange-600'
    case 'completed': return 'bg-green-50 text-green-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const statusLabel = (status: string) => {
  switch (status) {
    case 'planned': return '已排产'
    case 'in_progress': return '进行中'
    case 'completed': return '已完成'
    default: return status
  }
}

const prevWeek = () => {
  weekOffset.value--
}

const nextWeek = () => {
  weekOffset.value++
}

const openDetail = (s: Schedule) => {
  selectedSchedule.value = s
  detailVisible.value = true
}

onMounted(() => {
  scheduleStore.loadList()
})
</script>
