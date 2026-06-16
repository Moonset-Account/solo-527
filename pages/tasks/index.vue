<template>
  <div class="p-6 space-y-6">
    <ErrorToast
      :visible="apiError.errorVisible.value"
      :message="apiError.errorMessage.value"
      :contact-person="apiError.errorContact.value"
      :record-reference="apiError.errorRecordRef.value"
      @close="apiError.hideError"
    />

    <PageHeader title="待办处理" description="处理待办任务及查看处理时间线" />

    <div class="card">
      <FilterBar :filters="filters" :model-value="filterValues" @update:filter="onFilterChange" />
    </div>

    <div class="flex gap-6" style="min-height: 600px;">
      <div class="w-2/5 space-y-3 overflow-y-auto" style="max-height: 80vh;">
        <div
          v-for="task in tasks"
          :key="task.id"
          :class="[
            'card-hover cursor-pointer !p-4',
            selectedTaskId === task.id ? 'ring-2 ring-primary-500 border-primary-300' : ''
          ]"
          @click="selectTask(task)"
        >
          <div class="flex items-center gap-2 mb-2">
            <StatusBadge :status="task.priority.toLowerCase()" type="priority" />
            <span class="text-sm font-medium text-gray-900 truncate flex-1">{{ task.title }}</span>
          </div>
          <div class="flex items-center gap-3 text-xs text-gray-500">
            <span v-if="task.dueDate" class="flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5" />
              {{ formatDate(task.dueDate) }}
            </span>
            <span v-if="task.assignee" class="flex items-center gap-1">
              <User class="w-3.5 h-3.5" />
              {{ task.assignee.name }}
            </span>
            <span v-if="task.vehicle" class="flex items-center gap-1">
              <Car class="w-3.5 h-3.5" />
              {{ task.vehicle.plateNumber }}
            </span>
          </div>
        </div>
        <EmptyState v-if="!tasks.length && !loading" title="暂无任务" description="没有待办任务" />
      </div>

      <div class="w-3/5">
        <div v-if="!selectedTask" class="card flex items-center justify-center" style="min-height: 400px;">
          <div class="text-center text-gray-400">
            <ListTodo class="w-12 h-12 mx-auto mb-3" />
            <p class="text-sm">请选择左侧任务查看详情</p>
          </div>
        </div>

        <div v-else class="space-y-6">
          <div class="card">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h2 class="text-lg font-bold text-gray-900">{{ selectedTask.title }}</h2>
                <p v-if="selectedTask.description" class="mt-1 text-sm text-gray-500">{{ selectedTask.description }}</p>
              </div>
              <div class="flex items-center gap-2">
                <StatusBadge :status="selectedTask.priority.toLowerCase()" type="priority" />
                <StatusBadge :status="normalizeStatus(selectedTask.status)" type="task" />
              </div>
            </div>
            <div class="flex items-center gap-4 text-sm text-gray-600">
              <span v-if="selectedTask.assignee" class="flex items-center gap-1">
                <User class="w-4 h-4" />
                {{ selectedTask.assignee.name }}
              </span>
              <span v-if="selectedTask.dueDate" class="flex items-center gap-1">
                <Calendar class="w-4 h-4" />
                截止: {{ formatDateTime(selectedTask.dueDate) }}
              </span>
            </div>

            <div v-if="selectedTask.vehicle || selectedTask.appointment" class="mt-4 flex flex-wrap gap-3">
              <LinkedResourceCard
                v-if="selectedTask.vehicle"
                type="vehicle"
                :data="{ plateNumber: selectedTask.vehicle.plateNumber, brand: selectedTask.vehicle.brand, status: '' }"
              />
              <LinkedResourceCard
                v-if="selectedTask.appointment"
                type="template"
                :data="{ name: selectedTask.appointment.customerName, category: selectedTask.appointment.serviceType, status: selectedTask.appointment.status }"
              />
            </div>
          </div>

          <div class="card">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">处理时间线</h3>
            <div v-if="timeline.length" class="relative pl-8 space-y-6">
              <div class="timeline-line" />
              <div v-for="(log, idx) in timeline" :key="log.id" class="relative">
                <div class="timeline-dot" />
                <div class="pb-2">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-medium text-gray-900">{{ log.action }}</span>
                    <span class="text-xs text-gray-400">{{ formatDateTime(log.createdAt) }}</span>
                  </div>
                  <div class="text-xs text-gray-500 mb-1">操作人: {{ log.operator?.name ?? '-' }}</div>
                  <p v-if="log.notes" class="text-xs text-gray-600 bg-gray-50 rounded px-2 py-1 mb-2">{{ log.notes }}</p>
                  <div v-if="log.linkedTemplate || log.linkedPayment || log.linkedVehicle" class="flex flex-wrap gap-2 mt-2">
                    <LinkedResourceCard
                      v-if="log.linkedTemplate"
                      type="template"
                      :data="{ name: log.linkedTemplate.name, category: log.linkedTemplate.category, status: 'active' }"
                    />
                    <LinkedResourceCard
                      v-if="log.linkedPayment"
                      type="payment"
                      :data="{ orderNo: log.linkedPayment.id.slice(0,8).toUpperCase(), amount: Number(log.linkedPayment.amount), status: log.linkedPayment.status }"
                    />
                    <LinkedResourceCard
                      v-if="log.linkedVehicle"
                      type="vehicle"
                      :data="{ plateNumber: log.linkedVehicle.plateNumber, brand: log.linkedVehicle.brand, status: '' }"
                    />
                  </div>
                </div>
              </div>
            </div>
            <EmptyState v-else title="暂无处理记录" description="该任务还没有处理记录" />
          </div>

          <div class="card">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">处理操作</h3>
            <div class="space-y-4">
              <div>
                <label class="label">操作</label>
                <input v-model="processForm.action" type="text" class="input" placeholder="输入操作，如: 开始处理、完成、试驾改期" />
                <p v-if="processForm.action === '试驾改期'" class="mt-1 text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle class="w-3.5 h-3.5" />
                  此操作将同步至配件周转报表
                </p>
              </div>
              <div>
                <label class="label">备注</label>
                <textarea v-model="processForm.notes" class="input" rows="3" placeholder="可选备注" />
              </div>
              <div>
                <label class="label">关联资源</label>
                <div class="grid grid-cols-3 gap-3">
                  <select v-model="processForm.linkedTemplateId" class="select">
                    <option value="">关联模板</option>
                    <option v-for="tpl in templates" :key="tpl.id" :value="tpl.id">{{ tpl.name }}</option>
                  </select>
                  <select v-model="processForm.linkedPaymentId" class="select">
                    <option value="">关联支付</option>
                    <option v-for="pay in paidPayments" :key="pay.id" :value="pay.id">{{ pay.id.slice(0,8).toUpperCase() }} ¥{{ Number(pay.amount).toFixed(0) }}</option>
                  </select>
                  <select v-model="processForm.linkedVehicleId" class="select">
                    <option value="">关联车辆</option>
                    <option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.plateNumber }}</option>
                  </select>
                </div>
              </div>
              <button
                class="btn-primary"
                :disabled="!processForm.action || submitting"
                @click="submitProcess"
              >
                {{ submitting ? '提交中...' : '提交操作' }}
              </button>
            </div>
          </div>
        </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Calendar, User, Car, ListTodo, AlertTriangle } from 'lucide-vue-next'

const apiError = useApiError()

interface TaskItem {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  assigneeId: string
  vehicleId: string | null
  appointmentId: string | null
  createdAt: string
  assignee?: { name: string }
  vehicle?: { plateNumber: string; brand?: string }
  appointment?: { customerName: string; serviceType: string; status: string }
}

interface TimelineLog {
  id: string
  action: string
  notes: string | null
  createdAt: string
  operatorId: string
  linkedTemplateId: string | null
  linkedPaymentId: string | null
  linkedVehicleId: string | null
  operator?: { name: string }
  linkedTemplate?: { name: string; category: string | null } | null
  linkedPayment?: { id: string; amount: number | string; status: string } | null
  linkedVehicle?: { plateNumber: string; brand?: string } | null
}

const normalizeStatus = (status: string) => status.toLowerCase().replace(/_/g, '-')

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

const tasks = ref<TaskItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const selectedTaskId = ref<string | null>(null)
const selectedTask = ref<TaskItem | null>(null)
const timeline = ref<TimelineLog[]>([])
const submitting = ref(false)
const templates = ref<{ id: string; name: string }[]>([])
const paidPayments = ref<{ id: string; amount: number | string }[]>([])
const vehicles = ref<{ id: string; plateNumber: string }[]>([])
const users = ref<{ id: string; name: string }[]>([])

const processForm = ref({
  action: '',
  notes: '',
  linkedTemplateId: '',
  linkedPaymentId: '',
  linkedVehicleId: '',
})

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
      { value: 'PENDING', label: '待处理' },
      { value: 'IN_PROGRESS', label: '处理中' },
      { value: 'COMPLETED', label: '已完成' },
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

async function fetchTasks() {
  loading.value = true
  const query: Record<string, string | number> = { page: page.value, pageSize }
  if (filterValues.value.status) query.status = filterValues.value.status
  if (filterValues.value.dateFrom) query.dateFrom = filterValues.value.dateFrom
  if (filterValues.value.dateTo) query.dateTo = filterValues.value.dateTo
  if (filterValues.value.assigneeId) query.assigneeId = filterValues.value.assigneeId

  try {
    const res = await $fetch('/api/tasks', { query })
    if ((res as any)?.success) {
      tasks.value = (res as any).data.items
      total.value = (res as any).data.total
    }
  } catch (error) {
    apiError.showError(error, '获取待办列表失败')
  }
  loading.value = false
}

async function selectTask(task: TaskItem) {
  selectedTaskId.value = task.id
  selectedTask.value = task
  await fetchTimeline(task.id)
}

async function fetchTimeline(taskId: string) {
  try {
    const res = await $fetch(`/api/tasks/${taskId}/timeline`)
    if ((res as any)?.success) {
      timeline.value = (res as any).data
    }
  } catch (error) {
    apiError.showError(error, '获取待办时间线失败')
  }
}

async function submitProcess() {
  if (!selectedTaskId.value || !processForm.value.action) return
  submitting.value = true
  try {
    const body: Record<string, string> = {
      action: processForm.value.action,
      operatorId: selectedTask.value?.assigneeId ?? '',
    }
    if (processForm.value.notes) body.notes = processForm.value.notes
    if (processForm.value.linkedTemplateId) body.linkedTemplateId = processForm.value.linkedTemplateId
    if (processForm.value.linkedPaymentId) body.linkedPaymentId = processForm.value.linkedPaymentId
    if (processForm.value.linkedVehicleId) body.linkedVehicleId = processForm.value.linkedVehicleId

    const res = await $fetch(`/api/tasks/${selectedTaskId.value}/process`, {
      method: 'POST',
      body,
    })
    if ((res as any)?.success) {
      processForm.value = { action: '', notes: '', linkedTemplateId: '', linkedPaymentId: '', linkedVehicleId: '' }
      await fetchTimeline(selectedTaskId.value)
      await fetchTasks()
    }
  } catch (error) {
    apiError.showError(error, '处理待办失败')
  } finally {
    submitting.value = false
  }
}

watch([filterValues, page], fetchTasks, { deep: true })

onMounted(async () => {
  try {
    const [usersRes, templatesRes, paymentsRes, vehiclesRes] = await Promise.all([
      $fetch('/api/users'),
      $fetch('/api/templates'),
      $fetch('/api/payments', { query: { status: 'PAID', pageSize: 100 } }),
      $fetch('/api/vehicles'),
    ])
    if ((usersRes as any)?.success) users.value = (usersRes as any).data
    if ((templatesRes as any)?.success) templates.value = (templatesRes as any).data
    if ((paymentsRes as any)?.success) paidPayments.value = (paymentsRes as any).data.items ?? (paymentsRes as any).data
    if ((vehiclesRes as any)?.success) vehicles.value = (vehiclesRes as any).data
  } catch (error) {
    apiError.showError(error, '加载基础数据失败')
  }
  await fetchTasks()
})
</script>
