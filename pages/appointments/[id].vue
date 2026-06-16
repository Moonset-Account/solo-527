<template>
  <div class="p-6 space-y-6">
    <PageHeader title="预约详情">
      <NuxtLink to="/appointments" class="btn-secondary">
        <ArrowLeft class="w-4 h-4 mr-1" />
        返回列表
      </NuxtLink>
    </PageHeader>

    <div v-if="!appointment" class="card">
      <EmptyState title="预约不存在" description="未找到该预约记录" />
    </div>

    <template v-else>
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-gray-900">预约信息</h2>
          <StatusBadge :status="normalizeStatus(appointment.status)" type="appointment" />
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 w-20 shrink-0">客户姓名</span>
            <span class="text-sm text-gray-900">{{ appointment.customerName }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 w-20 shrink-0">联系电话</span>
            <span class="text-sm text-gray-900">{{ appointment.customerPhone ?? '-' }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 w-20 shrink-0">服务类型</span>
            <span class="text-sm text-gray-900">{{ serviceTypeMap[appointment.serviceType] ?? appointment.serviceType }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 w-20 shrink-0">预约时间</span>
            <span class="text-sm text-gray-900">{{ formatDateTime(appointment.scheduledAt) }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 w-20 shrink-0">负责人</span>
            <span class="text-sm text-gray-900">{{ appointment.assignee?.name ?? '-' }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 w-20 shrink-0">创建时间</span>
            <span class="text-sm text-gray-900">{{ formatDateTime(appointment.createdAt) }}</span>
          </div>
          <div v-if="appointment.notes" class="flex items-start gap-3 md:col-span-2">
            <span class="text-sm text-gray-500 w-20 shrink-0">备注</span>
            <span class="text-sm text-gray-900">{{ appointment.notes }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">车辆信息</h2>
        <div v-if="appointment.vehicle" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 w-20 shrink-0">车牌号</span>
            <span class="text-sm text-gray-900 font-medium">{{ appointment.vehicle.plateNumber }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 w-20 shrink-0">品牌</span>
            <span class="text-sm text-gray-900">{{ appointment.vehicle.brand ?? '-' }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 w-20 shrink-0">型号</span>
            <span class="text-sm text-gray-900">{{ appointment.vehicle.model ?? '-' }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 w-20 shrink-0">颜色</span>
            <span class="text-sm text-gray-900">{{ appointment.vehicle.color ?? '-' }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 w-20 shrink-0">车主</span>
            <span class="text-sm text-gray-900">{{ appointment.vehicle.ownerName ?? '-' }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400">暂无车辆信息</p>
      </div>

      <div v-if="appointment.payment" class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">支付信息</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 w-20 shrink-0">金额</span>
            <span class="text-sm text-gray-900 font-medium">¥{{ appointment.payment.amount }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 w-20 shrink-0">支付方式</span>
            <span class="text-sm text-gray-900">{{ paymentMethodMap[appointment.payment.method] ?? appointment.payment.method }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500 w-20 shrink-0">支付状态</span>
            <StatusBadge :status="appointment.payment.status.toLowerCase()" type="payment" />
          </div>
          <div v-if="appointment.payment.paidAt" class="flex items-center gap-3">
            <span class="text-sm text-gray-500 w-20 shrink-0">支付时间</span>
            <span class="text-sm text-gray-900">{{ formatDateTime(appointment.payment.paidAt) }}</span>
          </div>
        </div>
        <div v-if="appointment.payment.items?.length" class="mt-4 pt-4 border-t border-gray-100">
          <h3 class="text-sm font-medium text-gray-700 mb-3">费用明细</h3>
          <div class="space-y-2">
            <div
              v-for="item in appointment.payment.items"
              :key="item.id"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-gray-700">{{ item.name }} x{{ item.quantity }}</span>
              <span class="text-gray-900">¥{{ item.price }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">操作</h2>
        <div class="flex flex-wrap gap-3">
          <button
            v-if="appointment.status === 'CONFIRMED'"
            class="btn-primary"
            :disabled="submitting"
            @click="changeStatus('IN_PROGRESS')"
          >
            开始服务
          </button>
          <button
            v-if="appointment.status === 'IN_PROGRESS'"
            class="btn-primary"
            :disabled="submitting"
            @click="changeStatus('COMPLETED')"
          >
            完成服务
          </button>
          <button
            v-if="appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED'"
            class="btn-danger"
            :disabled="submitting"
            @click="changeStatus('CANCELLED')"
          >
            取消预约
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'

interface AppointmentDetail {
  id: string
  customerName: string
  customerPhone: string | null
  serviceType: string
  status: string
  scheduledAt: string
  notes: string | null
  createdAt: string
  vehicle?: {
    plateNumber: string
    brand: string | null
    model: string | null
    color: string | null
    ownerName: string | null
  }
  assignee?: { name: string }
  payment?: {
    id: string
    amount: number
    method: string
    status: string
    paidAt: string | null
    items?: { id: string; name: string; price: number; quantity: number }[]
  }
}

const serviceTypeMap: Record<string, string> = {
  WASH: '洗车',
  MAINTENANCE: '保养',
  TEST_DRIVE: '试驾',
}

const paymentMethodMap: Record<string, string> = {
  CASH: '现金',
  WECHAT: '微信',
  ALIPAY: '支付宝',
  CARD: '银行卡',
}

const route = useRoute()
const appointment = ref<AppointmentDetail | null>(null)
const submitting = ref(false)

const normalizeStatus = (status: string) => status.toLowerCase().replace(/_/g, '-')

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

async function fetchAppointment() {
  const id = route.params.id as string
  const res = await useFetch(`/api/appointments/${id}`)
  if (res.data.value?.success) {
    appointment.value = res.data.value.data
  }
}

async function changeStatus(status: string) {
  if (!appointment.value || submitting.value) return
  submitting.value = true
  try {
    const res = await $fetch(`/api/appointments/${appointment.value.id}`, {
      method: 'PUT',
      body: { status },
    })
    if ((res as any)?.success) {
      appointment.value = (res as any).data
    }
  } finally {
    submitting.value = false
  }
}

onMounted(fetchAppointment)
</script>
