<script setup lang="ts">
import { useOrders } from '~/composables/useOrders'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()
const orderId = Number(route.params.id)

const { currentOrder, fetchOrder, requestRefund } = useOrders()
const loading = ref(true)

const statusSteps = [
  { key: 'PENDING_PAYMENT', label: '待支付' },
  { key: 'PAID', label: '已支付' },
  { key: 'CHECKED_IN', label: '已入住' },
  { key: 'CHECKED_OUT', label: '已退房' },
]

const refundSteps = [
  { key: 'REFUNDING', label: '退款中' },
  { key: 'REFUNDED', label: '已退款' },
]

const activeStepIndex = computed(() => {
  if (!currentOrder.value) return -1
  const s = currentOrder.value.status
  const idx = statusSteps.findIndex((step) => step.key === s)
  if (idx >= 0) return idx
  return -1
})

const isRefundFlow = computed(() => {
  if (!currentOrder.value) return false
  return ['REFUNDING', 'REFUNDED', 'CANCELLED'].includes(currentOrder.value.status)
})

const refundStepIndex = computed(() => {
  if (!currentOrder.value) return -1
  const s = currentOrder.value.status
  const idx = refundSteps.findIndex((step) => step.key === s)
  return idx
})

const refundModalOpen = ref(false)
const refundReason = ref('')
const refundSubmitting = ref(false)

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function openRefundModal() {
  refundReason.value = ''
  refundModalOpen.value = true
}

function closeRefundModal() {
  refundModalOpen.value = false
  refundReason.value = ''
}

async function submitRefund() {
  if (!refundReason.value.trim()) return
  refundSubmitting.value = true
  try {
    await requestRefund(orderId, refundReason.value)
    closeRefundModal()
    await fetchOrder(orderId)
  } finally {
    refundSubmitting.value = false
  }
}

onMounted(async () => {
  try {
    await fetchOrder(orderId)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <div v-if="loading" class="text-center py-20 text-slate">
      <div class="inline-block w-8 h-8 border-2 border-pine/20 border-t-pine rounded-full animate-spin mb-3" />
      <p>加载中...</p>
    </div>

    <template v-else-if="currentOrder">
      <NuxtLink
        to="/order"
        class="inline-flex items-center gap-1 text-sm text-pine/60 hover:text-pine transition-colors mb-6"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回订单列表
      </NuxtLink>

      <div class="card mb-6">
        <div v-if="isRefundFlow" class="py-4">
          <div class="flex items-center justify-between max-w-md mx-auto">
            <div
              v-for="(step, i) in refundSteps"
              :key="step.key"
              class="flex items-center"
              :class="i < refundSteps.length - 1 ? 'flex-1' : ''"
            >
              <div class="flex flex-col items-center">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300"
                  :class="i <= refundStepIndex
                    ? 'bg-brick text-white'
                    : 'bg-cream-dark text-slate'"
                >
                  {{ i + 1 }}
                </div>
                <span class="text-xs mt-1.5" :class="i <= refundStepIndex ? 'text-brick font-medium' : 'text-slate'">
                  {{ step.label }}
                </span>
              </div>
              <div
                v-if="i < refundSteps.length - 1"
                class="flex-1 h-0.5 mx-3"
                :class="i < refundStepIndex ? 'bg-brick' : 'bg-cream-dark'"
              />
            </div>
          </div>
        </div>

        <div v-else class="py-4">
          <div class="flex items-center justify-between max-w-2xl mx-auto">
            <div
              v-for="(step, i) in statusSteps"
              :key="step.key"
              class="flex items-center"
              :class="i < statusSteps.length - 1 ? 'flex-1' : ''"
            >
              <div class="flex flex-col items-center">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300"
                  :class="i <= activeStepIndex
                    ? 'bg-pine text-cream'
                    : 'bg-cream-dark text-slate'"
                >
                  {{ i + 1 }}
                </div>
                <span class="text-xs mt-1.5" :class="i <= activeStepIndex ? 'text-pine font-medium' : 'text-slate'">
                  {{ step.label }}
                </span>
              </div>
              <div
                v-if="i < statusSteps.length - 1"
                class="flex-1 h-0.5 mx-3"
                :class="i < activeStepIndex ? 'bg-pine' : 'bg-cream-dark'"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-6">
        <h2 class="font-serif text-xl font-semibold text-pine mb-4">订单信息</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex items-start gap-3">
            <span class="text-slate text-sm w-20 shrink-0">订单号</span>
            <span class="text-pine font-medium text-sm">{{ currentOrder.orderNo }}</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-slate text-sm w-20 shrink-0">房间</span>
            <span class="text-pine font-medium text-sm">{{ currentOrder.room?.name || '-' }}</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-slate text-sm w-20 shrink-0">入住日期</span>
            <span class="text-pine font-medium text-sm">{{ formatDate(currentOrder.checkIn) }}</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-slate text-sm w-20 shrink-0">退房日期</span>
            <span class="text-pine font-medium text-sm">{{ formatDate(currentOrder.checkOut) }}</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-slate text-sm w-20 shrink-0">房客姓名</span>
            <span class="text-pine font-medium text-sm">{{ currentOrder.guestName }}</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-slate text-sm w-20 shrink-0">联系电话</span>
            <span class="text-pine font-medium text-sm">{{ currentOrder.guestPhone }}</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-slate text-sm w-20 shrink-0">入住人数</span>
            <span class="text-pine font-medium text-sm">{{ currentOrder.guestCount }}人</span>
          </div>
          <div class="flex items-start gap-3">
            <span class="text-slate text-sm w-20 shrink-0">订单金额</span>
            <span class="text-amber font-bold text-lg">¥{{ Number(currentOrder.totalPrice) }}</span>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          v-if="currentOrder.status === 'PENDING_PAYMENT'"
          class="btn-primary flex-1 py-3 text-center text-lg"
        >
          支付 ¥{{ Number(currentOrder.totalPrice) }}
        </button>
        <button
          v-if="currentOrder.status === 'PAID' || currentOrder.status === 'CHECKED_IN'"
          class="btn-danger flex-1 py-3 text-center"
          @click="openRefundModal"
        >
          申请退款
        </button>
        <NuxtLink
          v-if="!['PENDING_PAYMENT', 'PAID', 'CHECKED_IN'].includes(currentOrder.status)"
          to="/order"
          class="btn-secondary flex-1 py-3 text-center"
        >
          返回
        </NuxtLink>
      </div>
    </template>

    <div v-else class="text-center py-20">
      <p class="text-slate text-lg">订单不存在</p>
      <NuxtLink to="/order" class="btn-secondary mt-4 inline-block">返回订单列表</NuxtLink>
    </div>

    <Teleport to="body">
      <div
        v-if="refundModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div class="absolute inset-0 bg-pine-dark/50 backdrop-blur-sm" @click="closeRefundModal" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <h3 class="font-serif text-xl font-semibold text-pine mb-4">申请退款</h3>
          <textarea
            v-model="refundReason"
            rows="4"
            placeholder="请填写退款原因..."
            class="w-full border border-cream-dark rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pine/30 resize-none"
          />
          <div class="flex gap-3 mt-4">
            <button class="btn-secondary flex-1" @click="closeRefundModal">取消</button>
            <button
              class="btn-danger flex-1"
              :class="{ 'opacity-50 cursor-not-allowed': !refundReason.trim() || refundSubmitting }"
              :disabled="!refundReason.trim() || refundSubmitting"
              @click="submitRefund"
            >
              {{ refundSubmitting ? '提交中...' : '确认退款' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
