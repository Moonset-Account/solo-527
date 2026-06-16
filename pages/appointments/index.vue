<template>
  <div class="p-6 space-y-6">
    <PageHeader title="预约管理" description="管理所有客户预约">
      <button class="btn-primary" @click="showForm = true">
        <Plus class="w-4 h-4 mr-1" />
        新建预约
      </button>
    </PageHeader>

    <div class="card">
      <FilterBar :filters="filters" :model-value="filterValues" @update:filter="onFilterChange" />
    </div>

    <div class="card overflow-hidden !p-0">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-500">客户姓名</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">联系电话</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">车牌号</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">服务类型</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">状态</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">预约时间</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">负责人</th>
            <th class="text-left px-4 py-3 font-medium text-gray-500">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="apt in appointments" :key="apt.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-gray-900">{{ apt.customerName }}</td>
            <td class="px-4 py-3 text-gray-700">{{ apt.customerPhone ?? '-' }}</td>
            <td class="px-4 py-3 text-gray-700">{{ apt.vehicle?.plateNumber ?? '-' }}</td>
            <td class="px-4 py-3 text-gray-700">{{ serviceTypeMap[apt.serviceType] ?? apt.serviceType }}</td>
            <td class="px-4 py-3">
              <StatusBadge :status="normalizeStatus(apt.status)" type="appointment" />
            </td>
            <td class="px-4 py-3 text-gray-500">{{ formatDateTime(apt.scheduledAt) }}</td>
            <td class="px-4 py-3 text-gray-700">{{ apt.assignee?.name ?? '-' }}</td>
            <td class="px-4 py-3">
              <button class="btn-secondary !px-2.5 !py-1 text-xs" @click="openDetail(apt.id)">
                详情
              </button>
            </td>
          </tr>
          <tr v-if="!appointments.length && !loading">
            <td colspan="8">
              <EmptyState title="暂无预约" description="还没有预约记录" />
            </td>
          </tr>
        </tbody>
      </table>
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

    <AppointmentForm
      :visible="showForm"
      :vehicles="vehicles"
      :users="users"
      @close="showForm = false"
      @saved="onFormSaved"
    />

    <Teleport to="body">
      <div v-if="detailOpen" class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/30" @click="detailOpen = false" />
        <div class="relative w-full max-w-lg bg-white shadow-xl overflow-y-auto">
          <div class="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">预约详情</h3>
            <button class="p-1 hover:bg-gray-100 rounded" @click="detailOpen = false">
              <X class="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div v-if="detailData" class="p-6 space-y-6">
            <div class="space-y-4">
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-20">客户姓名</span>
                <span class="text-sm text-gray-900">{{ detailData.customerName }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-20">联系电话</span>
                <span class="text-sm text-gray-900">{{ detailData.customerPhone ?? '-' }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-20">服务类型</span>
                <span class="text-sm text-gray-900">{{ serviceTypeMap[detailData.serviceType] ?? detailData.serviceType }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-20">状态</span>
                <StatusBadge :status="normalizeStatus(detailData.status)" type="appointment" />
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-20">预约时间</span>
                <span class="text-sm text-gray-900">{{ formatDateTime(detailData.scheduledAt) }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-20">负责人</span>
                <span class="text-sm text-gray-900">{{ detailData.assignee?.name ?? '-' }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-20">车牌号</span>
                <span class="text-sm text-gray-900">{{ detailData.vehicle?.plateNumber ?? '-' }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-gray-500 w-20">备注</span>
                <span class="text-sm text-gray-900">{{ detailData.notes ?? '-' }}</span>
              </div>
            </div>
            <div class="flex gap-3">
              <NuxtLink :to="`/appointments/${detailData.id}`" class="btn-primary">
                查看完整详情
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Plus, X } from 'lucide-vue-next'

interface AppointmentItem {
  id: string
  customerName: string
  customerPhone: string | null
  serviceType: string
  status: string
  scheduledAt: string
  notes: string | null
  vehicle?: { plateNumber: string }
  assignee?: { name: string }
}

interface VehicleItem {
  id: string
  plateNumber: string
}

interface UserItem {
  id: string
  name: string
}

const serviceTypeMap: Record<string, string> = {
  WASH: '洗车',
  MAINTENANCE: '保养',
  TEST_DRIVE: '试驾',
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

const appointments = ref<AppointmentItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const showForm = ref(false)
const detailOpen = ref(false)
const detailData = ref<AppointmentItem | null>(null)
const vehicles = ref<VehicleItem[]>([])
const users = ref<UserItem[]>([])

const filterValues = ref<Record<string, string>>({
  status: '',
  dateFrom: '',
  dateTo: '',
  assigneeId: '',
})

const filters = computed(() => [
  {
    key: 'status',
    label: '状态',
    type: 'select' as const,
    options: [
      { value: 'PENDING', label: '待确认' },
      { value: 'CONFIRMED', label: '已确认' },
      { value: 'IN_PROGRESS', label: '进行中' },
      { value: 'COMPLETED', label: '已完成' },
      { value: 'CANCELLED', label: '已取消' },
    ],
  },
  { key: 'dateFrom', label: '开始日期', type: 'date' as const },
  { key: 'dateTo', label: '结束日期', type: 'date' as const },
  {
    key: 'assigneeId',
    label: '负责人',
    type: 'select' as const,
    options: users.value.map((u) => ({ value: u.id, label: u.name })),
  },
])

const totalPages = computed(() => Math.ceil(total.value / pageSize))

function onFilterChange({ key, value }: { key: string; value: string }) {
  filterValues.value[key] = value
  page.value = 1
}

async function fetchAppointments() {
  loading.value = true
  const query: Record<string, string | number> = { page: page.value, pageSize }
  if (filterValues.value.status) query.status = filterValues.value.status
  if (filterValues.value.dateFrom) query.dateFrom = filterValues.value.dateFrom
  if (filterValues.value.dateTo) query.dateTo = filterValues.value.dateTo
  if (filterValues.value.assigneeId) query.assigneeId = filterValues.value.assigneeId

  const res = await useFetch('/api/appointments', { query })
  if (res.data.value?.success) {
    appointments.value = res.data.value.data.items
    total.value = res.data.value.data.total
  }
  loading.value = false
}

async function openDetail(id: string) {
  const res = await useFetch(`/api/appointments/${id}`)
  if (res.data.value?.success) {
    detailData.value = res.data.value.data
    detailOpen.value = true
  }
}

async function onFormSaved() {
  showForm.value = false
  await fetchAppointments()
}

watch([filterValues, page], fetchAppointments, { deep: true })

onMounted(async () => {
  const [vehiclesRes, usersRes] = await Promise.all([
    useFetch('/api/vehicles'),
    useFetch('/api/users'),
  ])
  if (vehiclesRes.data.value?.success) vehicles.value = vehiclesRes.data.value.data
  if (usersRes.data.value?.success) users.value = usersRes.data.value.data
  await fetchAppointments()
})
</script>
