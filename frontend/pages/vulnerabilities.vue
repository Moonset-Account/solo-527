<template>
  <div>
    <n-page-header title="漏洞管理" subtitle="管理和修复系统漏洞">
      <template #extra>
        <n-button type="primary" @click="showCreateModal = true">
          <template #icon><PlusOutlined /></template>
          新增漏洞
        </n-button>
      </template>
    </n-page-header>

    <n-card class="mt-4">
      <n-space class="mb-4">
        <n-input
          v-model:value="keyword"
          placeholder="搜索标题或CVE编号"
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
        :data="vulnerabilities"
        :loading="loading"
        :bordered="false"
      />
    </n-card>

    <n-modal v-model:show="showCreateModal" preset="card" title="新增漏洞" style="width: 600px">
      <n-form :model="formData" label-placement="top">
        <n-form-item label="漏洞标题" required>
          <n-input v-model:value="formData.title" placeholder="请输入漏洞标题" />
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
            <n-form-item label="CVE编号">
              <n-input v-model:value="formData.cve_id" placeholder="如 CVE-2024-0001" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="受影响设备">
          <n-select
            v-model:value="formData.affected_devices"
            multiple
            filterable
            tag
            :options="deviceOptions"
            placeholder="请选择或输入受影响设备"
          />
        </n-form-item>
        <n-form-item label="漏洞描述">
          <n-input
            v-model:value="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入漏洞描述"
          />
        </n-form-item>
        <n-form-item label="修复方案">
          <n-input
            v-model:value="formData.fix_plan"
            type="textarea"
            :rows="3"
            placeholder="请输入修复方案"
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

    <n-modal v-model:show="showFixModal" preset="card" title="修复漏洞" style="width: 500px">
      <n-form :model="fixForm" label-placement="top">
        <n-form-item label="修复结果" required>
          <n-input
            v-model:value="fixForm.fix_result"
            type="textarea"
            :rows="4"
            placeholder="请输入修复结果"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showFixModal = false">取消</n-button>
          <n-button type="success" :loading="submitting" @click="handleFix">标记已修复</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h, computed } from 'vue'
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
  useMessage,
  useDialog,
} from 'naive-ui'
import { PlusOutlined, SearchOutlined } from '@vicons/antd'
import { useApiClient } from '~/composables/useApiClient'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
  requiresAuth: true,
  requiresAdmin: true,
})

const message = useMessage()
const dialog = useDialog()
const api = useApiClient()
const authStore = useAuthStore()

const loading = ref(false)
const submitting = ref(false)
const vulnerabilities = ref<any[]>([])
const keyword = ref('')
const filterStatus = ref<string | null>(null)
const filterSeverity = ref<string | null>(null)
const showCreateModal = ref(false)
const showFixModal = ref(false)
const currentVulnId = ref<number | null>(null)
const devices = ref<any[]>([])

const statusOptions = [
  { label: '已发现', value: 'identified' },
  { label: '修复中', value: 'fixing' },
  { label: '已修复', value: 'fixed' },
  { label: '接受风险', value: 'accepted' },
]

const severityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '严重', value: 'critical' },
]

const deviceOptions = computed(() => {
  return devices.value.map(d => ({ label: d.device_name, value: d.device_name }))
})

const statusTagType: Record<string, string> = {
  identified: 'warning',
  fixing: 'info',
  fixed: 'success',
  accepted: 'default',
}

const statusLabel: Record<string, string> = {
  identified: '已发现',
  fixing: '修复中',
  fixed: '已修复',
  accepted: '接受风险',
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
  cve_id: '',
  severity: 'medium',
  affected_devices: [],
  fix_plan: '',
})

const fixForm = reactive({
  fix_result: '',
})

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '标题', key: 'title', ellipsis: { tooltip: true } },
  { title: 'CVE编号', key: 'cve_id', width: 140 },
  {
    title: '级别',
    key: 'severity',
    width: 80,
    render: (row: any) => h(NTag, { type: severityTagType[row.severity] as any, size: 'small' }, { default: () => severityLabel[row.severity] }),
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: any) => h(NTag, { type: statusTagType[row.status] as any, size: 'small' }, { default: () => statusLabel[row.status] }),
  },
  { title: '创建时间', key: 'created_at', width: 160, render: (row: any) => formatDate(row.created_at) },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render: (row: any) => h(
      NSpace,
      { size: 'small' },
      {
        default: () => {
          const btns: any[] = []
          if (authStore.isSecurityOfficer && row.status !== 'fixed') {
            btns.push(h(NButton, { size: 'small', type: 'success', onClick: () => openFix(row.id) }, { default: () => '修复' }))
          }
          if (authStore.isSecurityOfficer) {
            btns.push(h(NButton, { size: 'small', type: 'error', onClick: () => deleteVuln(row) }, { default: () => '删除' }))
          }
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

    const data = await api.vulnerabilities.list(params)
    vulnerabilities.value = data as any[]
  } catch (error: any) {
    message.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadDevices = async () => {
  try {
    const data = await api.devices.list({ limit: 100 })
    devices.value = data as any[]
  } catch (e) {}
}

const resetForm = () => {
  formData.title = ''
  formData.description = ''
  formData.cve_id = ''
  formData.severity = 'medium'
  formData.affected_devices = []
  formData.fix_plan = ''
}

const handleCreate = async () => {
  if (!formData.title) {
    message.error('请输入漏洞标题')
    return
  }

  submitting.value = true
  try {
    await api.vulnerabilities.create(formData)
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

const openFix = (id: number) => {
  currentVulnId.value = id
  fixForm.fix_result = ''
  showFixModal.value = true
}

const handleFix = async () => {
  if (!currentVulnId.value || !fixForm.fix_result) {
    message.error('请输入修复结果')
    return
  }

  submitting.value = true
  try {
    await api.vulnerabilities.fix(currentVulnId.value, fixForm)
    message.success('修复成功')
    showFixModal.value = false
    loadData()
  } catch (error: any) {
    message.error(error.message || '修复失败')
  } finally {
    submitting.value = false
  }
}

const deleteVuln = (row: any) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除漏洞「${row.title}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await api.vulnerabilities.remove(row.id)
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
  loadDevices()
})
</script>
