<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">巡店任务管理</h2>
      <n-space>
        <n-button type="primary" @click="showCreateModal = true">
          新建巡店任务
        </n-button>
      </n-space>
    </div>

    <div class="card">
      <div class="filter-bar">
        <n-select
          v-model:value="filters.status"
          placeholder="任务状态"
          clearable
          :options="statusOptions"
          style="width: 150px"
        />
        <n-date-picker
          v-model:value="filters.date_range"
          type="daterange"
          placeholder="计划日期"
          style="width: 260px"
        />
        <n-button type="primary" @click="loadInspections">查询</n-button>
        <n-button @click="resetFilters">重置</n-button>
      </div>

      <n-data-table
        :columns="columns"
        :data="inspections"
        :loading="loading"
        :pagination="{
          page: page,
          pageSize: 10,
          itemCount: total,
          onChange: (p: number) => { page = p; loadInspections() }
        }"
      />
    </div>

    <n-modal v-model:show="showCreateModal" preset="card" title="新建巡店任务" style="width: 650px">
      <n-form :model="inspectionForm" :rules="inspectionRules" label-width="100px">
        <n-form-item label="门店" path="store_id">
          <n-select v-model:value="inspectionForm.store_id" :options="storeOptions" placeholder="请选择门店" />
        </n-form-item>
        <n-form-item label="店长" path="store_manager_id">
          <n-select v-model:value="inspectionForm.store_manager_id" :options="managerOptions" placeholder="请选择店长" />
        </n-form-item>
        <n-form-item label="任务标题" path="title">
          <n-input v-model:value="inspectionForm.title" placeholder="请输入任务标题" />
        </n-form-item>
        <n-form-item label="任务描述" path="description">
          <n-input v-model:value="inspectionForm.description" type="textarea" :rows="2" placeholder="请输入任务描述" />
        </n-form-item>
        <n-form-item label="计划日期" path="scheduled_date">
          <n-date-picker v-model:value="inspectionForm.scheduled_date" type="date" placeholder="选择计划日期" style="width: 100%" />
        </n-form-item>
        <n-form-item label="检查项">
          <n-space vertical style="width: 100%">
            <div v-for="(item, idx) in checkItems" :key="idx" style="display: flex; gap: 10px; align-items: center">
              <n-input v-model:value="item.name" placeholder="检查项名称" style="flex: 1" />
              <n-select v-model:value="item.category" :options="categoryOptions" placeholder="分类" style="width: 120px" />
              <n-button type="error" quaternary circle @click="removeCheckItem(idx)">
                <template #icon>
                  <n-icon><close-outline /></n-icon>
                </template>
              </n-button>
            </div>
            <n-button type="primary" quaternary @click="addCheckItem">+ 添加检查项</n-button>
          </n-space>
        </n-form-item>
        <n-form-item label="备注" path="remark">
          <n-input v-model:value="inspectionForm.remark" type="textarea" :rows="2" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="createInspection">创建</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showDetailModal" preset="card" title="巡店详情" style="width: 700px">
      <div v-if="selectedInspection">
        <n-descriptions :column="2" bordered>
          <n-descriptions-item label="任务编号">{{ selectedInspection.task_no }}</n-descriptions-item>
          <n-descriptions-item label="状态">
            <span :class="`status-tag status-${getStatusClass(selectedInspection.status)}`">{{ getStatusLabel(selectedInspection.status) }}</span>
          </n-descriptions-item>
          <n-descriptions-item label="门店">{{ selectedInspection.store?.name || '-' }}</n-descriptions-item>
          <n-descriptions-item label="督导">{{ selectedInspection.supervisor?.full_name || '-' }}</n-descriptions-item>
          <n-descriptions-item label="计划日期">{{ selectedInspection.scheduled_date || '-' }}</n-descriptions-item>
          <n-descriptions-item label="得分">{{ selectedInspection.score ?? '-' }}</n-descriptions-item>
          <n-descriptions-item label="开始时间">{{ selectedInspection.actual_start ? dayjs(selectedInspection.actual_start).format('YYYY-MM-DD HH:mm') : '-' }}</n-descriptions-item>
          <n-descriptions-item label="结束时间">{{ selectedInspection.actual_end ? dayjs(selectedInspection.actual_end).format('YYYY-MM-DD HH:mm') : '-' }}</n-descriptions-item>
          <n-descriptions-item label="任务描述" :span="2">{{ selectedInspection.description || '-' }}</n-descriptions-item>
          <n-descriptions-item label="备注" :span="2">{{ selectedInspection.remark || '-' }}</n-descriptions-item>
        </n-descriptions>

        <n-divider>检查项</n-divider>
        <n-data-table
          :columns="checkColumns"
          :data="checkRecords"
          :pagination="false"
          size="small"
        />

        <n-divider v-if="checkRecords.length === 0">开始巡店</n-divider>
        <div v-if="selectedInspection.status === 'in_progress'" style="margin-top: 20px">
          <h4>添加检查记录</h4>
          <n-form :model="checkForm" label-width="100px">
            <n-form-item label="检查项">
              <n-select v-model:value="checkForm.check_item" :options="availableCheckItems" placeholder="选择检查项" />
            </n-form-item>
            <n-form-item label="是否通过">
              <n-radio-group v-model:value="checkForm.is_pass">
                <n-radio :value="true">通过</n-radio>
                <n-radio :value="false">不通过</n-radio>
              </n-radio-group>
            </n-form-item>
            <n-form-item label="备注">
              <n-input v-model:value="checkForm.remark" type="textarea" :rows="2" />
            </n-form-item>
            <n-space>
              <n-button type="primary" :loading="checkSubmitting" @click="addCheckRecord">添加记录</n-button>
            </n-space>
          </n-form>
        </div>

        <n-divider v-if="selectedInspection.status === 'in_progress'">完成巡店</n-divider>
        <div v-if="selectedInspection.status === 'in_progress'" style="margin-top: 20px">
          <n-form label-width="100px">
            <n-form-item label="本次得分">
              <n-input-number v-model:value="completeForm.score" :min="0" :max="100" style="width: 100%" />
            </n-form-item>
            <n-form-item label="总结备注">
              <n-input v-model:value="completeForm.remark" type="textarea" :rows="2" />
            </n-form-item>
            <n-space>
              <n-button type="primary" :loading="submitting" @click="completeInspection">完成巡店</n-button>
            </n-space>
          </n-form>
        </div>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showDetailModal = false">关闭</n-button>
          <n-button v-if="selectedInspection?.status === 'pending'" type="primary" :loading="submitting" @click="startInspection">
            开始巡店
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, h } from 'vue'
import { useMessage } from 'naive-ui'
import { CloseOutline } from '@vicons/ionicons5'
import dayjs from 'dayjs'

const message = useMessage()
const { getInspections, createInspection, startInspection: apiStart, completeInspection: apiComplete, addCheckRecord, getCheckRecords } = useInspectionApi()
const { getStores, getUsers } = useMasterApi()
const { getUser, isSupervisor } = useAuth()

const loading = ref(false)
const submitting = ref(false)
const checkSubmitting = ref(false)
const page = ref(1)
const total = ref(0)
const inspections = ref<InspectionTask[]>([])
const stores = ref<Store[]>([])
const managers = ref<User[]>([])
const checkRecords = ref<any[]>([])
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const selectedInspection = ref<InspectionTask | null>(null)

const filters = reactive({
  status: null as string | null,
  date_range: null as any
})

const inspectionForm = reactive({
  store_id: null as number | null,
  store_manager_id: null as number | null,
  title: '',
  description: '',
  scheduled_date: null as any,
  remark: ''
})

const checkItems = ref<{ name: string; category: string }[]>([
  { name: '卫生状况', category: '环境' },
  { name: '食材存储', category: '食品安全' },
  { name: '操作规范', category: '生产' },
  { name: '产品质量', category: '品质' },
  { name: '服务态度', category: '服务' }
])

const checkForm = reactive({
  check_item: '',
  category: '',
  is_pass: true,
  remark: ''
})

const completeForm = reactive({
  score: null as number | null,
  remark: ''
})

const inspectionRules = {
  store_id: [{ required: true, message: '请选择门店', trigger: 'change' }],
  title: [{ required: true, message: '请输入任务标题', trigger: 'blur' }],
  scheduled_date: [{ required: true, message: '请选择计划日期', trigger: 'change' }]
}

const statusOptions = [
  { label: '待开始', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '需复查', value: 'needs_review' }
]

const categoryOptions = [
  { label: '环境', value: '环境' },
  { label: '食品安全', value: '食品安全' },
  { label: '生产', value: '生产' },
  { label: '品质', value: '品质' },
  { label: '服务', value: '服务' },
  { label: '其他', value: '其他' }
]

const storeOptions = computed(() => stores.value.map(s => ({ label: s.name, value: s.id })))
const managerOptions = computed(() => managers.value.filter(u => u.role === 'store_manager').map(u => ({ label: u.full_name, value: u.id })))

const availableCheckItems = computed(() => {
  if (!selectedInspection.value?.check_items) return []
  const existing = checkRecords.value.map(r => r.check_item)
  return (selectedInspection.value.check_items as any[])
    .filter((item: any) => !existing.includes(item.name))
    .map((item: any) => ({ label: item.name, value: item.name }))
})

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = { pending: '待开始', in_progress: '进行中', completed: '已完成', needs_review: '需复查' }
  return map[status] || status
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = { pending: 'info', in_progress: 'warning', completed: 'success', needs_review: 'error' }
  return map[status] || 'default'
}

const checkColumns = [
  { title: '检查项', key: 'check_item' },
  { title: '分类', key: 'category' },
  { title: '是否通过', key: 'is_pass', render: (row: any) => h('n-tag', { type: row.is_pass ? 'success' : 'error' }, () => row.is_pass ? '通过' : '不通过') },
  { title: '备注', key: 'remark' }
]

const columns = [
  { title: '任务编号', key: 'task_no', width: 140 },
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  { title: '门店', key: 'store_name', width: 120 },
  { title: '计划日期', key: 'scheduled_date', width: 120 },
  { title: '得分', key: 'score', width: 80 },
  { title: '状态', key: 'status', width: 100, render: (row: any) => h('span', { class: `status-tag status-${getStatusClass(row.status)}` }, getStatusLabel(row.status)) },
  { title: '创建时间', key: 'created_at', width: 160, render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm') },
  {
    title: '操作', key: 'actions', width: 150, render: (row: any) => h('div', { class: 'table-actions' }, [
      isSupervisor() && h('n-button', { size: 'small', type: 'primary', onClick: () => viewDetail(row) }, () => '查看'),
      row.status === 'pending' && isSupervisor() && h('n-button', { size: 'small', onClick: () => startInspectionModal(row) }, () => '开始')
    ])
  }
]

const addCheckItem = () => {
  checkItems.value.push({ name: '', category: '其他' })
}

const removeCheckItem = (idx: number) => {
  if (checkItems.value.length > 1) {
    checkItems.value.splice(idx, 1)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const [storeList, userList] = await Promise.all([
      getStores(),
      getUsers()
    ])
    stores.value = storeList
    managers.value = userList
  } finally {
    loading.value = false
  }
}

const loadInspections = async () => {
  loading.value = true
  try {
    const params: any = { skip: (page.value - 1) * 10, limit: 10 }
    if (filters.status) params.status = filters.status
    const data = await getInspections(params)
    inspections.value = data
    total.value = data.length
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.status = null
  filters.date_range = null
  page.value = 1
  loadInspections()
}

const createInspection = async () => {
  try {
    submitting.value = true
    const user = getUser()
    const validCheckItems = checkItems.value.filter(c => c.name.trim())
    await createInspection({
      ...inspectionForm,
      supervisor_id: user?.id,
      check_items: validCheckItems
    })
    message.success('巡店任务创建成功')
    showCreateModal.value = false
    Object.assign(inspectionForm, { store_id: null, store_manager_id: null, title: '', description: '', scheduled_date: null, remark: '' })
    loadInspections()
  } catch (e: any) {
    message.error(e.data?.detail || '创建失败')
  } finally {
    submitting.value = false
  }
}

const viewDetail = async (inspection: InspectionTask) => {
  selectedInspection.value = inspection
  try {
    checkRecords.value = await getCheckRecords(inspection.id)
  } catch (e) {
    checkRecords.value = []
  }
  completeForm.score = null
  completeForm.remark = ''
  checkForm.check_item = ''
  checkForm.is_pass = true
  checkForm.remark = ''
  showDetailModal.value = true
}

const startInspectionModal = (inspection: InspectionTask) => {
  viewDetail(inspection)
}

const startInspection = async () => {
  if (!selectedInspection.value) return
  try {
    submitting.value = true
    selectedInspection.value = await apiStart(selectedInspection.value.id)
    message.success('巡店已开始')
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  } finally {
    submitting.value = false
  }
}

const addCheckRecord = async () => {
  if (!selectedInspection.value || !checkForm.check_item) return
  try {
    checkSubmitting.value = true
    const category = (selectedInspection.value.check_items as any[]).find((c: any) => c.name === checkForm.check_item)?.category || '其他'
    await addCheckRecord(selectedInspection.value.id, {
      inspection_id: selectedInspection.value.id,
      check_item: checkForm.check_item,
      category,
      is_pass: checkForm.is_pass,
      remark: checkForm.remark
    })
    checkRecords.value = await getCheckRecords(selectedInspection.value.id)
    checkForm.check_item = ''
    checkForm.is_pass = true
    checkForm.remark = ''
    message.success('检查记录已添加')
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  } finally {
    checkSubmitting.value = false
  }
}

const completeInspection = async () => {
  if (!selectedInspection.value || completeForm.score === null) return
  try {
    submitting.value = true
    selectedInspection.value = await apiComplete(selectedInspection.value.id, completeForm.score, completeForm.remark)
    message.success('巡店已完成')
    showDetailModal.value = false
    loadInspections()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
  loadInspections()
})
</script>
