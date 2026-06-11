<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const route = useRoute()

const rooms = ref<any[]>([])
const selectedRoomId = ref<number | null>(null)
const checkIn = ref('')
const checkOut = ref('')
const guestName = ref('')
const guestPhone = ref('')
const guestCount = ref(1)
const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const success = ref(false)
const createdOrder = ref<any>(null)

const priceSummary = computed(() => {
  if (!selectedRoomId.value || !checkIn.value || !checkOut.value) return null
  const room = rooms.value.find(r => r.id === selectedRoomId.value)
  if (!room) return null

  const inDate = new Date(checkIn.value)
  const outDate = new Date(checkOut.value)
  const nights = Math.ceil((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24))
  if (nights <= 0) return null

  return {
    nights,
    basePrice: room.basePrice,
    total: room.basePrice * nights,
    roomName: room.name,
  }
})

async function loadRooms() {
  loading.value = true
  error.value = ''
  try {
    const data = await $fetch('/api/rooms')
    rooms.value = Array.isArray(data) ? data : (data as any).data || []

    if (route.query.roomId && !selectedRoomId.value) {
      selectedRoomId.value = Number(route.query.roomId)
    }
    if (route.query.checkIn && !checkIn.value) {
      checkIn.value = String(route.query.checkIn)
    }
    if (route.query.checkOut && !checkOut.value) {
      checkOut.value = String(route.query.checkOut)
    }
    if (route.query.guests && !guestCount.value) {
      guestCount.value = Number(route.query.guests)
    }
  } catch (e: any) {
    error.value = e?.message || '加载房间信息失败'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!selectedRoomId.value) {
    error.value = '请选择房型'
    return
  }
  if (!checkIn.value || !checkOut.value) {
    error.value = '请选择入住和退房日期'
    return
  }
  if (!guestName.value || !guestPhone.value) {
    error.value = '请填写入住人姓名和手机号'
    return
  }
  if (guestCount.value < 1) {
    error.value = '入住人数至少为1'
    return
  }

  submitting.value = true
  error.value = ''
  try {
    const order = await $fetch('/api/orders', {
      method: 'POST',
      body: {
        roomId: selectedRoomId.value,
        checkIn: checkIn.value,
        checkOut: checkOut.value,
        guestCount: guestCount.value,
        guestName: guestName.value,
        guestPhone: guestPhone.value,
      },
    })
    createdOrder.value = order
    success.value = true
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || '下单失败，请重试'
  } finally {
    submitting.value = false
  }
}

function goToOrder() {
  navigateTo('/order')
}

onMounted(() => {
  loadRooms()
})
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div class="mb-8">
      <h1 class="font-serif text-3xl font-bold text-pine mb-2">预订房间</h1>
      <p class="text-slate">选择房型、入住日期并填写入住人信息</p>
    </div>

    <div v-if="success && createdOrder" class="card border-2 border-pine/20 p-8 text-center">
      <div class="w-16 h-16 rounded-full bg-pine/10 flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-pine" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 class="font-serif text-2xl font-bold text-pine mb-2">预订成功！</h2>
      <p class="text-slate mb-6">订单号：<span class="font-mono font-semibold text-pine">{{ createdOrder.orderNo }}</span></p>

      <div class="bg-cream/50 rounded-xl p-5 mb-6 text-left max-w-md mx-auto">
        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-slate">房型</span>
            <span class="font-medium text-pine">{{ createdOrder.room?.name }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate">入住 - 退房</span>
            <span class="font-medium text-pine">{{ createdOrder.checkIn }} ~ {{ createdOrder.checkOut }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate">入住人</span>
            <span class="font-medium text-pine">{{ createdOrder.guestName }}</span>
          </div>
          <div class="flex justify-between pt-3 border-t border-cream-dark/50">
            <span class="text-slate">订单金额</span>
            <span class="font-bold text-pine text-lg">¥{{ createdOrder.totalPrice }}</span>
          </div>
        </div>
      </div>

      <div class="flex gap-3 justify-center">
        <button @click="goToOrder" class="btn-secondary">查看我的订单</button>
        <button @click="navigateTo('/')" class="btn-primary">返回首页</button>
      </div>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <div class="card">
        <h3 class="font-serif text-lg font-semibold text-pine mb-4">选择房型</h3>
        <div v-if="loading" class="text-center py-8 text-slate">加载中...</div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            v-for="room in rooms"
            :key="room.id"
            class="relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-200"
            :class="selectedRoomId === room.id ? 'border-pine bg-pine/5' : 'border-cream-dark/50 hover:border-pine/40'"
          >
            <input
              type="radio"
              :value="room.id"
              v-model="selectedRoomId"
              class="sr-only"
            />
            <div class="flex items-start justify-between">
              <div>
                <p class="font-medium text-pine">{{ room.name }}</p>
                <p class="text-sm text-slate mt-0.5">最多{{ room.maxGuests }}人 · {{ room.floor }}楼</p>
              </div>
              <div class="text-right">
                <p class="font-bold text-pine text-lg">¥{{ room.basePrice }}</p>
                <p class="text-xs text-slate">/晚</p>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5 mt-3">
              <span
                v-for="amenity in (room.amenities || []).slice(0, 3)"
                :key="amenity"
                class="px-2 py-0.5 bg-cream text-xs text-slate rounded"
              >
                {{ amenity }}
              </span>
            </div>
            <div
              v-if="selectedRoomId === room.id"
              class="absolute top-2 right-2 w-5 h-5 rounded-full bg-pine flex items-center justify-center"
            >
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </label>
        </div>
      </div>

      <div class="card">
        <h3 class="font-serif text-lg font-semibold text-pine mb-4">入住日期</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-pine mb-1.5">入住日期</label>
            <input
              v-model="checkIn"
              type="date"
              class="w-full px-4 py-2.5 rounded-lg border border-cream-dark bg-white text-pine-dark focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-pine mb-1.5">退房日期</label>
            <input
              v-model="checkOut"
              type="date"
              class="w-full px-4 py-2.5 rounded-lg border border-cream-dark bg-white text-pine-dark focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition-colors"
            />
          </div>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-pine mb-1.5">入住人数</label>
          <div class="flex items-center gap-3">
            <button
              type="button"
              @click="guestCount = Math.max(1, guestCount - 1)"
              class="w-10 h-10 rounded-lg border border-cream-dark bg-white text-pine hover:bg-cream transition-colors flex items-center justify-center text-lg font-medium"
            >
              -
            </button>
            <span class="w-12 text-center text-xl font-semibold text-pine">{{ guestCount }}</span>
            <button
              type="button"
              @click="guestCount = Math.min(6, guestCount + 1)"
              class="w-10 h-10 rounded-lg border border-cream-dark bg-white text-pine hover:bg-cream transition-colors flex items-center justify-center text-lg font-medium"
            >
              +
            </button>
            <span class="text-sm text-slate ml-2">位住客</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="font-serif text-lg font-semibold text-pine mb-4">入住人信息</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-pine mb-1.5">姓名</label>
            <input
              v-model="guestName"
              type="text"
              placeholder="请输入入住人姓名"
              class="w-full px-4 py-2.5 rounded-lg border border-cream-dark bg-white text-pine-dark placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition-colors"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-pine mb-1.5">手机号</label>
            <input
              v-model="guestPhone"
              type="tel"
              placeholder="请输入手机号"
              class="w-full px-4 py-2.5 rounded-lg border border-cream-dark bg-white text-pine-dark placeholder:text-slate/50 focus:outline-none focus:ring-2 focus:ring-pine/30 focus:border-pine transition-colors"
            />
          </div>
        </div>
      </div>

      <div v-if="priceSummary" class="card bg-pine/5 border-pine/20">
        <h3 class="font-serif text-lg font-semibold text-pine mb-4">价格明细</h3>
        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-slate">{{ priceSummary.roomName }} × {{ priceSummary.nights }}晚</span>
            <span class="text-pine">¥{{ priceSummary.basePrice }} × {{ priceSummary.nights }}</span>
          </div>
          <div class="flex justify-between pt-3 border-t border-pine/10">
            <span class="font-medium text-pine">合计</span>
            <span class="font-bold text-2xl text-pine">¥{{ priceSummary.total }}</span>
          </div>
        </div>
      </div>

      <div v-if="error" class="bg-brick/10 text-brick px-4 py-3 rounded-lg text-sm">
        {{ error }}
      </div>

      <button
        type="submit"
        :disabled="submitting || !selectedRoomId || !checkIn || !checkOut || !guestName || !guestPhone"
        class="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg v-if="submitting" class="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {{ submitting ? '提交中...' : '确认预订' }}
      </button>
    </form>
  </div>
</template>
