<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="s in stats" :key="s.label" class="card p-5">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-gray-500 text-sm">{{ s.label }}</div>
            <div class="text-2xl font-bold mt-1" :class="s.color">{{ s.value }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ s.sub }}</div>
          </div>
          <div class="text-3xl">{{ s.icon }}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold">今日预约概览</h3>
          <div class="flex gap-2 text-sm">
            <button class="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition" @click="changeDate(-1)">前一天</button>
            <input type="date" v-model="dateStr" class="input !w-auto !py-1 !px-2 text-sm" @change="loadData" />
            <button class="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition" @click="changeDate(1)">后一天</button>
          </div>
        </div>

        <div v-if="boardData" class="space-y-3">
          <div class="grid grid-cols-6 gap-2 text-xs text-gray-500 text-center mb-1">
            <div class="text-left pl-2">场地</div>
            <div v-for="t in boardData.timeSlots.slice(0, 5)" :key="t">{{ t }}</div>
          </div>
          <div v-for="court in boardData.courtBoard.slice(0, 6)" :key="court.court.id" class="border rounded-lg p-2 hover:shadow-md transition">
            <div class="grid grid-cols-6 gap-2 items-center">
              <div class="pl-1">
                <div class="text-sm font-medium">{{ court.court.name }}</div>
                <div class="text-xs text-gray-400">{{ court.court.courtType }}</div>
              </div>
              <div v-for="t in boardData.timeSlots.slice(0, 5)" :key="t" class="h-10 rounded flex items-center justify-center text-xs"
                :class="cellClass(court, t)">
                <span v-if="court.timeStatuses[t]?.booking">{{ court.timeStatuses[t].booking.startTime.slice(0,5) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold">待办提醒</h3>
          <nuxt-link to="/todos" class="text-primary-600 text-sm hover:underline">查看全部 →</nuxt-link>
        </div>
        <div class="space-y-3">
          <div v-for="t in todoItems" :key="t.id" class="flex items-start gap-3 p-3 rounded-lg" :class="t.bg">
            <span class="text-xl mt-0.5">{{ t.icon }}</span>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium">{{ t.title }}</div>
              <div class="text-xs text-gray-500 mt-0.5">{{ t.sub }}</div>
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full" :class="t.badgeClass">{{ t.count }}</span>
          </div>
          <div v-if="todoItems.length === 0" class="text-center text-gray-400 py-8">
            <div class="text-4xl mb-2">🎉</div>
            <div class="text-sm">暂无待办事项</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-5">
        <h3 class="font-semibold mb-4">场地状态分布</h3>
        <div class="space-y-3">
          <div v-for="s in courtStatusList" :key="s.label" class="flex items-center gap-3">
            <div class="w-28 text-sm flex items-center gap-2"><span class="w-3 h-3 rounded" :class="s.color"></span>{{ s.label }}</div>
            <div class="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
              <div class="h-full rounded-full transition-all flex items-center justify-end pr-2" :class="s.color" :style="{ width: pct(s.count, totalCourts) }">
                <span v-if="s.count > 0" class="text-xs text-white font-medium">{{ s.count }}</span>
              </div>
            </div>
            <div class="w-12 text-right text-sm text-gray-600">{{ pct(s.count, totalCourts) }}</div>
          </div>
        </div>
      </div>

      <div class="card p-5">
        <h3 class="font-semibold mb-4">今日操作快捷入口</h3>
        <div class="grid grid-cols-3 gap-3">
          <nuxt-link v-for="q in quickActions" :key="q.path" :to="q.path" class="p-4 rounded-xl border hover:border-primary-300 hover:shadow-md transition text-center block">
            <div class="text-3xl mb-2">{{ q.icon }}</div>
            <div class="text-sm font-medium">{{ q.name }}</div>
            <div class="text-xs text-gray-400 mt-0.5">{{ q.desc }}</div>
          </nuxt-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const auth = useAuthStore()
const { get } = useApi()

const dateStr = ref(new Date().toISOString().slice(0, 10))
const boardData = ref<any>(null)
const todoData = ref<any>(null)

const stats = computed(() => [
  { label: '今日总收入', value: '¥' + (boardData.value?.overallStats?.totalRevenue || 0), sub: '已结算订单', color: 'text-green-600', icon: '💵' },
  { label: '今日预约', value: boardData.value?.overallStats?.totalBookings || 0, sub: '总场次', color: 'text-blue-600', icon: '📅' },
  { label: '场地利用率', value: (boardData.value?.overallStats?.avgUtilization || 0) + '%', sub: '平均利用率', color: 'text-primary-600', icon: '🎯' },
  { label: '场地总数', value: boardData.value?.overallStats?.totalCourts || 0, sub: '可用 ' + (boardData.value?.statusCounts?.available || 0), color: 'text-purple-600', icon: '🏟️' }
])

const totalCourts = computed(() => boardData.value?.overallStats?.totalCourts || 1)

const courtStatusList = computed(() => {
  const sc = boardData.value?.statusCounts || {}
  return [
    { label: '可用', count: sc.available || 0, color: 'bg-green-500' },
    { label: '已占用', count: sc.booked || 0, color: 'bg-yellow-500' },
    { label: '维护中', count: sc.maintenance || 0, color: 'bg-gray-500' },
    { label: '关闭', count: sc.closed || 0, color: 'bg-red-500' }
  ]
})

const todoItems = computed(() => {
  const s = todoData.value?.summary || {}
  const items = []
  if (s.pendingBookings) items.push({ icon: '📅', title: '今日预约待处理', sub: '待确认/待签到预约', count: s.pendingBookings, bg: 'bg-blue-50', badgeClass: 'bg-blue-100 text-blue-700' })
  if (s.pendingCheckins) items.push({ icon: '✋', title: '等待签到', sub: '已支付未签到', count: s.pendingCheckins, bg: 'bg-teal-50', badgeClass: 'bg-teal-100 text-teal-700' })
  if (s.pendingFaults) items.push({ icon: '🔧', title: '设备故障待处理', sub: '需尽快维修', count: s.pendingFaults, bg: 'bg-orange-50', badgeClass: 'bg-orange-100 text-orange-700' })
  if (s.pendingPayments) items.push({ icon: '💳', title: '待收款预约', sub: '等待客户付款', count: s.pendingPayments, bg: 'bg-yellow-50', badgeClass: 'bg-yellow-100 text-yellow-700' })
  return items.slice(0, 4)
})

const quickActions = [
  { path: '/bookings?tab=create', icon: '➕', name: '创建预约', desc: '为客户预约场地' },
  { path: '/checkin', icon: '✅', name: '快速签到', desc: '核销码签到入场' },
  { path: '/todos?type=booking', icon: '📋', name: '预约待办', desc: '查看今日预约' },
  { path: '/tournaments', icon: '🏆', name: '赛事报名', desc: '赛事管理与报名' },
  { path: '/devices/faults', icon: '🛠️', name: '设备报修', desc: '提交设备故障' },
  { path: '/downloads', icon: '📊', name: '报表导出', desc: '下载运营数据' }
]

function pct(n: number, t: number) {
  return Math.round(n / t * 100) + '%'
}

function cellClass(court: any, t: string) {
  const st = court.timeStatuses[t]
  if (!st) return 'bg-gray-50'
  if (st.type === 'COMPLETED' || st.type === 'CHECKED_IN') return 'bg-blue-100 cursor-pointer hover:bg-blue-200'
  if (st.type === 'PAID' || st.type === 'CONFIRMED') return 'bg-green-100 cursor-pointer hover:bg-green-200'
  if (st.type === 'PENDING') return 'bg-yellow-100 cursor-pointer hover:bg-yellow-200'
  if (st.type === 'ABNORMAL') return 'bg-orange-100 cursor-pointer hover:bg-orange-200'
  if (st.type === 'MAINTENANCE') return 'bg-gray-200'
  if (st.type === 'AVAILABLE') return 'bg-green-50'
  return 'bg-gray-50'
}

function changeDate(delta: number) {
  const d = new Date(dateStr.value)
  d.setDate(d.getDate() + delta)
  dateStr.value = d.toISOString().slice(0, 10)
  loadData()
}

async function loadData() {
  try {
    const [b, t] = await Promise.all([
      get('/api/dashboard/court-usage', { date: dateStr.value }),
      get('/api/todos', { date: dateStr.value, type: 'all' })
    ])
    if (b.code === 0) boardData.value = b.data
    if (t.code === 0) todoData.value = t.data
  } catch {}
}

onMounted(loadData)

definePageMeta({ layout: 'default', middleware: 'auth' })
</script>
