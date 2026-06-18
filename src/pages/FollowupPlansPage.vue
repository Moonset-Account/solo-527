<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { List, CalendarDays, CheckCircle2, AlertCircle, Clock } from 'lucide-vue-next'
import { useFollowupsStore } from '@/stores/followups'
import DataTable from '@/components/common/DataTable.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const followupsStore = useFollowupsStore()

const activeTab = ref<'list' | 'calendar'>('list')
const showResultModal = ref(false)
const selectedFollowup = ref<any>(null)
const resultText = ref('')
const nextFollowupDate = ref('')

const listColumns = [
  { key: 'scheduledDate', label: '计划日期', sortable: true },
  { key: 'leadName', label: '线索名称' },
  { key: 'type', label: '回访类型' },
  { key: 'assigneeName', label: '负责人' },
  { key: 'urgency', label: '紧急度' },
  { key: 'actions', label: '操作', width: '120px' },
]

const currentMonth = ref(new Date().toISOString().slice(0, 7))
const calendarDays = computed(() => {
  const [year, month] = currentMonth.value.split('-').map(Number)
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startPad = firstDay.getDay()
  const days: { date: string; day: number; events: any[]; isCurrentMonth: boolean }[] = []
  for (let i = 0; i < startPad; i++) {
    const d = new Date(year, month - 1, 1 - startPad + i)
    days.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), events: [], isCurrentMonth: false })
  }
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    const events = followupsStore.calendarEvents.filter((e) => e.date === dateStr)
    days.push({ date: dateStr, day: i, events, isCurrentMonth: true })
  }
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month, i)
    days.push({ date: d.toISOString().slice(0, 10), day: d.getDate(), events: [], isCurrentMonth: false })
  }
  return days
})

const urgencyMap: Record<string, { label: string; class: string }> = {
  overdue: { label: '已逾期', class: 'bg-red-100 text-red-700' },
  today: { label: '今日', class: 'bg-amber-100 text-amber-700' },
  upcoming: { label: '待处理', class: 'bg-blue-100 text-blue-700' },
}

const eventColorMap: Record<string, string> = {
  overdue: 'bg-red-500',
  today: 'bg-amber-500',
  upcoming: 'bg-blue-500',
}

function openResultModal(followup: any) {
  selectedFollowup.value = followup
  resultText.value = ''
  nextFollowupDate.value = ''
  showResultModal.value = true
}

async function submitResult() {
  if (!selectedFollowup.value) return
  await followupsStore.completeFollowup(
    selectedFollowup.value.id,
    resultText.value,
    nextFollowupDate.value || undefined,
  )
  showResultModal.value = false
  await followupsStore.fetchList()
}

function prevMonth() {
  const [y, m] = currentMonth.value.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  currentMonth.value = d.toISOString().slice(0, 7)
  followupsStore.fetchCalendar(currentMonth.value)
}

function nextMonth() {
  const [y, m] = currentMonth.value.split('-').map(Number)
  const d = new Date(y, m, 1)
  currentMonth.value = d.toISOString().slice(0, 7)
  followupsStore.fetchCalendar(currentMonth.value)
}

onMounted(() => {
  followupsStore.fetchList()
  followupsStore.fetchCalendar(currentMonth.value)
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-semibold text-slate-800">回访计划</h1>
      <div class="flex bg-slate-100 rounded-md p-0.5">
        <button
          class="px-3 py-1.5 text-sm rounded-md flex items-center gap-1 transition-colors"
          :class="activeTab === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'"
          @click="activeTab = 'list'"
        >
          <List class="w-4 h-4" /> 列表视图
        </button>
        <button
          class="px-3 py-1.5 text-sm rounded-md flex items-center gap-1 transition-colors"
          :class="activeTab === 'calendar' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'"
          @click="activeTab = 'calendar'"
        >
          <CalendarDays class="w-4 h-4" /> 日历视图
        </button>
      </div>
    </div>

    <template v-if="activeTab === 'list'">
      <DataTable
        :columns="listColumns"
        :data="(followupsStore.list as any)"
        :total="followupsStore.total"
        :page="followupsStore.page"
        :loading="followupsStore.loading"
        @page-change="(p: number) => { followupsStore.page = p; followupsStore.fetchList() }"
      >
        <template #urgency="{ row }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            :class="urgencyMap[(row as any).urgency]?.class"
          >
            {{ urgencyMap[(row as any).urgency]?.label }}
          </span>
        </template>
        <template #actions="{ row }">
          <button
            class="px-3 py-1 text-xs rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            @click="openResultModal(row)"
          >
            录入结果
          </button>
        </template>
      </DataTable>
    </template>

    <template v-else>
      <div class="bg-white rounded-lg border border-slate-200 p-4">
        <div class="flex items-center justify-between mb-4">
          <button class="px-3 py-1 text-sm rounded-md border border-slate-300 hover:bg-slate-50" @click="prevMonth">
            上一月
          </button>
          <span class="font-medium text-slate-800">{{ currentMonth }}</span>
          <button class="px-3 py-1 text-sm rounded-md border border-slate-300 hover:bg-slate-50" @click="nextMonth">
            下一月
          </button>
        </div>
        <div class="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
          <div
            v-for="day in ['日','一','二','三','四','五','六']"
            :key="day"
            class="bg-slate-50 px-2 py-2 text-center text-xs font-medium text-slate-500"
          >
            {{ day }}
          </div>
          <div
            v-for="(day, idx) in calendarDays"
            :key="idx"
            class="bg-white min-h-[80px] p-1"
            :class="{ 'bg-slate-50': !day.isCurrentMonth }"
          >
            <span
              class="text-xs"
              :class="day.isCurrentMonth ? 'text-slate-700' : 'text-slate-300'"
            >
              {{ day.day }}
            </span>
            <div class="mt-1 space-y-0.5">
              <div
                v-for="event in day.events.slice(0, 2)"
                :key="event.id"
                class="text-xs px-1 py-0.5 rounded truncate"
                :class="eventColorMap[event.urgency]"
                :style="{ color: 'white' }"
              >
                {{ event.leadName }}
              </div>
              <div
                v-if="day.events.length > 2"
                class="text-xs text-slate-400 pl-1"
              >
                +{{ day.events.length - 2 }}
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-4 mt-3 text-xs text-slate-500">
          <span class="flex items-center gap-1"><span class="w-2 h-2 bg-red-500 rounded-full"></span> 已逾期</span>
          <span class="flex items-center gap-1"><span class="w-2 h-2 bg-amber-500 rounded-full"></span> 今日</span>
          <span class="flex items-center gap-1"><span class="w-2 h-2 bg-blue-500 rounded-full"></span> 待处理</span>
        </div>
      </div>
    </template>

    <Teleport to="body">
      <div v-if="showResultModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/40" @click="showResultModal = false" />
        <div class="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
          <h3 class="text-lg font-medium text-slate-800 mb-4">录入回访结果</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">回访结果</label>
              <textarea
                v-model="resultText"
                rows="3"
                class="w-full px-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="请输入回访结果..."
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">下次回访日期</label>
              <input
                v-model="nextFollowupDate"
                type="date"
                class="w-full h-9 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div class="flex justify-end gap-3">
              <button
                class="px-4 py-2 text-sm rounded-md border border-slate-300 hover:bg-slate-50"
                @click="showResultModal = false"
              >
                取消
              </button>
              <button
                class="px-4 py-2 text-sm rounded-md bg-amber-500 text-white hover:bg-amber-600"
                @click="submitResult"
              >
                提交
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
