<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">整改管理</h2>
      <n-space>
        <n-button type="primary" @click="showCreateModal = true">
          下发整改
        </n-button>
      </n-space>
    </div>

    <div class="card">
      <div class="filter-bar">
        <n-select
          v-model:value="filters.status"
          placeholder="整改状态"
          clearable
          :options="statusOptions"
          style="width: 150px"
        />
        <n-button type="primary" @click="loadRectifications">查询</n-button>
        <n-button @click="resetFilters">重置</n-button>
      </div>

      <n-data-table
        :columns="columns"
        :data="rectifications"
        :loading="loading"
        :pagination="{
          page: page,
          pageSize: 10,
          itemCount: total,
          onChange: (p: number) => { page = p; loadRectifications() }
        }"
      />
    </div>

    <n-modal v-model:show="showCreateModal" preset="card" title="下发整改任务" style="width: 600px">
      <n-form :model="rectForm" :rules="rectRules" label-width="100px">
        <n-form-item label="关联巡店" path="inspection_id">
          <n-select v-model:value="rectForm.inspection_id" :options="inspectionOptions" placeholder="请选择关联的巡店任务" />
        </n-form-item>
        <n-form-item label="整改负责人" path="assignee_id">
          <n-select v-model:value="rectForm.assignee_id" :options="userOptions" placeholder="请选择整改负责人" />
        </n-form-item>
        <n-form-item label="整改标题" path="title">
          <n-input v-model:value="rectForm.title" placeholder="请输入整改标题" />
        </n-form-item>
        <n-form-item label="问题描述" path="description">
          <n-input v-model:value="rectForm.description" type="textarea" :rows="2" placeholder="请描述问题" />
        </n-form-item>
        <n-form-item label="整改要求" path="requirement">
          <n-input v-model:value="rectForm.requirement" type="textarea" :rows="3" placeholder="请描述整改要求" />
        </n-form-item>
        <n-form-item label="截止日期" path="deadline">
          <n-date-picker v-model:value="rectForm.deadline" type="datetime" placeholder="选择截止日期" style="width: 100%" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="submitCreateRectification">下发</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showDetailModal" preset="card" title="整改详情" style="width: 650px">
      <div v-if="selectedRectification">
        <n-descriptions :column="2" bordered>
          <n-descriptions-item label="整改编号">{{ selectedRectification.rectification_no }}</n-descriptions-item>
          <n-descriptions-item label="状态">
            <span :class="`status-tag status-${getStatusClass(selectedRectification.status)}`">{{ getStatusLabel(selectedRectification.status) }}</span>
          </n-descriptions-item>
          <n-descriptions-item label="关联巡店">{{ selectedRectification.inspection?.task_no || '-' }}</n-descriptions-item>
          <n-descriptions-item label="负责人">{{ selectedRectification.assignee?.full_name || '-' }}</n-descriptions-item>
          <n-descriptions-item label="督导">{{ selectedRectification.supervisor?.full_name || '-' }}</n-descriptions-item>
          <n-descriptions-item label="截止日期">{{ selectedRectification.deadline ? dayjs(selectedRectification.deadline).format('YYYY-MM-DD HH:mm') : '-' }}</n-descriptions-item>
          <n-descriptions-item label="完成时间">{{ selectedRectification.completed_at ? dayjs(selectedRectification.completed_at).format('YYYY-MM-DD HH:mm') : '-' }}</n-descriptions-item>
          <n-descriptions-item label="复查时间">{{ selectedRectification.re_inspected_at ? dayjs(selectedRectification.re_inspected_at).format('YYYY-MM-DD HH:mm') : '-' }}</n-descriptions-item>
          <n-descriptions-item label="整改标题" :span="2">{{ selectedRectification.title }}</n-descriptions-item>
          <n-descriptions-item label="问题描述" :span="2">{{ selectedRectification.description || '-' }}</n-descriptions-item>
          <n-descriptions-item label="整改要求" :span="2">{{ selectedRectification.requirement || '-' }}</n-descriptions-item>
          <n-descriptions-item label="整改结果" :span="2">{{ selectedRectification.rectification_result || '-' }}</n-descriptions-item>
          <n-descriptions-item label="复查结果" :span="2">{{ selectedRectification.re_inspection_result || '-' }}</n-descriptions-item>
        </n-descriptions>

        <n-divider v-if="selectedRectification.status === 'pending' || selectedRectification.status === 'in_progress'">处理</n-divider>
        <div v-if="selectedRectification.status === 'pending' && canProcess" style="margin-top: 20px">
          <n-button type="primary" :loading="submitting" @click="submitStartRectification">
            开始整改
          </n-button>
        </div>
        <div v-if="selectedRectification.status === 'in_progress' && canProcess" style="margin-top: 20px">
          <h4>提交整改结果</h4>
          <n-form label-width="100px">
            <n-form-item label="整改结果" required>
              <n-input v-model:value="submitForm.result" type="textarea" :rows="4" placeholder="请详细描述整改结果" />
            </n-form-item>
            <n-button type="primary" :loading="submitting" @click="submitSubmitRectification">
              提交整改
            </n-button>
          </n-form>
        </div>

        <n-divider v-if="selectedRectification.status === 'completed' && isSupervisor()">复查</n-divider>
        <div v-if="selectedRectification.status === 'completed' && isSupervisor()" style="margin-top: 20px">
          <h4>复查</h4>
          <n-form label-width="100px">
            <n-form-item label="复查结果" required>
              <n-radio-group v-model:value="reinspectForm.is_pass">
                <n-radio :value="true">整改合格</n-radio>
                <n-radio :value="false">整改不合格，需重新整改</n-radio>
              </n-radio-group>
            </n-form-item>
            <n-form-item label="复查意见" required>
              <n-input v-model:value="reinspectForm.result" type="textarea" :rows="3" placeholder="请输入复查意见" />
            </n-form-item>
            <n-button type="primary" :loading="submitting" @click="submitReinspectRectification">
              确认复查
            </n-button>
          </n-form>
        </div>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showDetailModal = false">关闭</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, h } from 'vue'
import { useMessage } from 'naive-ui'
import dayjs from 'dayjs'

const message = useMessage()
const { getRectifications, createRectification, startRectification: apiStart, submitRectification: apiSubmit, reinspectRectification: apiReinspect } = useRectificationApi()
const { getInspections } = useInspectionApi()
const { getUsers } = useMasterApi()
const { getUser, isSupervisor, isStoreManager, isBaker } = useAuth()

const loading = ref(false)
const submitting = ref(false)
const page = ref(1)
const total = ref(0)
const rectifications = ref<RectificationTask[]>([])
const inspections = ref<InspectionTask[]>([])
const users = ref<User[]>([])
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const selectedRectification = ref<RectificationTask | null>(null)
const canProcess = ref(false)

const filters = reactive({
  status: null as string | null
})

const rectForm = reactive({
  inspection_id: null as number | null,
  assignee_id: null as number | null,
  title: '',
  description: '',
  requirement: '',
  deadline: null as any
})

const submitForm = reactive({
  result: ''
})

const reinspectForm = reactive({
  result: '',
  is_pass: true
})

const rectRules = {
  inspection_id: [{ required: true, message: '请选择关联巡店', trigger: 'change' }],
  assignee_id: [{ required: true, message: '请选择负责人', trigger: 'change' }],
  title: [{ required: true, message: '请输入整改标题', trigger: 'blur' }],
  requirement: [{ required: true, message: '请输入整改要求', trigger: 'blur' }],
  deadline: [{ required: true, message: '请选择截止日期', trigger: 'change' }]
}

const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成待复查', value: 'completed' },
  { label: '已复查通过', value: 're_inspected' },
  { label: '已驳回', value: 'rejected' }
]

const inspectionOptions = computed(() => inspections.value.map(i => ({ label: `${i.task_no} - ${i.title}`, value: i.id })))
const userOptions = computed(() => users.value.filter(u => ['store_manager', 'baker', 'cashier'].includes(u.role)).map(u => ({ label: u.full_name, value: u.id })))

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理', in_progress: '进行中', completed: '已完成待复查',
    rejected: '已驳回', re_inspected: '已复查通过'
  }
  return map[status] || status
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning', in_progress: 'info', completed: 'warning',
    rejected: 'error', re_inspected: 'success'
  }
  return map[status] || 'default'
}

const columns = [
  { title: '整改编号', key: 'rectification_no', width: 140 },
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  { title: '负责人', key: 'assignee', render: (row: any) => row.assignee?.full_name || '-' },
  { title: '截止日期', key: 'deadline', width: 160, render: (row: any) => row.deadline ? dayjs(row.deadline).format('YYYY-MM-DD HH:mm') : '-' },
  { title: '状态', key: 'status', width: 120, render: (row: any) => h('span', { class: `status-tag status-${getStatusClass(row.status)}` }, getStatusLabel(row.status)) },
  { title: '创建时间', key: 'created_at', width: 160, render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm') },
  {
    title: '操作', key: 'actions', width: 120, render: (row: any) => h('div', { class: 'table-actions' }, [
      h('n-button', { size: 'small', type: 'primary', onClick: () => viewDetail(row) }, () => '详情')
    ])
  }
]

const loadData = async () => {
  loading.value = true
  try {
    const [insList, userList] = await Promise.all([
      getInspections({ status: 'completed' }),
      getUsers()
    ])
    inspections.value = insList
    users.value = userList
  } finally {
    loading.value = false
  }
}

const loadRectifications = async () => {
  loading.value = true
  try {
    const params: any = { skip: (page.value - 1) * 10, limit: 10 }
    if (filters.status) params.status = filters.status
    const data = await getRectifications(params)
    rectifications.value = data
    total.value = data.length
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.status = null
  page.value = 1
  loadRectifications()
}

const createRectification = async () => {
  try {
    submitting.value = true
    const user = getUser()
    await createRectification({
      ...rectForm,
      supervisor_id: user?.id
    })
    message.success('整改任务已下发')
    showCreateModal.value = false
    Object.assign(rectForm, { inspection_id: null, assignee_id: null, title: '', description: '', requirement: '', deadline: null })
    loadRectifications()
  } catch (e: any) {
    message.error(e.data?.detail || '下发失败')
  } finally {
    submitting.value = false
  }
}

const viewDetail = (rect: RectificationTask) => {
  selectedRectification.value = rect
  const user = getUser()
  canProcess.value = (user?.id === rect.assignee_id) || isStoreManager() || isSupervisor()
  submitForm.result = ''
  reinspectForm.result = ''
  reinspectForm.is_pass = true
  showDetailModal.value = true
}

const submitStartRectification = async () => {
  if (!selectedRectification.value) return
  try {
    submitting.value = true
    selectedRectification.value = await apiStartRectification(selectedRectification.value.id)
    message.success('已开始整改')
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  } finally {
    submitting.value = false
  }
}

const submitRectification = async () => {
  if (!selectedRectification.value || !submitForm.result) return
  try {
    submitting.value = true
    selectedRectification.value = await apiSubmit(selectedRectification.value.id, submitForm.result)
    message.success('整改已提交，等待复查')
    showDetailModal.value = false
    loadRectifications()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  } finally {
    submitting.value = false
  }
}

const submitReinspectRectification = async () => {
  if (!selectedRectification.value || !reinspectForm.result) return
  try {
    submitting.value = true
    selectedRectification.value = await apiReinspectRectification(selectedRectification.value.id, reinspectForm.result, reinspectForm.is_pass)
    message.success(reinspectForm.is_pass ? '复查通过' : '已驳回，需重新整改')
    showDetailModal.value = false
    loadRectifications()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
  loadRectifications()
})
</script>
