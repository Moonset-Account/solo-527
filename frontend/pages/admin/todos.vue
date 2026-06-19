<template>
  <div class="page-container">
    <div class="card-wrapper">
      <h2 class="page-title">待办事项</h2>
      
      <div class="table-toolbar">
        <div class="search-bar">
          <n-select
            v-model:value="filterStatus"
            :options="statusOptions"
            placeholder="状态"
            style="width: 120px"
            clearable
          />
          <n-select
            v-model:value="filterPriority"
            :options="priorityOptions"
            placeholder="优先级"
            style="width: 120px"
            clearable
          />
          <n-select
            v-model:value="filterType"
            :options="typeOptions"
            placeholder="类型"
            style="width: 140px"
            clearable
          />
          <n-switch v-model:value="myTasks" checked-value>
            只看我的
          </n-switch>
        </div>
        <div class="action-bar">
          <n-button type="primary" @click="handleAdd">
            新建待办
          </n-button>
        </div>
      </div>
      
      <n-data-table
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        :bordered="false"
        @update:page="handlePageChange"
      >
        <template #status="{ row }">
          <n-tag :type="statusTagType(row.status)">
            {{ statusLabel(row.status) }}
          </n-tag>
        </template>
        <template #priority="{ row }">
          <n-tag :type="priorityTagType(row.priority)">
            {{ priorityLabel(row.priority) }}
          </n-tag>
        </template>
        <template #type="{ row }">
          {{ typeLabel(row.todo_type) }}
        </template>
        <template #actions="{ row }">
          <n-space>
            <n-button size="small" @click="handleView(row)">查看</n-button>
            <n-button size="small" type="primary" v-if="row.status !== 'completed'" @click="handleComplete(row)">
              完成
            </n-button>
          </n-space>
        </template>
      </n-data-table>
    </div>
    
    <n-modal v-model:show="showDetail" preset="card" title="待办详情" style="width: 600px">
      <div v-if="currentItem" class="detail-content">
        <div class="detail-item">
          <span class="detail-label">标题</span>
          <span class="detail-value">{{ currentItem.title }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">描述</span>
          <span class="detail-value">{{ currentItem.description || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">状态</span>
          <span class="detail-value">
            <n-tag :type="statusTagType(currentItem.status)">
              {{ statusLabel(currentItem.status) }}
            </n-tag>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">优先级</span>
          <span class="detail-value">
            <n-tag :type="priorityTagType(currentItem.priority)">
              {{ priorityLabel(currentItem.priority) }}
            </n-tag>
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">类型</span>
          <span class="detail-value">{{ typeLabel(currentItem.todo_type) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">创建人</span>
          <span class="detail-value">{{ currentItem.created_by_name || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">指派给</span>
          <span class="detail-value">{{ currentItem.assigned_to_name || '-' }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">创建时间</span>
          <span class="detail-value">{{ currentItem.created_at }}</span>
        </div>
        <div class="detail-item" v-if="currentItem.result">
          <span class="detail-label">处理结果</span>
          <span class="detail-value">{{ currentItem.result }}</span>
        </div>
      </div>
      <template #footer v-if="currentItem?.status !== 'completed'">
        <n-space justify="end">
          <n-button @click="showDetail = false">关闭</n-button>
          <n-button type="primary" @click="showCompleteDialog = true">标记完成</n-button>
        </n-space>
      </template>
    </n-modal>
    
    <n-modal v-model:show="showAddDialog" preset="card" :title="isEdit ? '编辑待办' : '新建待办'" style="width: 500px">
      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top">
        <n-form-item label="标题" path="title">
          <n-input v-model:value="form.title" placeholder="请输入待办标题" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="16">
          <n-form-item-gi label="优先级">
            <n-select v-model:value="form.priority" :options="priorityOptions" />
          </n-form-item-gi>
          <n-form-item-gi label="类型">
            <n-select v-model:value="form.todo_type" :options="typeOptions" />
          </n-form-item-gi>
        </n-grid>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showAddDialog = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleSubmit">确认</n-button>
        </n-space>
      </template>
    </n-modal>
    
    <n-modal v-model:show="showCompleteDialog" preset="card" title="完成待办" style="width: 400px">
      <n-form label-placement="top">
        <n-form-item label="处理结果">
          <n-input v-model:value="completeResult" type="textarea" :rows="4" placeholder="请输入处理结果" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCompleteDialog = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="submitComplete">确认完成</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  NCard, NInput, NSelect, NButton, NSpace, NDataTable,
  NModal, NTag, NForm, NFormItem, NFormItemGi, NGrid,
  NSwitch, useMessage, useDialog
} from 'naive-ui'
import { useApi } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'

const message = useMessage()
const dialog = useDialog()
const api = useApi()
const { user } = useAuth()

const loading = ref(false)
const submitting = ref(false)
const data = ref<any[]>([])
const filterStatus = ref<string | null>(null)
const filterPriority = ref<string | null>(null)
const filterType = ref<string | null>(null)
const myTasks = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const showDetail = ref(false)
const currentItem = ref<any>(null)
const showAddDialog = ref(false)
const showCompleteDialog = ref(false)
const completeResult = ref('')
const isEdit = ref(false)
const formRef = ref()

const form = reactive({
  title: '',
  description: '',
  priority: 'medium',
  todo_type: 'manual',
  registration_id: null as number | null,
  assigned_to_id: null as number | null,
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
}

const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
]

const typeOptions = [
  { label: '退票异常', value: 'refund_exception' },
  { label: '质量审核', value: 'quality_review' },
  { label: '手动', value: 'manual' },
  { label: '其他', value: 'other' },
]

const columns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '标题', key: 'title' },
  { title: '类型', key: 'type', width: 100 },
  { title: '优先级', key: 'priority', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建人', key: 'created_by_name', width: 100 },
  { title: '创建时间', key: 'created_at', width: 160 },
  { title: '操作', key: 'actions', width: 160, fixed: 'right' },
]

const pagination = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  itemCount: total.value,
}))

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

const statusTagType = (status: string) => {
  const map: Record<string, any> = {
    pending: 'warning',
    processing: 'info',
    completed: 'success',
    cancelled: 'default',
  }
  return map[status] || 'default'
}

const priorityLabel = (p: string) => {
  const map: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  }
  return map[p] || p
}

const priorityTagType = (p: string) => {
  const map: Record<string, any> = {
    high: 'error',
    medium: 'warning',
    low: 'default',
  }
  return map[p] || 'default'
}

const typeLabel = (t: string) => {
  const map: Record<string, string> = {
    refund_exception: '退票异常',
    quality_review: '质量审核',
    manual: '手动',
    other: '其他',
  }
  return map[t] || t
}

const fetchTodos = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (filterStatus.value) params.status = filterStatus.value
    if (filterPriority.value) params.priority = filterPriority.value
    if (filterType.value) params.todo_type = filterType.value
    if (myTasks.value) params.my_tasks = true
    
    const resp: any = await api.get('/todos', params)
    data.value = resp.items || []
    total.value = resp.total || 0
  } catch (e: any) {
    message.error(e.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (p: number) => {
  page.value = p
  fetchTodos()
}

const handleView = (row: any) => {
  currentItem.value = row
  showDetail.value = true
}

const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    title: '',
    description: '',
    priority: 'medium',
    todo_type: 'manual',
    registration_id: null,
    assigned_to_id: null,
  })
  showAddDialog.value = true
}

const handleComplete = (row: any) => {
  currentItem.value = row
  completeResult.value = ''
  showCompleteDialog.value = true
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }
  
  submitting.value = true
  try {
    await api.post('/todos', form)
    message.success('创建成功')
    showAddDialog.value = false
    fetchTodos()
  } catch (e: any) {
    message.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const submitComplete = async () => {
  if (!currentItem.value) return
  
  submitting.value = true
  try {
    await api.post(`/todos/${currentItem.value.id}/complete`, {
      result: completeResult.value,
    })
    message.success('已标记完成，关联数据已同步')
    showCompleteDialog.value = false
    showDetail.value = false
    fetchTodos()
  } catch (e: any) {
    message.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchTodos()
})
</script>

<style scoped lang="scss">
.action-bar {
  display: flex;
  gap: 12px;
}

.detail-content {
  padding: 8px 0;
}
</style>
