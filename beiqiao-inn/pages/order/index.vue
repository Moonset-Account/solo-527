<script setup lang="ts">
import { useOrders } from '~/composables/useOrders'

definePageMeta({ layout: 'default' })

const { orders, loading, fetchOrders, requestRefund } = useOrders()

const activeStatus = ref('全部')

const statusTabs = [
  { label: '全部', value: '全部' },
  { label: '待支付', value: 'PENDING_PAYMENT' },
  { label: '已支付', value: 'PAID' },
  { label: '已入住', value: 'CHECKED_IN' },
  { label: '已退房', value: 'CHECKED_OUT' },
  { label: '退款中', value: 'REFUNDING' },
  { label: '已退款', value: 'REFUNDED' },
]

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: '待支付',
  PAID: '已支付',
  CHECKED_IN: '已入住',
  CHECKED_OUT: '已退房',
  REFUNDING: '退款中',
  REFUNDED: '已退款',
  CANCELLED: '已取消',
}

const statusBadgeClass: Record<string, string> = {
  PENDING_PAYMENT: 'bg-amber/15 text-amber',
  PAID: 'bg-pine/10 text-pine',
  CHECKED_IN: 'bg-info/10 text-info',
  CHECKED_OUT: 'bg-slate/10 text-slate',
  REFUNDING: 'bg-brick/10 text-brick',
  REFUNDED: 'bg-slate/10 text-slate',
  CANCELLED: 'bg-slate/10 text-slate',
}

const refundModalOpen = ref(false)
const refundOrderId = ref<number | null>(null)
const refundReason = ref('')
const refundSubmitting = ref(false)

function onStatusChange(status: string) {
  activeStatus.value = status
  const params: { status?: string } = {}
  if (status !== '全部') params.status = status
  fetchOrders(params)
}

function openRefundModal(orderId: number) {
  refundOrderId.value = orderId
  refundReason.value = ''
  refundModalOpen.value = true
}

function closeRefundModal() {
  refundModalOpen.value = false
  refundOrderId.value = null
  refundReason.value = ''
}

async function submitRefund() {
  if (!refundOrderId.value || !refundReason.value.trim()) return
  refundSubmitting.value = true
  try {
    await requestRefund(refundOrderId.value, refundReason.value)
    closeRefundModal()
    const params: { status?: string } = {}
    if (activeStatus.value !== '全部') params.status = activeStatus.value
    await fetchOrders(params)
  } finally {
    refundSubmitting.value = false
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
}

onMounted(() => {
  fetchOrders()
})
</script>

<template>
  <div>
    <h1 class="font-serif text-2xl font-bold text-pine mb-6">订单中心</h1>

    <section class="mb-6">
      <div class="flex gap-2 overflow-x-auto pb-2">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200"
          :class="activeStatus === tab.value
            ? 'bg-pine text-cream shadow-md'
            : 'bg-white text-pine border border-cream-dark hover:bg-cream-dark'"
          @click="onStatusChange(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
    </section>

    <section>
      <div v-if="loading" class="text-center py-16 text-slate">
        <div class="inline-block w-8 h-8 border-2 border-pine/20 border-t-pine rounded-full animate-spin mb-3" />
        <p>加载中...</p>
      </div>

      <div v-else-if="orders.length === 0" class="text-center py-20">
        <div class="w-20 h-20 rounded-full bg-cream-dark mx-auto flex items-center justify-center mb-4">
          <span class="text-4xl text-slate/30">📋</span>
        </div>
        <p class="text-slate text-lg mb-2">暂无订单</p>
        <NuxtLink to="/" class="btn-secondary text-sm">浏览房间</NuxtLink>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="order in orders"
          :key="order.id"
          class="card"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <p class="text-xs text-slate mb-1">订单号：{{ order.orderNo }}</p>
              <h3 class="font-serif text-lg font-semibold text-pine">
                {{ order.room?.name || '房间' }}
              </h3>
            </div>
            <span
              class="px-3 py-1 rounded-full text-xs font-semibold"
              :class="statusBadgeClass[order.status]"
            >
              {{ statusLabel[order.status] }}
            </span>
          </div>

          <div class="flex flex-wrap gap-x-6 gap-y-1 text-sm text-pine/70 mb-3">
            <span>{{ formatDate(order.checkIn) }} - {{ formatDate(order.checkOut) }}</span>
            <span>{{ order.guestName }}</span>
            <span>{{ order.guestCount }}位房客</span>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-cream-dark/50">
            <div>
              <span class="text-slate text-xs">总额</span>
              <span class="text-amber font-bold text-lg ml-2">¥{{ Number(order.totalPrice) }}</span>
            </div>
            <div class="flex gap-2">
              <button
                v-if="order.status === 'PAID' || order.status === 'CHECKED_IN'"
                class="btn-danger text-sm px-4 py-1.5"
                @click="openRefundModal(order.id)"
              >
                申请退款
              </button>
              <NuxtLink
                :to="`/order/${order.id}`"
                class="btn-secondary text-sm px-4 py-1.5"
              >
                查看详情
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>

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
