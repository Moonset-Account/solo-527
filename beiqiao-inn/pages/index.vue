<script setup lang="ts">
import { useRooms } from '~/composables/useRooms'

definePageMeta({ layout: 'default' })

const { rooms, inventories, loading, fetchRooms, fetchInventories } = useRooms()

const checkIn = ref('')
const checkOut = ref('')
const activeType = ref('全部')

const typeTabs = ['全部', '大床房', '双床房', '套房']

const typeMap: Record<string, string> = {
  '大床房': 'KING',
  '双床房': 'TWIN',
  '套房': 'SUITE',
}

const statusLabel: Record<string, string> = {
  AVAILABLE: '可预订',
  BOOKED: '已预订',
  OCCUPIED: '已入住',
  MAINTENANCE: '维护中',
  CLEANING: '清洁中',
}

const statusClass: Record<string, string> = {
  AVAILABLE: 'status-available',
  BOOKED: 'status-booked',
  OCCUPIED: 'status-occupied',
  MAINTENANCE: 'status-maintenance',
  CLEANING: 'status-cleaning',
}

const filteredRooms = computed(() => {
  if (activeType.value === '全部') return rooms.value
  const apiType = typeMap[activeType.value]
  return rooms.value.filter((r) => r.type === apiType)
})

const calendarDays = computed(() => {
  const days = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    days.push({
      date: d.toISOString().slice(0, 10),
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()],
    })
  }
  return days
})

const calendarGrid = computed(() => {
  return filteredRooms.value.map((room) => ({
    room,
    days: calendarDays.value.map((day) => {
      const inv = inventories.value.find(
        (inv) => inv.roomId === room.id && inv.date === day.date
      )
      return {
        ...day,
        available: inv ? inv.availableCount : 0,
        total: inv ? inv.totalCount : 0,
        price: inv ? Number(inv.price) : Number(room.basePrice),
      }
    }),
  }))
})

function onTypeChange(tab: string) {
  activeType.value = tab
  loadInventories()
}

async function loadInventories() {
  const start = new Date()
  const end = new Date()
  end.setDate(end.getDate() + 6)
  const params: { startDate: string; endDate: string; type?: string } = {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
  if (activeType.value !== '全部') {
    params.type = typeMap[activeType.value]
  }
  await fetchInventories(params)
}

onMounted(async () => {
  await Promise.all([fetchRooms(), loadInventories()])
})
</script>

<template>
  <div>
    <section class="relative overflow-hidden bg-pine rounded-2xl mb-8 py-16 px-8 text-cream">
      <div class="absolute inset-0 bg-gradient-to-br from-pine via-pine-light/30 to-amber/20" />
      <div class="relative z-10 max-w-2xl">
        <h1 class="font-serif text-4xl md:text-5xl font-bold mb-3 text-cream">
          北桥房态行程台
        </h1>
        <p class="text-cream/70 text-lg mb-8">精品民宿 · 房态库存管理</p>
        <div class="flex flex-wrap gap-3">
          <div class="flex-1 min-w-[180px]">
            <label class="block text-cream/60 text-xs mb-1.5">入住日期</label>
            <input
              v-model="checkIn"
              type="date"
              class="w-full bg-white/10 border border-cream/20 rounded-lg px-4 py-2.5 text-cream placeholder-cream/40 focus:outline-none focus:ring-2 focus:ring-amber/50"
            />
          </div>
          <div class="flex-1 min-w-[180px]">
            <label class="block text-cream/60 text-xs mb-1.5">退房日期</label>
            <input
              v-model="checkOut"
              type="date"
              class="w-full bg-white/10 border border-cream/20 rounded-lg px-4 py-2.5 text-cream placeholder-cream/40 focus:outline-none focus:ring-2 focus:ring-amber/50"
            />
          </div>
        </div>
      </div>
      <div class="absolute -right-20 -bottom-20 w-72 h-72 rounded-full bg-amber/10 blur-3xl" />
    </section>

    <section class="mb-8">
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button
          v-for="tab in typeTabs"
          :key="tab"
          class="px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200"
          :class="activeType === tab
            ? 'bg-pine text-cream shadow-md'
            : 'bg-white text-pine border border-cream-dark hover:bg-cream-dark'"
          @click="onTypeChange(tab)"
        >
          {{ tab }}
        </button>
      </div>
    </section>

    <section class="mb-12">
      <div v-if="loading" class="text-center py-16 text-slate">
        <div class="inline-block w-8 h-8 border-2 border-pine/20 border-t-pine rounded-full animate-spin mb-3" />
        <p>加载中...</p>
      </div>

      <div v-else-if="filteredRooms.length === 0" class="text-center py-16">
        <p class="text-slate text-lg">暂无符合条件的房间</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="room in filteredRooms"
          :key="room.id"
          class="card group cursor-pointer"
        >
          <div class="relative h-44 rounded-lg mb-4 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-pine/80 via-pine-light/60 to-amber/40" />
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-cream/40 font-serif text-3xl">{{ room.name }}</span>
            </div>
            <span
              class="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-semibold"
              :class="statusClass[room.status]"
            >
              {{ statusLabel[room.status] }}
            </span>
          </div>

          <h3 class="font-serif text-lg font-semibold text-pine mb-1">{{ room.name }}</h3>
          <div class="flex items-center gap-2 text-sm text-slate mb-3">
            <span class="px-2 py-0.5 rounded bg-cream-dark text-pine/70 text-xs">{{ room.type }}</span>
            <span>·</span>
            <span>最多 {{ room.maxGuests }} 人</span>
          </div>

          <div class="flex items-end justify-between">
            <div>
              <span class="text-amber font-bold text-xl">¥{{ Number(room.basePrice) }}</span>
              <span class="text-slate text-xs ml-1">/晚</span>
            </div>
            <NuxtLink
              to="/order"
              class="btn-primary text-sm px-4 py-2"
            >
              立即预订
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section class="mb-8">
      <h2 class="font-serif text-2xl font-semibold text-pine mb-5">7日房态日历</h2>
      <div class="card overflow-x-auto">
        <table class="w-full min-w-[600px]">
          <thead>
            <tr>
              <th class="text-left py-3 px-4 text-sm font-medium text-pine/70 w-32">房间</th>
              <th
                v-for="day in calendarDays"
                :key="day.date"
                class="text-center py-3 px-2 text-sm"
              >
                <div class="text-pine font-medium">{{ day.label }}</div>
                <div class="text-slate text-xs">{{ day.weekday }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in calendarGrid"
              :key="row.room.id"
              class="border-t border-cream-dark/50"
            >
              <td class="py-3 px-4 text-sm font-medium text-pine">{{ row.room.name }}</td>
              <td
                v-for="cell in row.days"
                :key="cell.date"
                class="text-center py-3 px-2"
              >
                <div
                  class="mx-auto w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors"
                  :class="cell.available > 0
                    ? 'bg-pine/10 text-pine'
                    : 'bg-slate/10 text-slate'"
                >
                  {{ cell.available > 0 ? `${cell.available}` : '满' }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
