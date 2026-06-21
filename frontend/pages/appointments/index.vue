<template>
  <div class="appointments-page space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">预约订单管理</h1>
        <p class="text-sm text-gray-500 mt-1">管理所有预约订单，处理售后及状态变更</p>
      </div>
      <div class="flex items-center gap-2">
        <n-button size="small" @click="handleResetFilter">
          重置筛选
        </n-button>
        <n-button size="small" type="primary">
          <template #icon>
            <n-icon>
              <AddCircleSharp />
            </n-icon>
          </template>
          新建订单
        </n-button>
      </div>
    </div>

    <n-card class="!rounded-2xl !border-0" content-style="padding: 20px;">
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div>
          <label class="text-sm text-gray-600 mb-1.5 block">订单状态</label>
          <n-select
            v-model:value="filterStatus"
            :options="statusFilterOptions"
            placeholder="全部状态"
            clearable
            size="small"
          />
        </div>
        <div>
          <label class="text-sm text-gray-600 mb-1.5 block">预约日期</label>
          <n-date-picker
            v-model:value="filterDateRange"
            type="daterange"
            placeholder="选择日期范围"
            clearable
            size="small"
            value-format="yyyy-MM-dd"
          />
        </div>
        <div>
          <label class="text-sm text-gray-600 mb-1.5 block">搜索</label>
          <n-input
            v-model:value="filterKeyword"
            placeholder="订单号/客户/宠物"
            size="small"
            clearable
          >
            <template #prefix>
              <n-icon size="16">
                <SearchSharp />
              </n-icon>
            </template>
          </n-input>
        </div>
        <div class="flex items-end gap-2">
          <n-button size="small" type="primary" @click="handleSearch">
            <template #icon>
              <n-icon size="16">
                <SearchSharp />
              </n-icon>
            </template>
            搜索
          </n-button>
          <n-button size="small" @click="handleResetFilter">重置</n-button>
        </div>
      </div>
    </n-card>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <n-card class="!rounded-2xl !border-0 !bg-gradient-to-br !from-amber-50 !to-amber-100" content-style="padding: 20px;">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">待确认</div>
            <div class="text-2xl font-bold text-gray-800 mt-1">{{ statusCounts.pending }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background-color: rgba(245, 158, 11, 0.15);">
            <n-icon :size="22" color="#F59E0B">
              <TimeSharp />
            </n-icon>
          </div>
        </div>
      </n-card>
      <n-card class="!rounded-2xl !border-0 !bg-gradient-to-br !from-blue-50 !to-blue-100" content-style="padding: 20px;">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">服务中</div>
            <div class="text-2xl font-bold text-gray-800 mt-1">{{ statusCounts.in_service }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background-color: rgba(59, 130, 246, 0.15);">
            <n-icon :size="22" color="#3B82F6">
              <HeartSharp />
            </n-icon>
          </div>
        </div>
      </n-card>
      <n-card class="!rounded-2xl !border-0 !bg-gradient-to-br !from-teal-50 !to-teal-100" content-style="padding: 20px;">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">已完成</div>
            <div class="text-2xl font-bold text-gray-800 mt-1">{{ statusCounts.completed }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background-color: rgba(26, 138, 125, 0.15);">
            <n-icon :size="22" color="#1A8A7D">
              <CheckmarkCircleSharp />
            </n-icon>
          </div>
        </div>
      </n-card>
      <n-card class="!rounded-2xl !border-0 !bg-gradient-to-br !from-red-50 !to-red-100" content-style="padding: 20px;">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">售后中</div>
            <div class="text-2xl font-bold text-gray-800 mt-1">{{ statusCounts.after_sale }}</div>
          </div>
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background-color: rgba(239, 68, 68, 0.15);">
            <n-icon :size="22" color="#EF4444">
              <AlertCircleSharp />
            </n-icon>
          </div>
        </div>
      </n-card>
    </div>

    <n-card class="!rounded-2xl !border-0" content-style="padding: 0;">
      <n-data-table
        :columns="columns"
        :data="filteredAppointments"
        :pagination="pagination"
        :bordered="false"
        size="medium"
        :row-key="(row) => row.id"
        hover-keyboard
      />
    </n-card>

    <n-modal v-model:show="showAfterSaleModal" preset="card" title="发起售后" style="width: 560px;">
      <div class="space-y-4 mt-2">
        <div>
          <label class="text-sm text-gray-600 mb-1.5 block">售后类型</label>
          <n-select
            v-model:value="afterSaleForm.type"
            :options="[
              { label: '退款', value: 'refund' },
              { label: '换货/重服务', value: 'exchange' },
              { label: '投诉', value: 'complaint' },
            ]"
            placeholder="请选择售后类型"
          />
        </div>
        <div>
          <label class="text-sm text-gray-600 mb-1.5 block">问题原因</label>
          <n-select
            v-model:value="afterSaleForm.reason"
            :options="[
              { label: '服务质量问题', value: '服务质量问题' },
              { label: '宠物受伤/不适', value: '宠物受伤/不适' },
              { label: '服务态度问题', value: '服务态度问题' },
              { label: '收费争议', value: '收费争议' },
              { label: '其他原因', value: '其他原因' },
            ]"
            placeholder="请选择问题原因"
          />
        </div>
        <div>
          <label class="text-sm text-gray-600 mb-1.5 block">详细描述</label>
          <n-input
            v-model:value="afterSaleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请详细描述遇到的问题..."
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showAfterSaleModal = false">取消</n-button>
          <n-button type="primary" @click="submitAfterSale">提交售后</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import { NDropdown } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import {
  AddCircleSharp,
  SearchSharp,
  TimeSharp,
  HeartSharp,
  CheckmarkCircleSharp,
  AlertCircleSharp,
  EyeSharp,
  AlertSharp,
  ChevronDownSharp,
} from '@vicons/ionicons5'
import {
  useAppointmentsStore,
  statusOptions,
  statusLabelMap,
  statusColorMap,
  type Appointment,
  type OrderStatus,
} from '~/stores/appointments'

const appointmentsStore = useAppointmentsStore()
const router = useRouter()
const message = useMessage()

const filterStatus = ref<OrderStatus | null>(null)
const filterDateRange = ref<string[] | null>(null)
const filterKeyword = ref('')
const showAfterSaleModal = ref(false)
const currentOrderId = ref<string | null>(null)
const afterSaleForm = ref({
  type: '' as 'refund' | 'exchange' | 'complaint' | '',
  reason: '',
  description: '',
})

const statusFilterOptions = computed(() =>
  statusOptions.map((s) => ({ label: s.label, value: s.value }))
)

const statusCounts = computed(() => {
  const counts: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    in_service: 0,
    completed: 0,
    cancelled: 0,
    after_sale: 0,
  }
  for (const order of appointmentsStore.appointments) {
    counts[order.status]++
  }
  return counts
})

const filteredAppointments = computed(() => {
  let result = [...appointmentsStore.appointments]

  if (filterStatus.value) {
    result = result.filter((o) => o.status === filterStatus.value)
  }

  if (filterDateRange.value && filterDateRange.value.length === 2) {
    const [start, end] = filterDateRange.value
    result = result.filter((o) => {
      const date = o.appointmentTime.split(' ')[0]
      return date >= start && date <= end
    })
  }

  if (filterKeyword.value) {
    const kw = filterKeyword.value.toLowerCase()
    result = result.filter(
      (o) =>
        o.orderNo.toLowerCase().includes(kw) ||
        o.customer.name.toLowerCase().includes(kw) ||
        o.pet.name.toLowerCase().includes(kw)
    )
  }

  return result
})

const pagination = ref({
  pageSize: 10,
  pageSizes: [10, 20, 50],
  showSizePicker: true,
  showQuickJumper: true,
})

function handleSearch() {}

function handleResetFilter() {
  filterStatus.value = null
  filterDateRange.value = null
  filterKeyword.value = ''
}

function handleViewDetail(row: Appointment) {
  router.push(`/appointments/${row.id}`)
}

function handleOpenAfterSale(row: Appointment) {
  currentOrderId.value = row.id
  afterSaleForm.value = { type: '', reason: '', description: '' }
  showAfterSaleModal.value = true
}

function submitAfterSale() {
  if (!afterSaleForm.value.type || !afterSaleForm.value.reason || !afterSaleForm.value.description) {
    message.warning('请填写完整的售后信息')
    return
  }
  if (!currentOrderId.value) return

  appointmentsStore.createAfterSale({
    orderId: currentOrderId.value,
    type: afterSaleForm.value.type as 'refund' | 'exchange' | 'complaint',
    reason: afterSaleForm.value.reason,
    description: afterSaleForm.value.description,
  })
  message.success('售后已发起')
  showAfterSaleModal.value = false
}

function handleChangeStatus(row: Appointment, status: OrderStatus) {
  appointmentsStore.updateOrderStatus(row.id, status)
  message.success(`状态已更新为「${statusLabelMap[status]}」`)
}

const columns: DataTableColumns<Appointment> = [
  {
    title: '订单号',
    key: 'orderNo',
    width: 160,
    render: (row) =>
      h(
        'span',
        {
          class: 'font-mono text-sm font-medium text-primary cursor-pointer hover:underline',
          onClick: () => handleViewDetail(row),
        },
        row.orderNo
      ),
  },
  {
    title: '客户',
    key: 'customer',
    width: 140,
    render: (row) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h(
          'div',
          {
            class: 'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium',
            style: { backgroundColor: '#1A8A7D' },
          },
          row.customer.name.charAt(0)
        ),
        h('div', [
          h('div', { class: 'text-sm font-medium text-gray-800' }, row.customer.name),
          h('div', { class: 'text-xs text-gray-400' }, row.customer.phone),
        ]),
      ]),
  },
  {
    title: '宠物',
    key: 'pet',
    width: 140,
    render: (row) =>
      h('div', [
        h('div', { class: 'text-sm text-gray-800 font-medium' }, row.pet.name),
        h('div', { class: 'text-xs text-gray-500' }, `${row.pet.breed} · ${row.pet.age}岁`),
      ]),
  },
  {
    title: '服务类型',
    key: 'serviceType',
    width: 100,
    render: (row) =>
      h('div', { class: 'text-sm text-gray-700' }, row.serviceType),
  },
  {
    title: '预约时间',
    key: 'appointmentTime',
    width: 150,
    render: (row) =>
      h('div', { class: 'text-sm text-gray-600' }, row.appointmentTime),
  },
  {
    title: '状态',
    key: 'status',
    width: 110,
    render: (row) =>
      h(
        'span',
        {
          class: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
          style: {
            backgroundColor: statusColorMap[row.status] + '15',
            color: statusColorMap[row.status],
            border: `1px solid ${statusColorMap[row.status]}30`,
          },
        },
        statusLabelMap[row.status]
      ),
  },
  {
    title: '金额',
    key: 'paidAmount',
    width: 100,
    render: (row) =>
      h(
        'span',
        { class: 'text-sm font-semibold text-gray-800' },
        `¥${row.paidAmount}`
      ),
  },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    fixed: 'right',
    render: (row) => {
      const availableStatuses = getAvailableStatuses(row.status)

      return h('div', { class: 'flex items-center gap-2' }, [
        h(
          'span',
          {
            class: 'text-sm text-primary cursor-pointer hover:text-primary-dark mr-2 flex items-center gap-1',
            onClick: () => handleViewDetail(row),
          },
          [
            h('n-icon', { size: 14 }, () => h(EyeSharp)),
            '详情',
          ]
        ),
        row.status !== 'cancelled' &&
          row.status !== 'after_sale' &&
          h(
            'span',
            {
              class: 'text-sm text-red-500 cursor-pointer hover:text-red-600 mr-2 flex items-center gap-1',
              onClick: () => handleOpenAfterSale(row),
            },
            [
              h('n-icon', { size: 14 }, () => h(AlertSharp)),
              '售后',
            ]
          ),
        h(
          NDropdown,
          {
            trigger: 'click',
            options: availableStatuses.map((s) => ({
              label: statusLabelMap[s],
              value: s,
              style: { color: statusColorMap[s] },
            })),
            onSelect: (v: any) => handleChangeStatus(row, v as OrderStatus),
          },
          {
            default: () =>
              h(
                'span',
                {
                  class: 'text-sm text-gray-600 cursor-pointer hover:text-primary flex items-center gap-1',
                },
                [
                  '变更状态',
                  h('n-icon', { size: 12 }, () => h(ChevronDownSharp)),
                ]
              ),
          }
        ),
      ])
    },
  },
]

function getAvailableStatuses(current: OrderStatus): OrderStatus[] {
  switch (current) {
    case 'pending':
      return ['confirmed', 'cancelled']
    case 'confirmed':
      return ['in_service', 'cancelled']
    case 'in_service':
      return ['completed']
    case 'completed':
      return []
    case 'cancelled':
      return []
    case 'after_sale':
      return ['completed']
    default:
      return []
  }
}
</script>

<style scoped>
.appointments-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
