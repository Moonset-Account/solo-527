<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface Room {
  id: number
  name: string
  type: string
  floor: number
  maxGuests: number
  status: 'AVAILABLE' | 'BOOKED' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING'
  basePrice: number
}

interface RoomInventory {
  id: number
  roomId: number
  date: string
  availableCount: number
  totalCount: number
  price: number
  syncStatus: string
  lastSyncedAt: string | null
  room?: { id: number; name: string; type: string }
}

const rooms = ref<Room[]>([])
const inventories = ref<RoomInventory[]>([])
const loading = ref(true)
const syncing = ref(false)

const filterDate = ref(new Date().toISOString().slice(0, 10))
const filterType = ref('')
const filterStatus = ref('')

const roomTypes = [
  { label: '全部', value: '' },
  { label: '大床房', value: 'KING' },
  { label: '双床房', value: 'TWIN' },
  { label: '套房', value: 'SUITE' },
]

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '可售', value: 'AVAILABLE' },
  { label: '已预订', value: 'BOOKED' },
  { label: '已入住', value: 'OCCUPIED' },
  { label: '维护中', value: 'MAINTENANCE' },
  { label: '清洁中', value: 'CLEANING' },
]

const statusColor: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  BOOKED: 'bg-amber-light/30 text-amber border-amber/30',
  OCCUPIED: 'bg-brick/10 text-brick border-brick/30',
  MAINTENANCE: 'bg-gray-100 text-gray-600 border-gray-200',
  CLEANING: 'bg-blue-100 text-blue-700 border-blue-200',
}

const statusLabel: Record<string, string> = {
  AVAILABLE: '可售',
  BOOKED: '已预订',
  OCCUPIED: '已入住',
  MAINTENANCE: '维护中',
  CLEANING: '清洁中',
}

const syncStatusColor: Record<string, string> = {
  PENDING: 'bg-yellow-200',
  SYNCING: 'bg-blue-300 animate-pulse',
  SYNCED: 'bg-green-300',
  FAILED: 'bg-red-300',
}

const syncStatusLabel: Record<string, string> = {
  PENDING: '待同步',
  SYNCING: '同步中',
  SYNCED: '已同步',
  FAILED: '失败',
}

const showEditModal = ref(false)
const editItem = ref<RoomInventory | null>(null)
const editAvailableCount = ref(0)
const editPrice = ref(0)

const calendarDays = computed(() => {
  const days = []
  const base = new Date(filterDate.value)
  for (let i = 0; i < 30; i++) {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    days.push({
      date: d.toISOString().slice(0, 10),
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      weekday: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
    })
  }
  return days
})

const filteredRooms = computed(() => {
  let result = rooms.value
  if (filterType.value) {
    result = result.filter((r) => r.type === filterType.value)
  }
  if (filterStatus.value) {
    result = result.filter((r) => r.status === filterStatus.value)
  }
  return result
})

const calendarGrid = computed(() => {
  return filteredRooms.value.map((room) => ({
    room,
    days: calendarDays.value.map((day) => {
      const inv = inventories.value.find(
        (i) => i.roomId === room.id && i.date === day.date
      )
      return {
        ...day,
        inventory: inv || null,
        available: inv ? inv.availableCount : 0,
        total: inv ? inv.totalCount : 0,
      }
    }),
  }))
})

function getCellClass(cell: { available: number; total: number; inventory: RoomInventory | null }) {
  if (!cell.inventory) return 'bg-gray-50 text-gray-400'
  if (cell.available === 0) return 'bg-brick/15 text-brick font-semibold'
  if (cell.available < cell.total) return 'bg-amber/15 text-amber'
  return 'bg-pine/10 text-pine font-semibold'
}

async function loadData() {
  loading.value = true
  try {
    const [roomsData, invData] = await Promise.all([
      $fetch<Room[]>('/api/rooms', {
        params: {
          ...(filterType.value ? { type: filterType.value } : {}),
          ...(filterStatus.value ? { status: filterStatus.value } : {}),
        },
      }),
      $fetch<RoomInventory[]>('/api/rooms/inventory', {
        params: {
          startDate: calendarDays.value[0]?.date,
          endDate: calendarDays.value[calendarDays.value.length - 1]?.date,
          ...(filterType.value ? { type: filterType.value } : {}),
        },
      }),
    ])
    rooms.value = roomsData
    inventories.value = invData
  } finally {
    loading.value = false
  }
}

async function onSync() {
  syncing.value = true
  try {
    const result = await $fetch<{ synced: number }>('/api/rooms/inventory/sync', { method: 'POST' })
    await loadData()
    alert(`同步完成，共同步 ${result.synced} 条库存`)
  } catch {
    alert('同步失败，请重试')
  } finally {
    syncing.value = false
  }
}

function onCellClick(room: Room, day: { date: string }, cell: { inventory: RoomInventory | null }) {
  if (cell.inventory) {
    editItem.value = cell.inventory
    editAvailableCount.value = cell.inventory.availableCount
    editPrice.value = Number(cell.inventory.price)
  } else {
    editItem.value = {
      id: 0,
      roomId: room.id,
      date: day.date,
      availableCount: room.status === 'AVAILABLE' ? 1 : 0,
      totalCount: 1,
      price: Number(room.basePrice),
      syncStatus: 'PENDING',
      lastSyncedAt: null,
    }
    editAvailableCount.value = room.status === 'AVAILABLE' ? 1 : 0
    editPrice.value = Number(room.basePrice)
  }
  showEditModal.value = true
}

async function onSaveEdit() {
  if (!editItem.value) return
  try {
    if (editItem.value.id > 0) {
      await $fetch(`/api/rooms/inventory/${editItem.value.id}`, {
        method: 'PUT',
        body: {
          availableCount: editAvailableCount.value,
          price: editPrice.value,
          syncStatus: 'PENDING',
        },
      })
    }
    showEditModal.value = false
    await loadData()
  } catch {
    alert('保存失败，请重试')
  }
}

onMounted(loadData)

watch([filterDate, filterType, filterStatus], () => {
  loadData()
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="font-serif text-2xl font-bold text-pine">房态管理</h1>
      <button
        class="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
        :class="syncing ? 'bg-slate/20 text-slate cursor-wait' : 'bg-pine text-cream hover:bg-pine-light'"
        :disabled="syncing"
        @click="onSync"
      >
        {{ syncing ? '同步中...' : '同步库存' }}
      </button>
    </div>

    <div class="bg-white rounded-xl p-4 shadow-sm border border-cream-dark/50 mb-6">
      <div class="flex flex-wrap gap-4 items-end">
        <div class="flex-1 min-w-[160px]">
          <label class="block text-xs text-slate mb-1.5">起始日期</label>
          <input
            v-model="filterDate"
            type="date"
            class="w-full rounded-lg border border-cream-dark/80 bg-cream/30 px-3 py-2 text-sm text-pine focus:outline-none focus:ring-2 focus:ring-pine/30"
          />
        </div>
        <div class="flex-1 min-w-[140px]">
          <label class="block text-xs text-slate mb-1.5">房间类型</label>
          <select
            v-model="filterType"
            class="w-full rounded-lg border border-cream-dark/80 bg-cream/30 px-3 py-2 text-sm text-pine focus:outline-none focus:ring-2 focus:ring-pine/30"
          >
            <option v-for="opt in roomTypes" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <div class="flex-1 min-w-[140px]">
          <label class="block text-xs text-slate mb-1.5">房间状态</label>
          <select
            v-model="filterStatus"
            class="w-full rounded-lg border border-cream-dark/80 bg-cream/30 px-3 py-2 text-sm text-pine focus:outline-none focus:ring-2 focus:ring-pine/30"
          >
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl p-4 shadow-sm border border-cream-dark/50 mb-8">
      <h2 class="font-serif text-lg font-semibold text-pine mb-4">房态总览</h2>
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="inline-block w-8 h-8 border-2 border-pine/20 border-t-pine rounded-full animate-spin" />
      </div>
      <div v-else-if="filteredRooms.length === 0" class="text-center py-12 text-slate">
        暂无符合条件的房间
      </div>
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div
          v-for="room in filteredRooms"
          :key="room.id"
          class="rounded-lg border p-3 text-center transition-shadow hover:shadow-md cursor-default"
          :class="statusColor[room.status]"
        >
          <div class="text-sm font-semibold mb-1">{{ room.name }}</div>
          <div class="text-xs opacity-75">{{ statusLabel[room.status] }}</div>
          <div class="text-xs opacity-60 mt-1">¥{{ Number(room.basePrice) }}/晚</div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl p-4 shadow-sm border border-cream-dark/50 mb-8">
      <h2 class="font-serif text-lg font-semibold text-pine mb-4">30日库存日历</h2>
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="inline-block w-8 h-8 border-2 border-pine/20 border-t-pine rounded-full animate-spin" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full min-w-[1200px]">
          <thead>
            <tr>
              <th class="sticky left-0 z-10 bg-white text-left py-2 px-3 text-sm font-medium text-pine/70 w-28">房间</th>
              <th
                v-for="day in calendarDays"
                :key="day.date"
                class="text-center py-2 px-1 text-xs min-w-[40px]"
              >
                <div class="font-medium text-pine">{{ day.label }}</div>
                <div class="text-slate">周{{ day.weekday }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in calendarGrid"
              :key="row.room.id"
              class="border-t border-cream-dark/30"
            >
              <td class="sticky left-0 z-10 bg-white py-2 px-3 text-sm font-medium text-pine">
                {{ row.room.name }}
              </td>
              <td
                v-for="cell in row.days"
                :key="cell.date"
                class="text-center py-1.5 px-0.5"
              >
                <div
                  class="relative mx-auto w-9 h-9 rounded-md flex items-center justify-center text-xs cursor-pointer transition-all hover:ring-2 hover:ring-pine/40"
                  :class="getCellClass(cell)"
                  @click="onCellClick(row.room, cell, cell)"
                >
                  {{ cell.inventory ? cell.available : '-' }}
                  <span
                    v-if="cell.inventory && cell.inventory.syncStatus !== 'SYNCED'"
                    class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                    :class="syncStatusColor[cell.inventory?.syncStatus || '']"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="flex items-center gap-5 text-xs text-slate mb-4">
      <span class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-sm bg-pine/10" /> 可售
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-sm bg-amber/15" /> 部分可售
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-sm bg-brick/15" /> 满房
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-3 h-3 rounded-sm bg-gray-50" /> 无数据
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-yellow-200" /> 待同步
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-blue-300" /> 同步中
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-green-300" /> 已同步
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-red-300" /> 失败
      </span>
    </div>

    <Teleport to="body">
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showEditModal = false"
      >
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
          <h3 class="font-serif text-lg font-semibold text-pine mb-5">编辑库存</h3>
          <div v-if="editItem" class="space-y-4">
            <div class="flex items-center gap-2 text-sm text-slate">
              <span class="font-medium text-pine">{{ rooms.find(r => r.id === editItem.roomId)?.name || `房间 #${editItem.roomId}` }}</span>
              <span>·</span>
              <span>{{ editItem.date }}</span>
            </div>
            <div>
              <label class="block text-xs text-slate mb-1.5">可售数量</label>
              <input
                v-model.number="editAvailableCount"
                type="number"
                min="0"
                class="w-full rounded-lg border border-cream-dark/80 bg-cream/30 px-3 py-2 text-sm text-pine focus:outline-none focus:ring-2 focus:ring-pine/30"
              />
            </div>
            <div>
              <label class="block text-xs text-slate mb-1.5">价格 (¥)</label>
              <input
                v-model.number="editPrice"
                type="number"
                min="0"
                step="0.01"
                class="w-full rounded-lg border border-cream-dark/80 bg-cream/30 px-3 py-2 text-sm text-pine focus:outline-none focus:ring-2 focus:ring-pine/30"
              />
            </div>
            <div
              v-if="editItem.id > 0 && editItem.syncStatus !== 'SYNCED'"
              class="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
              :class="editItem.syncStatus === 'FAILED' ? 'bg-brick/10 text-brick' : 'bg-amber/10 text-amber'"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="syncStatusColor[editItem.syncStatus]"
              />
              {{ syncStatusLabel[editItem.syncStatus] || editItem.syncStatus }}
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button
              class="px-4 py-2 rounded-lg text-sm text-slate border border-cream-dark hover:bg-cream-dark/50 transition-colors"
              @click="showEditModal = false"
            >
              取消
            </button>
            <button
              class="px-4 py-2 rounded-lg text-sm text-cream bg-pine hover:bg-pine-light transition-colors"
              @click="onSaveEdit"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
