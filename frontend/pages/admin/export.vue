<template>
  <NSpace vertical :size="16">
    <NCard title="数据导出">
      <NForm ref="formRef" :model="filterForm" label-placement="left" label-width="80" inline>
        <NFormItem label="状态">
          <NSelect v-model:value="filterForm.status" :options="statusOptions" placeholder="全部" clearable style="width: 120px" />
        </NFormItem>
        <NFormItem label="类别">
          <NSelect v-model:value="filterForm.category" :options="categoryOptions" placeholder="全部" clearable style="width: 120px" />
        </NFormItem>
        <NFormItem label="开始日期">
          <NInput v-model:value="filterForm.start_date" placeholder="YYYY-MM-DD" style="width: 140px" />
        </NFormItem>
        <NFormItem label="结束日期">
          <NInput v-model:value="filterForm.end_date" placeholder="YYYY-MM-DD" style="width: 140px" />
        </NFormItem>
        <NFormItem>
          <NButton type="primary" :loading="exportLoading" @click="handleExport">导出 Excel</NButton>
        </NFormItem>
      </NForm>
      <NAlert v-if="exportSuccess" type="success" style="margin-top: 16px">
        导出成功！
        <a :href="lastExportUrl" target="_blank" style="margin-left: 8px">点击下载文件</a>
      </NAlert>
    </NCard>

    <NCard title="导出历史">
      <NDataTable
        :columns="exportColumns"
        :data="exportHistory"
        :loading="historyLoading"
        :bordered="false"
        size="small"
      />
    </NCard>
  </NSpace>
</template>

<script setup lang="ts">
import { NCard, NForm, NFormItem, NSelect, NInput, NButton, NDataTable, NSpace, NTag, useMessage, NAlert } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'

const api = useApi()
const message = useMessage()
const exportLoading = ref(false)
const historyLoading = ref(false)
const exportSuccess = ref(false)
const lastExportUrl = ref('')

const filterForm = reactive({
  status: null as string | null,
  category: null as string | null,
  start_date: '',
  end_date: ''
})

const statusOptions = [
  { label: '待审核', value: 'pending' },
  { label: '审核中', value: 'in_review' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '处理中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已关闭', value: 'closed' }
]

const categoryOptions = [
  { label: '水管', value: 'plumbing' },
  { label: '电路', value: 'electrical' },
  { label: '家具', value: 'furniture' },
  { label: '门窗', value: 'door_window' },
  { label: '其他', value: 'other' }
]

const exportHistory = ref<any[]>([])

const exportColumns: DataTableColumns = [
  { title: '导出ID', key: 'id', width: 80 },
  {
    title: '筛选条件', key: 'filter_params', ellipsis: { tooltip: true },
    render(row: any) {
      if (row.filter_params && Object.keys(row.filter_params).length > 0) {
        return JSON.stringify(row.filter_params)
      }
      return '无筛选'
    }
  },
  {
    title: '生成时间', key: 'generated_at', width: 160,
    render(row: any) {
      return row.generated_at || '生成中...'
    }
  },
  { title: '操作人', key: 'operator_id', width: 100 },
  {
    title: '状态', key: 'status', width: 100,
    render(row: any) {
      if (row.file_path) return h(NTag, { type: 'success', size: 'small' }, { default: () => '已完成' })
      return h(NTag, { type: 'warning', size: 'small' }, { default: () => '生成中' })
    }
  },
  {
    title: '操作', key: 'actions', width: 100,
    render(row: any) {
      if (row.file_path) {
        return h(NButton, {
          size: 'small',
          type: 'primary',
          tag: 'a',
          href: api.getExportDownloadUrl(row.id),
          target: '_blank'
        }, { default: () => '下载' })
      }
      return h(NButton, { size: 'small', disabled: true }, { default: () => '等待' })
    }
  }
]

async function handleExport() {
  exportLoading.value = true
  exportSuccess.value = false
  try {
    const params: Record<string, any> = {}
    if (filterForm.status) params.status = filterForm.status
    if (filterForm.category) params.category = filterForm.category
    if (filterForm.start_date) params.start_date = filterForm.start_date
    if (filterForm.end_date) params.end_date = filterForm.end_date
    const res = await api.triggerExport({ export_type: 'repairs', filter_params: params }) as any
    message.success('导出成功')
    if (res && res.id) {
      lastExportUrl.value = api.getExportDownloadUrl(res.id)
      exportSuccess.value = true
      setTimeout(() => {
        exportSuccess.value = false
      }, 10000)
    }
    fetchHistory()
  } catch (e: any) {
    message.error(e?.data?.detail || '导出失败')
  } finally {
    exportLoading.value = false
  }
}

async function fetchHistory() {
  historyLoading.value = true
  try {
    const res = await api.getExportHistory({ limit: 20 }) as any[]
    exportHistory.value = Array.isArray(res) ? res : []
  } catch {
    exportHistory.value = []
  } finally {
    historyLoading.value = false
  }
}

onMounted(() => {
  fetchHistory()
})
</script>
