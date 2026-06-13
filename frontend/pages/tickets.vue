<template>
  <div class="tickets-page">
    <n-card class="filter-card">
      <n-space vertical :size="16">
        <n-space :size="12" wrap>
          <n-select
            v-model:value="filters.status"
            placeholder="状态"
            :options="statusOptions"
            clearable
            style="width: 160px"
          />
          <n-select
            v-model:value="filters.priority"
            placeholder="优先级"
            :options="priorityOptions"
            clearable
            style="width: 160px"
          />
          <n-select
            v-model:value="filters.category"
            placeholder="分类"
            :options="categoryOptions"
            clearable
            style="width: 180px"
          />
          <n-input
            v-model:value="filters.keyword"
            placeholder="搜索关键词（标题/描述）"
            clearable
            style="width: 280px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <n-icon>🔍</n-icon>
            </template>
          </n-input>
        </n-space>
        <n-space :size="12" justify="space-between">
          <n-space :size="8">
            <n-button type="primary" @click="handleSearch">
              <template #icon>
                <n-icon>🔍</n-icon>
              </template>
              查询
            </n-button>
            <n-button @click="handleReset">
              重置
            </n-button>
          </n-space>
          <n-button type="primary" @click="showCreateModal = true">
            <template #icon>
              <n-icon>➕</n-icon>
            </template>
            新建工单
          </n-button>
        </n-space>
      </n-space>
    </n-card>

    <n-card class="table-card">
      <n-data-table
        :columns="columns"
        :data="ticketList"
        :loading="loading"
        :pagination="pagination"
        :row-key="(row: TicketItem) => row.id"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
      />
    </n-card>

    <n-modal
      v-model:show="showCreateModal"
      :mask-closable="false"
      preset="card"
      title="新建工单"
      style="width: 640px"
      :title-style="{ borderBottom: '1px solid #f0f0f0', paddingBottom: '12px' }"
    >
      <n-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-placement="top"
        :show-label="true"
      >
        <n-form-item label="标题" path="title">
          <n-input v-model:value="createForm.title" placeholder="请输入工单标题" maxlength="200" show-count />
        </n-form-item>
        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="createForm.description"
            type="textarea"
            placeholder="请详细描述您遇到的问题"
            :autosize="{ minRows: 4, maxRows: 8 }"
          />
        </n-form-item>
        <n-space :size="16" style="width: 100%">
          <n-form-item label="优先级" path="priority" style="flex: 1">
            <n-select v-model:value="createForm.priority" :options="priorityOptions" />
          </n-form-item>
          <n-form-item label="分类" path="category" style="flex: 1">
            <n-select v-model:value="createForm.category" :options="categoryOptions" clearable />
          </n-form-item>
        </n-space>
      </n-form>

      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="creating" @click="handleCreate">提交</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import type { DataTableColumns, FormInst, SelectMixedOption, TagProps } from 'naive-ui'

definePageMeta({
  layout: 'default'
})

const router = useRouter()
const { get, post } = useApi()
const message = useMessage()
const auth = useAuthStore()

interface TicketItem {
  id: number
  title: string
  description: string
  status: string
  priority: string
  category: string | null
  created_by: number
  assigned_to: number | null
  is_duplicate: boolean
  has_overdue_risk: boolean
  created_at: string
  updated_at: string
}

interface TicketListResponse {
  items: TicketItem[]
  total: number
  page: number
  page_size: number
}

const loading = ref(false)
const creating = ref(false)
const showCreateModal = ref(false)
const createFormRef = ref<FormInst | null>(null)

const ticketList = ref<TicketItem[]>([])

const filters = reactive({
  status: null as string | null,
  priority: null as string | null,
  category: null as string | null,
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount} 条`
})

const createForm = reactive({
  title: '',
  description: '',
  priority: 'medium',
  category: null as string | null
})

const createRules = {
  title: [
    { required: true, message: '请输入工单标题', trigger: 'blur' },
    { min: 2, max: 200, message: '标题长度在 2 到 200 个字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入工单描述', trigger: 'blur' },
    { min: 5, message: '描述至少 5 个字符', trigger: 'blur' }
  ],
  priority: { required: true, message: '请选择优先级', trigger: 'change' }
}

const statusOptions: SelectMixedOption[] = [
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已解决', value: 'resolved' },
  { label: '已关闭', value: 'closed' }
]

const priorityOptions: SelectMixedOption[] = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' }
]

const categoryOptions: SelectMixedOption[] = [
  { label: '账户问题', value: '账户问题' },
  { label: '功能故障', value: '功能故障' },
  { label: '使用咨询', value: '使用咨询' },
  { label: '支付问题', value: '支付问题' },
  { label: '数据异常', value: '数据异常' },
  { label: '权限问题', value: '权限问题' },
  { label: '其他', value: '其他' }
]

const statusLabelMap: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭'
}

const priorityLabelMap: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急'
}

const statusTagTypeMap: Record<string, TagProps['type']> = {
  pending: 'default',
  processing: 'info',
  resolved: 'success',
  closed: 'warning'
}

const priorityTagTypeMap: Record<string, TagProps['type']> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error'
}

const columns = computed<DataTableColumns>(() => {
  const cols: DataTableColumns = [
    {
      title: 'ID',
      key: 'id',
      width: 80,
      render: (row: TicketItem) => h('span', `#${row.id}`)
    },
    {
      title: '标题',
      key: 'title',
      ellipsis: { tooltip: true },
      minWidth: 200,
      render: (row: TicketItem) => h(
        'a',
        {
          style: { color: '#18a058', cursor: 'pointer', fontWeight: 500 },
          onClick: () => router.push(`/tickets/${row.id}`)
        },
        row.title
      )
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (row: TicketItem) => h(
        'n-tag',
        {
          type: statusTagTypeMap[row.status] || 'default',
          size: 'small'
        },
        () => statusLabelMap[row.status] || row.status
      )
    },
    {
      title: '优先级',
      key: 'priority',
      width: 100,
      render: (row: TicketItem) => h(
        'n-tag',
        {
          type: priorityTagTypeMap[row.priority] || 'default',
          size: 'small'
        },
        () => priorityLabelMap[row.priority] || row.priority
      )
    },
    {
      title: '分类',
      key: 'category',
      width: 120,
      render: (row: TicketItem) => row.category || '-'
    },
    {
      title: '创建人',
      key: 'created_by',
      width: 100,
      render: (row: TicketItem) => `用户#${row.created_by}`
    }
  ]

  if (!auth.isCustomer) {
    cols.splice(6, 0, {
      title: '处理人',
      key: 'assigned_to',
      width: 100,
      render: (row: TicketItem) => row.assigned_to ? `用户#${row.assigned_to}` : '-'
    })
  }

  cols.push(
    {
      title: '重复',
      key: 'is_duplicate',
      width: 80,
      render: (row: TicketItem) => row.is_duplicate
        ? h('n-tag', { type: 'warning', size: 'small' }, () => '是')
        : h('span', { style: { color: '#999' } }, '否')
    },
    {
      title: '超时风险',
      key: 'has_overdue_risk',
      width: 100,
      render: (row: TicketItem) => row.has_overdue_risk
        ? h('n-tag', { type: 'error', size: 'small' }, () => '⚠️ 有风险')
        : h('span', { style: { color: '#999' } }, '正常')
    },
    {
      title: '创建时间',
      key: 'created_at',
      width: 180,
      render: (row: TicketItem) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss')
    }
  )

  return cols
})

const buildQueryString = () => {
  const params = new URLSearchParams()
  params.append('page', String(pagination.page))
  params.append('page_size', String(pagination.pageSize))
  if (filters.status) params.append('status', filters.status)
  if (filters.priority) params.append('priority', filters.priority)
  if (filters.category) params.append('category', filters.category)
  if (filters.keyword?.trim()) params.append('keyword', filters.keyword.trim())
  return params.toString()
}

const fetchTickets = async () => {
  try {
    loading.value = true
    const query = buildQueryString()
    const res = await get<TicketListResponse>(`/tickets?${query}`)
    ticketList.value = res.items
    pagination.itemCount = res.total
  } catch (e: any) {
    message.error(e.message || '获取工单列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchTickets()
}

const handleReset = () => {
  filters.status = null
  filters.priority = null
  filters.category = null
  filters.keyword = ''
  pagination.page = 1
  fetchTickets()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchTickets()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  fetchTickets()
}

const handleCreate = async () => {
  try {
    await createFormRef.value?.validate()
    creating.value = true

    const payload: any = {
      title: createForm.title,
      description: createForm.description,
      priority: createForm.priority
    }
    if (createForm.category) {
      payload.category = createForm.category
    }

    await post('/tickets', payload)
    message.success('工单创建成功')
    showCreateModal.value = false
    resetCreateForm()
    fetchTickets()
  } catch (e: any) {
    if (e?.errors) return
    message.error(e.message || '创建工单失败')
  } finally {
    creating.value = false
  }
}

const resetCreateForm = () => {
  createForm.title = ''
  createForm.description = ''
  createForm.priority = 'medium'
  createForm.category = null
}

onMounted(() => {
  fetchTickets()
})
</script>

<style scoped lang="scss">
.tickets-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card {
  border-radius: 8px;
}

.table-card {
  border-radius: 8px;
  padding: 0;

  :deep(.n-card__content) {
    padding: 0;
  }

  :deep(.n-data-table) {
    border-radius: 0;
    border: none;
  }
}
</style>
