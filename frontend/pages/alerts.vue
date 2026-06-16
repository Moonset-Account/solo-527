<template>
  <div>
    <n-page-header title="告警管理" subtitle="管理和确认系统告警">
      <template #extra>
        <n-button type="primary" @click="showCreateModal = true">
          <template #icon><PlusOutlined /></template>
          新增告警
        </n-button>
      </template>
    </n-page-header>

    <n-card class="mt-4">
      <n-space class="mb-4">
        <n-input
          v-model:value="keyword"
          placeholder="搜索告警标题或设备"
          style="width: 240px"
          clearable
        />
        <n-select
          v-model:value="filterStatus"
          placeholder="状态筛选"
          :options="statusOptions"
          style="width: 160px"
          clearable
        />
        <n-select
          v-model:value="filterSeverity"
          placeholder="级别筛选"
          :options="severityOptions"
          style="width: 160px"
          clearable
        />
        <n-button @click="loadData">
          <template #icon><SearchOutlined /></template>
          搜索
        </n-button>
      </n-space>

      <n-data-table
        :columns="columns"
        :data="alerts"
        :loading="loading"
        :bordered="false"
      />
    </n-card>

    <n-modal v-model:show="showCreateModal" preset="card" title="新增告警" style="width: 500px">
      <n-form :model="formData" label-placement="top">
        <n-form-item label="告警标题" required>
          <n-input v-model:value="formData.title" placeholder="请输入告警标题" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="16">
          <n-grid-item>
            <n-form-item label="严重级别">
              <n-select
                v-model:value="formData.severity"
                :options="severityOptions"
                placeholder="请选择级别"
              />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="来源">
              <n-input v-model:value="formData.source" placeholder="请输入来源" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="设备名称">
          <n-input v-model:value="formData.device_name" placeholder="请输入设备名称" />
        </n-form-item>
        <n-form-item label="告警描述">
          <n-input
            v-model:value="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入告警描述"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleCreate">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showConfirmModal" preset="card" title="确认告警" style="width: 400px">
      <n-form :model="confirmForm" label-placement="top">
        <n-form-item label="确认意见">
          <n-input
            v-model:value="confirmForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入确认意见（可选）"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showConfirmModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleConfirm">确认</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showResolveModal" preset="card" title="解决告警" style="width: 500px">
      <n-form :model="resolveForm" label-placement="top">
        <n-form-item label="解决方案" required>
          <n-input
            v-model:value="resolveForm.resolution"
            type="textarea"
            :rows="4"
            placeholder="请输入解决方案"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showResolveModal = false">取消</n-button>
          <n-button type="success" :loading="submitting" @click="handleResolve">解决</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import {
  NPageHeader,
  NCard,
  NSpace,
  NInput,
  NSelect,
  NButton,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NTag,
  NIcon,
  useMessage,
  useDialog,
} from 'naive-ui'
import { PlusOutlined, SearchOutlined } from '@vicons/antd'
import { useApiClient } from '~/composables/useApiClient'

definePageMeta({
  layout: 'admin',
  requiresAuth: true,
  requiresAdmin: true,
})

const message = useMessage()
const dialog = useDialog()
const api = useApiClient()

const loading = ref(false)
const submitting = ref(false)
const alerts = ref<any[]>([])
const keyword = ref('')
const filterStatus = ref<string | null>(null)
const filterSeverity = ref<string | null>(null)
const showCreateModal = ref(false)
const showConfirmModal = ref(false)
const showResolveModal = ref(false)
const currentAlertId = ref<number | null>(null)

const statusOptions = [
  { label: '未确认', value: 'unconfirmed' },
  { label: '已确认', value: 'confirmed' },
  { label: '已解决', value: 'resolved' },
]

const severityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '严重', value: 'critical' },
]

const statusTagType: Record<string, string> = {
  unconfirmed: 'warning',
  confirmed: 'info',
  resolved: 'success',
}

const statusLabel: Record<string, string> = {
  unconfirmed: '未确认',
  confirmed: '已确认',
  resolved: '已解决',
}

const severityTagType: Record<string, string> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  critical: 'error',
}

const severityLabel: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重',
}

const formData = reactive<any>({
  title: '',
  description: '',
  severity: 'medium',
  source: '',
  device_name: '',
})

const confirmForm = reactive({
  comment: '',
})

const resolveForm = reactive({
  resolution: '',
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  {
    title: '级别',
    key: 'severity',
    width: 80,
    render: (row: any) => h(NTag, { type: severityTagType[row.severity] as any, size: 'small' }, { default: () => severityLabel[row.severity] }),
  },
  {
    title: '状态',
    key: 'status',
    width: 90,
    render: (row: any) => h(NTag, { type: statusTagType[row.status] as any, size: 'small' }, { default: () => statusLabel[row.status] }),
  },
  { title: '来源', key: 'source', width: 120 },
  { title: '设备', key: 'device_name', width: 140 },
  { title: '创建时间', key: 'created_at', width: 160, render: (row: any) => formatDate(row.created_at) },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row: any) => h(
      NSpace,
      { size: 'small' },
      {
        default: () => {
          const btns: any[] = []
          if (row.status === 'unconfirmed') {
            btns.push(h(NButton, { size: 'small', type: 'primary', onClick: () => openConfirm(row.id) }, { default: () => '确认' }))
          }
          if (row.status !== 'resolved') {
            btns.push(h(NButton, { size: 'small', type: 'success', onClick: () => openResolve(row.id) }, { default: () => '解决' }))
          }
          btns.push(h(NButton, { size: 'small', type: 'error', onClick: () => deleteAlert(row) }, { default: () => '删除' }))
          return btns
        },
      }
    ),
  },
]

const loadData = async () => {
  loading.value = true
  try {
    const params: any = { limit: 100 }
    if (keyword.value) params.keyword = keyword.value
    if (filterStatus.value) params.status = filterStatus.value
    if (filterSeverity.value) params.severity = filterSeverity.value

    const data = await api.alerts.list(params)
    alerts.value = data as any[]
  } catch (error: any) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.title = ''
  formData.description = ''
  formData.severity = 'medium'
  formData.source = ''
  formData.device_name = ''
}

const handleCreate = async () => {
  if (!formData.title) {
    message.error('请输入告警标题')
    return
  }

  submitting.value = true
  try {
    await api.alerts.create(formData)
    message.success('创建成功')
    showCreateModal.value = false
    resetForm()
    loadData()
  } catch (error: any) {
    message.error(error.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

const openConfirm = (id: number) => {
  currentAlertId.value = id
  confirmForm.comment = ''
  showConfirmModal.value = true
}

const handleConfirm = async () => {
  if (!currentAlertId.value) return

  submitting.value = true
  try {
    await api.alerts.confirm(currentAlertId.value, confirmForm)
    message.success('确认成功')
    showConfirmModal.value = false
    loadData()
  } catch (error: any) {
    message.error(error.message || '确认失败')
  } finally {
    submitting.value = false
  }
}

const openResolve = (id: number) => {
  currentAlertId.value = id
  resolveForm.resolution = ''
  showResolveModal.value = true
}

const handleResolve = async () => {
  if (!currentAlertId.value || !resolveForm.resolution) {
    message.error('请输入解决方案')
    return
  }

  submitting.value = true
  try {
    await api.alerts.resolve(currentAlertId.value, resolveForm)
    message.success('解决成功')
    showResolveModal.value = false
    loadData()
  } catch (error: any) {
    message.error(error.message || '解决失败')
  } finally {
    submitting.value = false
  }
}

const deleteAlert = (row: any) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除告警「${row.title}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await api.alerts.remove(row.id)
        message.success('删除成功')
        loadData()
      } catch (error: any) {
        message.error('删除失败')
      }
    },
  })
}

onMounted(() => {
  loadData()
})
</script>
