<template>
  <div class="p-6 space-y-6">
    <PageHeader title="支付管理" description="管理所有支付记录" />

    <div class="card">
      <FilterBar :filters="filters" :model-value="filterValues" @update:filter="onFilterChange" />
    </div>

    <div class="card overflow-hidden !p-0">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-500">收银单号</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">关联预约</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">金额</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">支付方式</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">状态</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">创建时间</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="payment in payments" :key="payment.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-900 font-mono text-xs">{{ payment.id.slice(0, 8).toUpperCase() }}</td>
            <td class="px-4 py-3 text-gray-700">{{ payment.appointment?.customerName ?? '-' }}</td>
            <td class="px-4 py-3 text-gray-900 font-medium">¥{{ Number(payment.amount).toFixed(2) }}</td>
            <td class="px-4 py-3 text-gray-700">{{ methodMap[payment.method] ?? payment.method }}</td>
            <td class="px-4 py-3">
              <StatusBadge :status="normalizeStatus(payment.status)" type="payment" />
            </td>
            <td class="px-4 py-3 text-gray-500">{{ formatDateTime(payment.createdAt) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button class="btn-secondary !px-2.5 !py-1 text-xs" @click="openDetail(payment)">详情</button>
                <button
                  v-if="payment.status === 'PENDING'"
                  class="btn-primary !px-2.5 !py-1 text-xs"
                  :disabled="confirming === payment.id"
                  @click="confirmPayment(payment.id)"
                >
                  {{ confirming === payment.id ? '处理中...' : '确认支付' }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!payments.length && !loading">
            <td colspan="7">
              <EmptyState title="暂无支付记录" description="还没有支付记录" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card-hover">
        <p class="text-sm font-medium text-gray-500">总金额</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">¥{{ summary.total.toFixed(2) }}</p>
      </div>
      <div class="card-hover">
        <p class="text-sm font-medium text-gray-500">已支付金额</p>
        <p class="mt-1 text-2xl font-bold text-green-600">¥{{ summary.paid.toFixed(2) }}</p>
      </div>
      <div class="card-hover">
        <p class="text-sm font-medium text-gray-500">待支付金额</p>
        <p class="mt-1 text-2xl font-bold text-amber-600">¥{{ summary.pending.toFixed(2) }}</p>
      </div>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-between">
      <p class="text-sm text-gray-500">共 {{ total }} 条记录</p>
      <div class="flex items-center gap-2">
        <button
          class="btn-secondary !px-3 !py-1.5 text-sm"
          :disabled="page <= 1"
          @click="page--"
        >
          上一页
        </button>
        <span class="text-sm text-gray-700">{{ page }} / {{ totalPages }}</span>
        <button
          class="btn-secondary !px-3 !py-1.5 text-sm"
          :disabled="page >= totalPages"
          @click="page++"
        >
          下一页
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="detailOpen" class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/30" @click="detailOpen = false" />
        <div class="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
          <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">支付详情</h3>
            <button class="p-1 hover:bg-gray-100 rounded" @click="detailOpen = false">
              <X class="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div v-if="detailData" class="p-6 space-y-6">
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-20">收银单号</span>
                <span class="text-sm text-gray-900 font-mono">{{ detailData.id.slice(0, 8).toUpperCase() }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-20">金额</span>
                <span class="text-sm text-gray-900">¥{{ Number(detailData.amount).toFixed(2) }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-20">支付方式</span>
                <span class="text-sm text-gray-900">{{ methodMap[detailData.method] ?? detailData.method }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-20">状态</span>
                <StatusBadge :status="normalizeStatus(detailData.status)" type="payment" />
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-20">创建时间</span>
                <span class="text-sm text-gray-900">{{ formatDateTime(detailData.createdAt) }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-20">支付时间</span>
                <span class="text-sm text-gray-900">{{ detailData.paidAt ? formatDateTime(detailData.paidAt) : '-' }}</span>
              </div>
              <div v-if="detailData.appointment" class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-20">关联预约</span>
                <span class="text-sm text-gray-900">{{ detailData.appointment.customerName }}</span>
              </div>
            </div>

            <div v-if="detailData.items?.length">
              <h4 class="text-sm font-medium text-gray-700 mb-3">支付项目</h4>
              <div class="space-y-2">
                <div
                  v-for="item in detailData.items"
                  :key="item.id"
                  class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <span class="text-sm text-gray-700">{{ item.name }} × {{ item.quantity }}</span>
                  <span class="text-sm text-gray-900 font-medium">¥{{ Number(item.price).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X } from 'lucide-vue-next'

interface PaymentItem {
  id: string
  appointmentId: string
  amount: number | string
  method: string
  status: string
  paidAt: string | null
  createdAt: string
  appointment?: { customerName: string }
  items?: { id: string; name: string; price: number | string; quantity: number }[]
}

const methodMap: Record<string, string> = {
  CASH: '现金',
  WECHAT: '微信',
  ALIPAY: '支付宝',
  CARD: '储值卡',
}

const normalizeStatus = (status: string) => status.toLowerCase().replace(/_/g, '-')

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

const payments = ref<PaymentItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const confirming = ref<string | null>(null)
const detailOpen = ref(false)
const detailData = ref<PaymentItem | null>(null)

const filterValues = ref<Record<string, string>>({
  status: '',
  dateFrom: '',
  dateTo: '',
})

const filters = computed(() => [
  {
    key: 'status',
    label: '状态',
    type: 'select' as const,
    options: [
      { value: 'PENDING', label: '待支付' },
      { value: 'PAID', label: '已支付' },
      { value: 'REFUNDED', label: '已退款' },
    ],
  },
  { key: 'dateFrom', label: '开始日期', type: 'date' as const },
  { key: 'dateTo', label: '结束日期', type: 'date' as const },
])

const totalPages = computed(() => Math.ceil(total.value / pageSize))

const summary = computed(() => {
  let totalAmt = 0
  let paidAmt = 0
  let pendingAmt = 0
  for (const p of payments.value) {
    const amt = Number(p.amount)
    totalAmt += amt
    if (p.status === 'PAID') paidAmt += amt
    if (p.status === 'PENDING') pendingAmt += amt
  }
  return { total: totalAmt, paid: paidAmt, pending: pendingAmt }
})

function onFilterChange({ key, value }: { key: string; value: string }) {
  filterValues.value[key] = value
  page.value = 1
}

async function fetchPayments() {
  loading.value = true
  const query: Record<string, string | number> = { page: page.value, pageSize }
  if (filterValues.value.status) query.status = filterValues.value.status
  if (filterValues.value.dateFrom) query.dateFrom = filterValues.value.dateFrom
  if (filterValues.value.dateTo) query.dateTo = filterValues.value.dateTo

  const res = await useFetch('/api/payments', { query })
  if (res.data.value?.success) {
    payments.value = res.data.value.data.items
    total.value = res.data.value.data.total
  }
  loading.value = false
}

function openDetail(payment: PaymentItem) {
  detailData.value = payment
  detailOpen.value = true
}

async function confirmPayment(id: string) {
  confirming.value = id
  try {
    const res = await $fetch(`/api/payments/${id}/status`, {
      method: 'PUT',
      body: { status: 'PAID' },
    })
    if ((res as any)?.success) {
      await fetchPayments()
    }
  } finally {
    confirming.value = null
  }
}

watch([filterValues, page], fetchPayments, { deep: true })

onMounted(fetchPayments)
</script>
