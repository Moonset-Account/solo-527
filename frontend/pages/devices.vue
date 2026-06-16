<template>
  <div>
    <n-page-header title="设备巡检" subtitle="管理设备巡检记录和状态">
      <template #extra>
        <n-button type="primary" @click="showCreateModal = true">
          <template #icon><PlusOutlined /></template>
          新增设备
        </n-button>
      </template>
    </n-page-header>

    <n-card class="mt-4">
      <n-space class="mb-4">
        <n-input
          v-model:value="keyword"
          placeholder="搜索设备名称或IP"
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
        <n-button @click="loadData">
          <template #icon><SearchOutlined /></template>
          搜索
        </n-button>
      </n-space>

      <n-data-table
        :columns="columns"
        :data="devices"
        :loading="loading"
        :bordered="false"
        :pagination="pagination"
        @update:page="handlePageChange"
      />
    </n-card>

    <n-modal v-model:show="showCreateModal" preset="card" title="新增设备" style="width: 600px">
      <n-form :model="formData" label-placement="top">
        <n-grid :cols="2" :x-gap="16">
          <n-grid-item>
            <n-form-item label="设备名称" required>
              <n-input v-model:value="formData.device_name" placeholder="请输入设备名称" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="设备类型">
              <n-input v-model:value="formData.device_type" placeholder="请输入设备类型" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="IP地址">
              <n-input v-model:value="formData.ip_address" placeholder="请输入IP地址" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="设备状态">
              <n-select
                v-model:value="formData.status"
                :options="statusOptions"
                placeholder="请选择状态"
              />
            </n-form-item>
          </n-grid-item>
          <n-grid-item :span="2">
            <n-form-item label="所在位置">
              <n-input v-model:value="formData.location" placeholder="请输入位置" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="巡检周期(天)">
              <n-input-number
                v-model:value="formData.inspection_cycle_days"
                :min="1"
                style="width: 100%"
              />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="下次巡检时间">
              <n-date-picker
                v-model:value="formData.next_inspection"
                type="date"
                style="width: 100%"
              />
            </n-form-item>
          </n-grid-item>
          <n-grid-item :span="2">
            <n-form-item label="备注">
              <n-input
                v-model:value="formData.remarks"
                type="textarea"
                :rows="2"
                placeholder="请输入备注"
              />
            </n-form-item>
          </n-grid-item>
        </n-grid>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleCreate">保存</n-button>
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
  NInputNumber,
  NDatePicker,
  NTag,
  NIcon,
  useMessage,
  useDialog,
} from 'naive-ui'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@vicons/antd'
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
const devices = ref<any[]>([])
const keyword = ref('')
const filterStatus = ref<string | null>(null)
const showCreateModal = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const statusOptions = [
  { label: '正常', value: 'normal' },
  { label: '预警', value: 'warning' },
  { label: '故障', value: 'faulty' },
  { label: '维护中', value: 'maintenance' },
]

const statusTagType: Record<string, string> = {
  normal: 'success',
  warning: 'warning',
  faulty: 'error',
  maintenance: 'info',
}

const statusLabel: Record<string, string> = {
  normal: '正常',
  warning: '预警',
  faulty: '故障',
  maintenance: '维护中',
}

const formData = reactive<any>({
  device_name: '',
  device_type: '',
  ip_address: '',
  status: 'normal',
  location: '',
  inspection_cycle_days: 30,
  next_inspection: null,
  remarks: '',
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '设备名称', key: 'device_name' },
  { title: '设备类型', key: 'device_type', width: 120 },
  { title: 'IP地址', key: 'ip_address', width: 140 },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: any) => h(NTag, { type: statusTagType[row.status] as any, size: 'small' }, { default: () => statusLabel[row.status] }),
  },
  { title: '位置', key: 'location', width: 140 },
  { title: '下次巡检', key: 'next_inspection', width: 120, render: (row: any) => formatDate(row.next_inspection) },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render: (row: any) => h(
      NSpace,
      { size: 'small' },
      {
        default: () => [
          h(NButton, { size: 'small', onClick: () => editDevice(row) }, { default: () => '编辑' }),
          h(NButton, { size: 'small', type: 'error', onClick: () => deleteDevice(row) }, { default: () => '删除' }),
        ],
      }
    ),
  },
]

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
    }
    if (keyword.value) params.keyword = keyword.value
    if (filterStatus.value) params.status = filterStatus.value

    const data = await api.devices.list(params)
    devices.value = data as any[]
  } catch (error: any) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadData()
}

const resetForm = () => {
  formData.device_name = ''
  formData.device_type = ''
  formData.ip_address = ''
  formData.status = 'normal'
  formData.location = ''
  formData.inspection_cycle_days = 30
  formData.next_inspection = null
  formData.remarks = ''
}

const editDevice = (row: any) => {
  Object.assign(formData, row)
  showCreateModal.value = true
}

const handleCreate = async () => {
  if (!formData.device_name) {
    message.error('请输入设备名称')
    return
  }

  submitting.value = true
  try {
    const data = { ...formData }
    if (data.next_inspection) {
      data.next_inspection = new Date(data.next_inspection).toISOString()
    }
    if (formData.id) {
      await api.devices.update(formData.id, data)
      message.success('更新成功')
    } else {
      await api.devices.create(data)
      message.success('创建成功')
    }
    showCreateModal.value = false
    resetForm()
    loadData()
  } catch (error: any) {
    message.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const deleteDevice = (row: any) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除设备「${row.device_name}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await api.devices.remove(row.id)
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
