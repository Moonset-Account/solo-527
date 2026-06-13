<template>
  <div class="risk-page">
    <n-card>
      <template #header>
        <n-space justify="space-between" align="center">
          <n-text strong style="font-size: 18px;">风险样本管理</n-text>
          <n-space v-if="canCreate">
            <n-button type="primary" @click="showCreateModal = true">
              新建风险样本
            </n-button>
          </n-space>
        </n-space>
      </template>

      <n-space class="filter-bar" wrap>
        <n-select
          v-model:value="filters.risk_level"
          :options="riskLevelOptions"
          placeholder="风险等级"
          clearable
          style="width: 160px;"
        />
        <n-select
          v-model:value="filters.is_verified"
          :options="[
            { label: '已审核', value: true },
            { label: '未审核', value: false }
          ]"
          placeholder="审核状态"
          clearable
          style="width: 160px;"
        />
        <n-input-number
          v-model:value="filters.ticket_id"
          placeholder="工单ID"
          clearable
          style="width: 140px;"
        />
        <n-button type="primary" @click="loadList">查询</n-button>
        <n-button @click="resetFilters">重置</n-button>
      </n-space>

      <n-divider style="margin: 12px 0;" />

      <n-spin :show="loading">
        <n-data-table
          :columns="columns"
          :data="list"
          :pagination="pagination"
          :row-key="(row: any) => row.id"
          bordered
          striped
        />
      </n-spin>
    </n-card>

    <n-modal
      v-model:show="showCreateModal"
      preset="card"
      title="新建风险样本"
      style="width: 560px;"
    >
      <n-form ref="createFormRef" :model="createForm" :rules="createRules" label-placement="top">
        <n-form-item label="关联工单ID" path="ticket_id">
          <n-input-number v-model:value="createForm.ticket_id" placeholder="输入工单ID" style="width: 100%;" />
        </n-form-item>
        <n-form-item label="风险等级" path="risk_level">
          <n-select v-model:value="createForm.risk_level" :options="riskLevelOptions" placeholder="请选择风险等级" />
        </n-form-item>
        <n-form-item label="风险类型" path="risk_type">
          <n-select
            v-model:value="createForm.risk_type"
            :options="[
              { label: '自动检测', value: 'auto_detected' },
              { label: '紧急未分配', value: 'urgent_unassigned' },
              { label: '重复问题', value: 'repeat_issue' },
              { label: '超时风险', value: 'sla_overdue' },
              { label: '低满意度', value: 'low_satisfaction' },
              { label: '其他', value: 'other' }
            ]"
            placeholder="请选择风险类型"
            clearable
          />
        </n-form-item>
        <n-form-item label="风险描述" path="description">
          <n-input v-model:value="createForm.description" type="textarea" placeholder="描述风险详情" :autosize="{ minRows: 3, maxRows: 6 }" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleCreate">确定</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showVerifyModal"
      preset="card"
      title="审核风险样本"
      style="width: 560px;"
    >
      <div v-if="currentRisk" style="margin-bottom: 16px;">
        <n-descriptions label-placement="left" :column="1" bordered size="small">
          <n-descriptions-item label="工单ID">
            <n-button text type="primary" @click="goToTicket(currentRisk.ticket_id)">
              #{{ currentRisk.ticket_id }}
            </n-button>
          </n-descriptions-item>
          <n-descriptions-item label="风险等级">
            <n-tag :type="riskLevelTagType(currentRisk.risk_level)">{{ riskLevelLabel(currentRisk.risk_level) }}</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="风险类型">{{ currentRisk.risk_type || '-' }}</n-descriptions-item>
          <n-descriptions-item label="风险描述">{{ currentRisk.description || '-' }}</n-descriptions-item>
          <n-descriptions-item label="检测时间">{{ formatTime(currentRisk.detected_at) }}</n-descriptions-item>
        </n-descriptions>
      </div>
      <n-form :model="verifyForm" :rules="verifyRules" label-placement="top">
        <n-form-item label="审核结果" path="verified">
          <n-radio-group v-model:value="verifyForm.verified">
            <n-radio :value="true">确认风险</n-radio>
            <n-radio :value="false">排除风险</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="缓解措施说明" path="mitigation_note">
          <n-input v-model:value="verifyForm.mitigation_note" type="textarea" placeholder="填写处理措施或说明" :autosize="{ minRows: 3, maxRows: 6 }" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showVerifyModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleVerify">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import type { DataTableColumns, FormRules, SelectOption } from 'naive-ui'

definePageMeta({ layout: 'default' })

const router = useRouter()
const { get, post } = useApi()
const auth = useAuthStore()
const message = useMessage()
const dialog = useDialog()

interface RiskItem {
  id: number
  ticket_id: number
  risk_level: string
  risk_type: string | null
  description: string | null
  detected_at: string
  detected_by: number | null
  is_verified: boolean
  verified_by: number | null
  verified_at: string | null
  mitigation_note: string | null
}

const canCreate = computed(() => auth.isAdmin || auth.isSupervisor || auth.isAgent)
const canVerify = computed(() => auth.isAdmin || auth.isSupervisor)

const loading = ref(false)
const submitting = ref(false)
const list = ref<RiskItem[]>([])

const filters = reactive({
  risk_level: null as string | null,
  is_verified: null as boolean | null,
  ticket_id: null as number | null,
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  onChange: (page: number) => {
    pagination.page = page
    loadList()
  },
  onUpdatePageSize: (size: number) => {
    pagination.pageSize = size
    pagination.page = 1
    loadList()
  }
})

const riskLevelOptions: SelectOption[] = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '严重', value: 'critical' },
]

function riskLevelLabel(v: string) {
  const map: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' }
  return map[v] || v
}

function riskLevelTagType(v: string) {
  const map: Record<string, any> = { low: 'default', medium: 'warning', high: 'error', critical: 'error' }
  return map[v] || 'default'
}

function formatTime(t: string) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-'
}

function goToTicket(id: number) {
  router.push(`/tickets/${id}`)
}

const columns: DataTableColumns<RiskItem> = [
  { title: 'ID', key: 'id', width: 70, render: (row) => `#${row.id}` },
  {
    title: '关联工单', key: 'ticket_id', width: 110,
    render: (row) => h(
      'a',
      { style: 'color: #2080f0; cursor: pointer; text-decoration: none;', onClick: () => goToTicket(row.ticket_id) },
      `#${row.ticket_id}`
    )
  },
  {
    title: '风险等级', key: 'risk_level', width: 100,
    render: (row) => h(
      'n-tag',
      { type: riskLevelTagType(row.risk_level), round: true },
      { default: () => riskLevelLabel(row.risk_level) }
    )
  },
  { title: '风险类型', key: 'risk_type', width: 130, render: (row) => row.risk_type ? riskTypeLabel(row.risk_type) : '-' },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  { title: '检测人', key: 'detected_by', width: 100, render: (row) => row.detected_by ? `用户#${row.detected_by}` : '系统' },
  { title: '检测时间', key: 'detected_at', width: 170, render: (row) => formatTime(row.detected_at) },
  {
    title: '审核状态', key: 'is_verified', width: 100,
    render: (row) => h(
      'n-tag',
      { type: row.is_verified ? 'success' : 'default', round: true },
      { default: () => row.is_verified ? '已审核' : '未审核' }
    )
  },
  { title: '审核人', key: 'verified_by', width: 100, render: (row) => row.verified_by ? `用户#${row.verified_by}` : '-' },
  {
    title: '操作', key: 'actions', width: 120, fixed: 'right',
    render: (row) => {
      if (!canVerify.value || row.is_verified) {
        return row.mitigation_note
          ? h('n-tooltip', null, {
              trigger: () => h('n-button', { size: 'small', text: true, type: 'info' }, { default: () => '查看' }),
              default: () => row.mitigation_note
            })
          : null
      }
      return h(
        'n-button',
        { size: 'small', type: 'primary', onClick: () => openVerify(row) },
        { default: () => '审核' }
      )
    }
  },
]

function riskTypeLabel(v: string) {
  const map: Record<string, string> = {
    auto_detected: '自动检测',
    urgent_unassigned: '紧急未分配',
    repeat_issue: '重复问题',
    sla_overdue: '超时风险',
    low_satisfaction: '低满意度',
    other: '其他'
  }
  return map[v] || v
}

async function loadList() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.risk_level) params.append('risk_level', filters.risk_level)
    if (filters.is_verified !== null) params.append('is_verified', String(filters.is_verified))
    params.append('page', String(pagination.page))
    params.append('page_size', String(pagination.pageSize))

    const data: any = await get(`/risk-samples?${params.toString()}`)
    list.value = Array.isArray(data) ? data : (data.items || [])
    pagination.itemCount = Array.isArray(data) ? data.length : (data.total || 0)
  } catch (e: any) {
    if (e.message !== 'Unauthorized') message.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.risk_level = null
  filters.is_verified = null
  filters.ticket_id = null
  pagination.page = 1
  loadList()
}

const showCreateModal = ref(false)
const createFormRef = ref()
const createForm = reactive({
  ticket_id: null as number | null,
  risk_level: '' as string,
  risk_type: null as string | null,
  description: '' as string,
})

const createRules: FormRules = {
  ticket_id: { required: true, type: 'number', message: '请输入工单ID', trigger: 'change' },
  risk_level: { required: true, message: '请选择风险等级', trigger: 'change' },
}

async function handleCreate() {
  try {
    await createFormRef.value?.validate()
    submitting.value = true
    await post('/risk-samples', {
      ticket_id: createForm.ticket_id,
      risk_level: createForm.risk_level,
      risk_type: createForm.risk_type,
      description: createForm.description,
    })
    message.success('创建成功')
    showCreateModal.value = false
    Object.assign(createForm, { ticket_id: null, risk_level: '', risk_type: null, description: '' })
    loadList()
  } catch (e: any) {
    if (e.message !== 'Unauthorized') message.error(e.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

const showVerifyModal = ref(false)
const currentRisk = ref<RiskItem | null>(null)
const verifyForm = reactive({
  verified: true as boolean,
  mitigation_note: '' as string,
})

const verifyRules: FormRules = {
  verified: { required: true, type: 'boolean', message: '请选择审核结果', trigger: 'change' },
}

function openVerify(row: RiskItem) {
  currentRisk.value = row
  verifyForm.verified = true
  verifyForm.mitigation_note = row.mitigation_note || ''
  showVerifyModal.value = true
}

async function handleVerify() {
  if (!currentRisk.value) return
  try {
    submitting.value = true
    const params = new URLSearchParams()
    params.append('verified', String(verifyForm.verified))
    if (verifyForm.mitigation_note) params.append('mitigation_note', verifyForm.mitigation_note)
    await post(`/risk-samples/${currentRisk.value.id}/verify?${params.toString()}`)
    message.success('审核完成')
    showVerifyModal.value = false
    loadList()
  } catch (e: any) {
    if (e.message !== 'Unauthorized') message.error(e.message || '审核失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (!['admin', 'supervisor'].includes(auth.userRole)) {
    router.push('/')
    return
  }
  loadList()
})
</script>

<style scoped lang="scss">
.risk-page {
  padding: 20px;
}

.filter-bar {
  padding: 4px 0;
}
</style>
