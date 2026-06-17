<template>
  <div class="todos-page">
    <n-space vertical :size="20" style="width: 100%">
      <n-card :bordered="false" size="small">
        <n-space :size="16">
          <n-input v-model:value="keyword" placeholder="搜索待办事项" clearable style="width: 240px" />
          <n-select v-model:value="statusFilter" :options="statusOptions" placeholder="状态筛选" clearable style="width: 160px" />
          <n-select v-model:value="priorityFilter" :options="priorityOptions" placeholder="优先级" clearable style="width: 160px" />
          <n-select v-model:value="categoryFilter" :options="categoryOptions" placeholder="类别" clearable style="width: 160px" />
          <n-switch v-model:value="overdueOnly" />
          <span style="font-size: 13px; color: #666">仅显示已过期</span>
          <n-button type="primary" @click="loadTodos">查询</n-button>
          <n-button @click="showCreateModal = true">新增待办</n-button>
        </n-space>
      </n-card>

      <n-grid :cols="4" :x-gap="16">
        <n-grid-item>
          <n-card hoverable>
            <n-statistic label="待完成" :value="stats.pending || 0" value-style="color: #f0a020" />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card hoverable>
            <n-statistic label="高优先级" :value="stats.high || 0" value-style="color: #d03050" />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card hoverable>
            <n-statistic label="已过期" :value="stats.overdue || 0" value-style="color: #d03050" />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card hoverable>
            <n-statistic label="已完成" :value="stats.completed || 0" value-style="color: #18a058" />
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-card :bordered="false" size="small">
        <n-data-table
          :columns="columns"
          :data="todos"
          :bordered="false"
          :pagination="{ pageSize: 10 }"
          size="small"
        />
      </n-card>
    </n-space>

    <n-modal v-model:show="showCreateModal" preset="card" :title="editingTodo ? '编辑待办' : '新增待办'" style="width: 520px">
      <n-form :model="formData" label-placement="left" label-width="100px">
        <n-form-item label="标题">
          <n-input v-model:value="formData.title" placeholder="请输入待办标题" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="formData.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="优先级">
              <n-select v-model:value="formData.priority" :options="priorityOptions" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="类别">
              <n-select v-model:value="formData.category" :options="categoryOptions" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="截止时间">
          <n-date-picker v-model:value="formData.due_time" type="datetime" style="width: 100%" />
        </n-form-item>
        <n-form-item label="指派人">
          <n-input v-model:value="formData.assignee" placeholder="请输入指派人" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" @click="handleSubmit">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { NTag, NCheckbox, NButton, NPopconfirm, useMessage } from 'naive-ui'
import { useApi } from '@/composables/useApi'
import { useFormat } from '@/composables/useFormat'

const { get, post, put, del } = useApi()
const { formatDateTime, getStatusText, getStatusTagType } = useFormat()
const message = useMessage()

const keyword = ref('')
const statusFilter = ref<string | null>('false')
const priorityFilter = ref<string | null>(null)
const categoryFilter = ref<string | null>(null)
const overdueOnly = ref(false)
const todos = ref<any[]>([])
const showCreateModal = ref(false)
const editingTodo = ref<any>(null)

const formData = ref({
  title: '',
  description: '',
  priority: 'medium',
  category: '',
  related_type: '',
  related_id: null,
  due_time: null,
  is_completed: false,
  assignee: '',
})

const statusOptions = [
  { label: '待完成', value: 'false' },
  { label: '已完成', value: 'true' },
]

const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
]

const categoryOptions = [
  { label: '日常巡查', value: 'daily_check' },
  { label: '环境调控', value: 'environment' },
  { label: '病虫害防治', value: 'pest_control' },
  { label: '采收准备', value: 'harvest_prep' },
  { label: '设备维护', value: 'equipment' },
  { label: '其他', value: 'other' },
]

const stats = computed(() => {
  const result: Record<string, number> = { pending: 0, high: 0, overdue: 0, completed: 0 }
  const now = new Date()
  todos.value.forEach((t) => {
    if (!t.is_completed) {
      result.pending++
      if (t.priority === 'high') result.high++
      if (t.due_time && new Date(t.due_time) < now) result.overdue++
    } else {
      result.completed++
    }
  })
  return result
})

const columns = [
  {
    title: '',
    key: 'check',
    width: 50,
    render: (row: any) =>
      h(NCheckbox, {
        checked: row.is_completed,
        onUpdateChecked: () => toggleTodo(row),
      }),
  },
  { title: '标题', key: 'title', width: 250, ellipsis: { tooltip: true } },
  {
    title: '优先级',
    key: 'priority',
    width: 80,
    render: (row: any) =>
      h(NTag, { type: getPriorityType(row.priority), size: 'small' }, {
        default: () => getPriorityText(row.priority),
      }),
  },
  { title: '类别', key: 'category', width: 100 },
  { title: '指派人', key: 'assignee', width: 100 },
  {
    title: '截止时间',
    key: 'due_time',
    width: 170,
    render: (row: any) => {
      const isOverdue = row.due_time && !row.is_completed && new Date(row.due_time) < new Date()
      return h('span', { style: isOverdue ? 'color: #d03050; font-weight: 500' : '' }, formatDateTime(row.due_time))
    },
  },
  {
    title: '状态',
    key: 'is_completed',
    width: 90,
    render: (row: any) =>
      h(NTag, { type: row.is_completed ? 'success' : 'warning', size: 'small' }, {
        default: () => (row.is_completed ? '已完成' : '待完成'),
      }),
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    render: (row: any) =>
      h('div', { style: 'display: flex; gap: 8px' }, [
        h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, {
          trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, { default: () => '删除' }),
          default: () => '确定删除该待办吗？',
        }),
      ]),
  },
]

function getPriorityType(priority: string): string {
  if (priority === 'high') return 'error'
  if (priority === 'medium') return 'warning'
  return 'info'
}

function getPriorityText(priority: string): string {
  if (priority === 'high') return '高'
  if (priority === 'medium') return '中'
  return '低'
}

async function loadTodos() {
  try {
    const params: any = {}
    if (statusFilter.value !== null) params.is_completed = statusFilter.value === 'true'
    if (priorityFilter.value) params.priority = priorityFilter.value
    if (categoryFilter.value) params.category = categoryFilter.value
    if (overdueOnly.value) params.overdue_only = true
    if (keyword.value) params.keyword = keyword.value
    todos.value = await get('/todos', params)
  } catch (e) {
    message.error('加载失败')
  }
}

async function toggleTodo(todo: any) {
  try {
    await put(`/todos/${todo.id}`, { is_completed: !todo.is_completed })
    message.success(todo.is_completed ? '已取消完成' : '已完成')
    loadTodos()
  } catch (e) {
    message.error('操作失败')
  }
}

function handleEdit(row: any) {
  editingTodo.value = row
  formData.value = { ...row }
  showCreateModal.value = true
}

async function handleDelete(id: number) {
  try {
    await del(`/todos/${id}`)
    message.success('删除成功')
    loadTodos()
  } catch (e) {
    message.error('删除失败')
  }
}

async function handleSubmit() {
  try {
    if (editingTodo.value) {
      await put(`/todos/${editingTodo.value.id}`, formData.value)
      message.success('更新成功')
    } else {
      await post('/todos', formData.value)
      message.success('创建成功')
    }
    showCreateModal.value = false
    editingTodo.value = null
    resetForm()
    loadTodos()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  }
}

function resetForm() {
  formData.value = {
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    related_type: '',
    related_id: null,
    due_time: null,
    is_completed: false,
    assignee: '',
  }
}

onMounted(() => {
  loadTodos()
})
</script>

<style scoped>
</style>
