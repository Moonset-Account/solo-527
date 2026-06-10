<template>
  <div class="space-y-5">
    <div class="card p-4">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <button class="btn-secondary !py-1 !px-3" @click="changeDate(-1)">前一天</button>
          <input type="date" v-model="dateStr" class="input !w-auto" @change="loadBoard" />
          <button class="btn-secondary !py-1 !px-3" @click="changeDate(1)">后一天</button>
        </div>
        <div class="flex gap-3 flex-wrap items-center text-xs text-gray-600">
          <div class="flex gap-4">
            <span v-for="l in legends" :key="l.label" class="flex items-center gap-1.5">
              <span class="w-3 h-3 rounded" :class="l.color"></span><span>{{ l.label }}</span>
            </span>
          </div>
          <div class="pl-3 border-l ml-3 text-gray-500">
            场地: <span class="font-bold text-gray-800">{{ board?.overallStats?.totalCourts }}</span>
             | 利用率: <span class="font-bold text-primary-600">{{ board?.overallStats?.avgUtilization }}%</span>
             | 收入: <span class="font-bold text-green-600">¥{{ board?.overallStats?.totalRevenue }}</span>
          </div>
        </div>
      </div>
      <div v-if="board?.overallStats" class="mt-4 grid grid-cols-6 gap-3 text-xs">
        <div class="pl-3 font-medium text-gray-500">场地 / 时段</div>
        <div v-for="t in board.timeSlots?.slice(0,5)" :key="t" class="py-1 font-medium text-gray-600 bg-gray-50 rounded text-center">{{ t }}</div>
      </div>
    </div>

    <div class="space-y-3">
      <div v-for="court in board?.courtBoard || []" :key="court.court.id" class="card p-4">
        <div class="grid grid-cols-6 gap-3 items-start">
          <div class="pl-1">
            <div class="flex items-start justify-between">
              <div>
                <div class="font-semibold text-gray-800">{{ court.court.name }}</div>
                <div class="text-xs text-gray-500 mt-0.5">{{ court.court.courtNumber }} · {{ court.court.courtType }}</div>
                <span class="badge mt-2" :class="court.court.status==='AVAILABLE'?'bg-green-100 text-green-700':court.court.status==='MAINTENANCE'?'bg-gray-100 text-gray-700':'bg-red-100 text-red-700'">{{ statusText(court.court.status) }}</span>
                <div class="mt-3 text-xs space-y-0.5">
                  <div class="text-gray-500">利用率 <span class="font-semibold text-primary-600">{{ court.stats.utilization }}%</span></div>
                  <div class="text-gray-500">收入 <span class="font-semibold text-green-600">¥{{ court.stats.revenue }}</span></div>
                  <div class="text-gray-500">场次 <span class="font-semibold">{{ court.stats.bookingCount }} / {{ court.stats.peopleCount }}人</span></div>
                </div>
              </div>
              <button class="text-xs text-primary-600" @click="router.push('/bookings')">管理 →</button>
            </div>
          </div>
          <div v-for="t in board.timeSlots?.slice(0,5) || []" :key="t"
            class="relative h-24 rounded-lg transition-all"
            :class="[cellBg(court, t), court.timeStatuses?.[t]?.booking ? 'cursor-pointer hover:ring-2 hover:ring-primary-400 hover:shadow-md' : '']"
            @click="court.timeStatuses?.[t]?.booking && openBooking(court.timeStatuses[t].booking.id)">
            <div v-if="court.timeStatuses?.[t]?.booking" class="h-full p-2 flex flex-col justify-between text-xs">
              <div>
                <div class="font-medium text-gray-700 truncate">{{ court.timeStatuses[t].booking.customer?.realName || court.timeStatuses[t].booking.customer?.username }}</div>
                <div class="text-gray-500 mt-0.5 truncate">{{ court.timeStatuses[t].booking.startTime.slice(0,5) }}-{{ court.timeStatuses[t].booking.endTime.slice(0,5) }}</div>
              </div>
              <div class="flex items-center justify-between">
                <span class="badge text-[10px]" :class="statusColor(court.timeStatuses[t].booking.status)">{{ statusText(court.timeStatuses[t].booking.status) }}</span>
                <span>¥{{ Number(court.timeStatuses[t].booking.paidAmount || court.timeStatuses[t].booking.actualAmount || 0).toFixed(0) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="court.bookings?.length" class="mt-4 border-t pt-3">
          <div class="text-xs text-gray-500 mb-2 font-medium">📋 当日预约明细 ({{ court.bookings.length }})</div>
          <div class="flex flex-wrap gap-2">
            <div v-for="b in court.bookings" :key="b.id"
              class="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition"
              @click="openBooking(b.id)">
              <span class="badge" :class="statusColor(b.status)">{{ b.startTime }}-{{ b.endTime }}</span>
              <span class="font-medium">{{ b.customer?.realName || b.customer?.username }}</span>
              <span class="text-gray-500">{{ b.customer?.phone }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const { get } = useApi()
const router = useRouter()
const dateStr = ref(new Date().toISOString().slice(0, 10))
const board = ref<any>(null)

const legends = [
  { label: '可用', color: 'bg-green-50 border border-green-200' },
  { label: '待支付', color: 'bg-yellow-100' },
  { label: '已支付', color: 'bg-green-100' },
  { label: '已签到', color: 'bg-blue-100' },
  { label: '异常', color: 'bg-orange-100' },
  { label: '维护', color: 'bg-gray-300' }
]

function cellBg(court: any, t: string) {
  const st = court?.timeStatuses?.[t]
  if (!st) return 'bg-green-50 border border-green-100'
  if (st.type === 'AVAILABLE') return 'bg-green-50 border border-green-100'
  if (st.type === 'MAINTENANCE' || st.type === 'CLOSED') return 'bg-gray-300'
  if (st.booking?.status === 'ABNORMAL') return 'bg-orange-100'
  if (st.booking?.status === 'CHECKED_IN') return 'bg-blue-100'
  if (st.booking?.status === 'PAID' || st.booking?.status === 'COMPLETED') return 'bg-green-100'
  if (st.booking?.status === 'CONFIRMED') return 'bg-blue-50'
  return 'bg-yellow-100'
}

function openBooking(id: number) { router.push(`/todos?type=booking`) }

function changeDate(delta: number) {
  const d = new Date(dateStr.value); d.setDate(d.getDate() + delta)
  dateStr.value = d.toISOString().slice(0, 10); loadBoard()
}

async function loadBoard() {
  try { const r = await get('/api/dashboard/court-usage', { date: dateStr.value }); if (r.code === 0) board.value = r.data } catch {}
}
onMounted(loadBoard)
definePageMeta({ layout: 'default', middleware: 'auth' })
</script>
