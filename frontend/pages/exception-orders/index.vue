<template>
  <MainLayout>
    <div class="exception-page">
      <n-card :bordered="false">
        <div class="filter-section">
          <n-form inline :model="queryForm">
            <n-form-item label="关键词">
              <n-input
                v-model:value="queryForm.keyword"
                placeholder="异常单编号/标题"
                clearable
                style="width: 200px"
              />
            </n-form-item>
            <n-form-item label="异常类型">
              <n-select
                v-model:value="queryForm.exception_type"
                placeholder="请选择"
                clearable
                style="width: 150px"
                :options="typeOptions"
              />
            </n-form-item>
            <n-form-item label="状态">
              <n-select
                v-model:value="queryForm.status"
                placeholder="请选择"
                clearable
                style="width: 130px"
                :options="statusOptions"
              />
            </n-form-item>
            <n-form-item label="优先级">
              <n-select
                v-model:value="queryForm.priority"
                placeholder="请选择"
                clearable
                style="width: 130px"
                :options="priorityOptions"
              />
            </n-form-item>
            <n-form-item>
              <n-space>
                <n-button type="primary" @click="handleSearch">查询</n-button>
                <n-button @click="handleReset">重置</n-button>
              </n-space>
            </n-form-item>
          </n-form>
        </div>

        <div class="table-toolbar">
          <div class="toolbar-left">
            <n-button
              v-if="userStore.hasPermission('exception:handle')"
              type="primary"
              @click="handleCreate"
            >
              新增异常单
            </n-button>
          </div>
          <div class="toolbar-right">
            <n-button @click="loadData">刷新</n-button>
          </div>
        </div>

        <n-spin :show="loading">
          <n-data-table
            :columns="columns"
            :data="tableData"
            :pagination="pagination"
            :bordered="false"
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
        </n-spin>
      </n-card>

      <n-modal
        v-model:show="showModal"
        preset="card"
        :title="isEdit ? '编辑异常单' : '新增异常单'"
        style="width: 550px"
      >
        <n-form ref="formRef" :model="formData" :rules="formRules" label-placement="left" label-width="100px">
          <n-form-item label="关联租约" path="lease_id">
            <n-input-number v-model:value="formData.lease_id" style="width: 100%" />
          </n-form-item>
          <n-form-item label="关联账单" path="bill_id">
            <n-input-number v-model:value="formData.bill_id" style="width: 100%" />
          </n-form-item>
          <n-form-item label="异常类型" path="exception_type">
            <n-select v-model:value="formData.exception_type" :options="typeOptions" />
          </n-form-item>
          <n-form-item label="标题" path="title">
            <n-input v-model:value="formData.title" placeholder="请输入标题" />
          </n-form-item>
          <n-form-item label="优先级" path="priority">
            <n-select v-model:value="formData.priority" :options="priorityOptions" />
          </n-form-item>
          <n-form-item label="争议金额" path="disputed_amount">
            <n-input-number v-model:value="formData.disputed_amount" style="width: 100%" :min="0" />
          </n-form-item>
          <n-form-item label="异常描述" path="description">
            <n-input v-model:value="formData.description" type="textarea" :rows="4" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showModal = false">取消</n-button>
            <n-button type="primary" :loading="submitting" @click="handleSubmit">确定</n-button>
          </n-space>
        </template>
      </n-modal>

      <n-modal
        v-model:show="showResolveModal"
        preset="card"
        title="办结异常单"
        style="width: 500px"
      >
        <n-form :model="resolveForm" label-placement="left" label-width="100px">
          <n-form-item label="处理说明">
            <n-input
              v-model:value="resolveForm.resolution"
              type="textarea"
              :rows="5"
              placeholder="请输入处理说明"
            />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="showResolveModal = false">取消</n-button>
            <n-button type="primary" :loading="resolving" @click="handleResolveSubmit">确认办结</n-button>
          </n-space>
        </template>
      </n-modal>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import type { FormInst, FormRules, DataTableColumns } from 'naive-ui'
import MainLayout from '~/components/layout/MainLayout.vue'
import {
  getExceptionOrderList,
  createExceptionOrder,
  updateExceptionOrder,
  resolveExceptionOrder,
  deleteExceptionOrder,
} from '~/api/exception'
import type { ExceptionOrder } from '~/types'
import { useUserStore } from '~/stores/user'
import { useMessageUtil, useDialogUtil } from '~/composables/useMessage'

const userStore = useUserStore()
const { success, error } = useMessageUtil()
const { confirm } = useDialogUtil()

const loading = ref(false)
const tableData = ref<ExceptionOrder[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
})

const queryForm = reactive({
  keyword: '',
  exception_type: '',
  status: '',
  priority: '',
})

const showModal = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInst | null>(null)
const editingId = ref<number | null>(null)

const formData = reactive({
  lease_id: undefined as number | undefined,
  bill_id: undefined as number | undefined,
  exception_type: '',
  title: '',
  description: '',
  priority: 'normal',
  disputed_amount: 0,
})

const formRules: FormRules = {
  lease_id: [{ required: true, message: '请输入租约ID', trigger: 'blur' }],
  exception_type: [{ required: true, message: '请选择异常类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入异常描述', trigger: 'blur' }],
}

const showResolveModal = ref(false)
const resolving = ref(false)
const resolvingId = ref<number | null>(null)
const resolveForm = reactive({
  resolution: '',
})

const typeOptions = [
  { label: '押金争议', value: 'deposit_dispute' },
  { label: '租金争议', value: 'rent_dispute' },
  { label: '维修纠纷', value: 'maintenance' },
  { label: '提前退租', value: 'early_termination' },
  { label: '其他', value: 'other' },
]

const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已办结', value: 'resolved' },
  { label: '已关闭', value: 'closed' },
]

const priorityOptions = [
  { label: '低', value: 'low' },
  { label: '普通', value: 'normal' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' },
]

const columns: DataTableColumns<ExceptionOrder> = [
  { title: '异常单编号', key: 'order_no', width: 160 },
  { title: '标题', key: 'title', width: 200, ellipsis: true },
  { title: '异常类型', key: 'exception_type', width: 120, render: (row) => getTypeLabel(row.exception_type) },
  {
    title: '优先级',
    key: 'priority',
    width: 100,
    render: (row) => h('n-tag', { type: getPriorityTagType(row.priority) }, () => getPriorityLabel(row.priority)),
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => h('n-tag', { type: getStatusTagType(row.status) }, () => getStatusLabel(row.status)),
  },
  { title: '争议金额', key: 'disputed_amount', width: 120, render: (row) => row.disputed_amount ? `¥${Number(row.disputed_amount).toLocaleString()}` : '-' },
  { title: '创建时间', key: 'created_at', width: 170 },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => h('n-space', null, () => [
      h('n-button', { size: 'small', onClick: () => viewDetail(row.id) }, () => '详情'),
      userStore.hasPermission('exception:handle') && row.status !== 'resolved'
        ? h('n-button', { size: 'small', type: 'primary', onClick: () => handleResolve(row.id) }, () => '办结')
        : null,
      userStore.hasPermission('exception:handle')
        ? h('n-button', { size: 'small', type: 'error', onClick: () => handleDelete(row.id) }, () => '删除')
        : null,
    ]),
  },
]

function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    deposit_dispute: '押金争议',
    rent_dispute: '租金争议',
    maintenance: '维修纠纷',
    early_termination: '提前退租',
    other: '其他',
  }
  return map[type] || type
}

function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急',
  }
  return map[priority] || priority
}

function getPriorityTagType(priority: string): string {
  const map: Record<string, string> = {
    low: 'default',
    normal: 'info',
    high: 'warning',
    urgent: 'error',
  }
  return map[priority] || 'default'
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已办结',
    closed: '已关闭',
  }
  return map[status] || status
}

function getStatusTagType(status: string): string {
  const map: Record<string, string> = {
    pending: 'warning',
    processing: 'info',
    resolved: 'success',
    closed: 'default',
  }
  return map[status] || 'default'
}

async function loadData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      page_size: pagination.pageSize,
      ...queryForm,
    }
    const res = await getExceptionOrderList(params)
    if (res.code === 200) {
      tableData.value = res.data.items
      pagination.total = res.data.total
    }
  } catch (e: any) {
    error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleReset() {
  queryForm.keyword = ''
  queryForm.exception_type = ''
  queryForm.status = ''
  queryForm.priority = ''
  pagination.page = 1
  loadData()
}

function handlePageChange(page: number) {
  pagination.page = page
  loadData()
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize
  pagination.page = 1
  loadData()
}

function handleCreate() {
  isEdit.value = false
  editingId.value = null
  Object.assign(formData, {
    lease_id: undefined,
    bill_id: undefined,
    exception_type: '',
    title: '',
    description: '',
    priority: 'normal',
    disputed_amount: 0,
  })
  showModal.value = true
}

function viewDetail(id: number) {
  // 跳转到详情页
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value && editingId.value) {
      await updateExceptionOrder(editingId.value, formData)
      success('更新成功')
    } else {
      await createExceptionOrder(formData)
      success('创建成功')
    }
    showModal.value = false
    loadData()
  } catch (e: any) {
    error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

function handleResolve(id: number) {
  resolvingId.value = id
  resolveForm.resolution = ''
  showResolveModal.value = true
}

async function handleResolveSubmit() {
  if (!resolveForm.resolution.trim()) {
    error('请输入处理说明')
    return
  }
  if (!resolvingId.value) return

  resolving.value = true
  try {
    await resolveExceptionOrder(resolvingId.value, resolveForm)
    success('办结成功')
    showResolveModal.value = false
    loadData()
  } catch (e: any) {
    error(e.message || '操作失败')
  } finally {
    resolving.value = false
  }
}

function handleDelete(id: number) {
  confirm('确认删除', '确定要删除这条异常单吗？', async () => {
    try {
      await deleteExceptionOrder(id)
      success('删除成功')
      loadData()
    } catch (e: any) {
      error(e.message || '删除失败')
    }
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.exception-page {
  padding: 0;
}

.filter-section {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>
