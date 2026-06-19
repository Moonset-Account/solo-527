<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">近效期预警提醒</h2>
      <n-space>
        <n-button @click="exportReport" v-if="auth.isPurchaser">
          <template #icon><n-icon><BarChartOutline /></n-icon></template>
          导出报表
        </n-button>
        <n-button type="primary" @click="loadData" :loading="loading">刷新</n-button>
      </n-space>
    </div>

    <n-space style="margin-bottom: 16px">
      <n-tag v-for="s in statTags" :key="s.key" :type="s.type" :bordered="false" size="large" round :class="s.cls">
        {{ s.label }}: {{ stats[s.key] || 0 }}
      </n-tag>
    </n-space>

    <div class="filter-bar">
      <n-form inline :model="filters">
        <n-form-item label="状态">
          <n-select v-model:value="filters.status" :options="statusOptions" clearable placeholder="全部" style="width: 140px" />
        </n-form-item>
        <n-form-item label="预警级别">
          <n-select v-model:value="filters.level" :options="levelOptions" clearable placeholder="全部" style="width: 120px" />
        </n-form-item>
        <n-form-item label="批号">
          <n-input v-model:value="filters.batch_no" placeholder="批号关键词" clearable style="width: 160px" />
        </n-form-item>
        <n-form-item><n-button type="primary" @click="loadData">查询</n-button></n-form-item>
      </n-form>
    </div>

    <div class="content-area">
      <n-data-table
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :pagination="pagination"
        @update:page="p => { pagination.page = p; loadData() }"
        @update:page-size="s => { pagination.pageSize = s; pagination.page = 1; loadData() }"
        bordered striped
      >
        <template #level="{ row }">
          <n-tag :type="levelTagType(row.reminder_level)" size="small" :bordered="false" :class="'tag-' + row.reminder_level">
            {{ levelText(row.reminder_level) }}
          </n-tag>
        </template>
        <template #status="{ row }">
          <n-tag :type="statusTagType(row.status)" size="small">{{ statusText(row.status) }}</n-tag>
        </template>
        <template #duration="{ row }">
          <span v-if="row.handle_duration_minutes">{{ formatDuration(row.handle_duration_minutes) }}</span>
          <span v-else>-</span>
        </template>
        <template #action="{ row }">
          <n-button size="small" type="primary" @click="openHandle(row)" v-if="row.status === 'pending' && auth.isPurchaser">
            处理
          </n-button>
          <n-button size="small" @click="showDetail(row)">详情</n-button>
        </template>
      </n-data-table>
    </div>

    <n-modal v-model:show="handleModal.show" preset="card" title="处理效期提醒" style="width: 520px">
      <n-descriptions v-if="handleModal.row" bordered :column="1" label-placement="left" size="small" style="margin-bottom: 16px">
        <n-descriptions-item label="批号">{{ handleModal.row.batch?.batch_no }}</n-descriptions-item>
        <n-descriptions-item label="药品">{{ handleModal.row.batch?.medicine?.name }} {{ handleModal.row.batch?.medicine?.specification }}</n-descriptions-item>
        <n-descriptions-item label="距效期">{{ handleModal.row.days_to_expiry }} 天</n-descriptions-item>
        <n-descriptions-item label="建议措施">{{ handleModal.row.suggested_action }}</n-descriptions-item>
      </n-descriptions>
      <n-form :model="handleForm" label-placement="left" label-width="100px">
        <n-form-item label="处理结果">
          <n-select v-model:value="handleForm.status" :options="handleStatusOptions" />
        </n-form-item>
        <n-form-item label="处理说明" required>
          <n-input v-model:value="handleForm.handle_remark" type="textarea" :rows="4" placeholder="请填写处理措施和结果" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="handleModal.show = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="confirmHandle">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import {
  NSpace, NButton, NIcon, NForm, NFormItem, NInput, NSelect, NDataTable, NModal,
  NTag, NDescriptions, NDescriptionsItem, useMessage, useDialog
} from 'naive-ui'
import { BarChartOutline } from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()
const loading = ref(false); const saving = ref(false)

const filters = reactive({ status: null as any, level: null as any, batch_no: '' })
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const dataList = ref<any[]>([])
const stats = ref<any>({})
const statTags = computed(() => [
  { key: 'pending', label: '待处理', type: 'warning', cls: 'tag-high' },
  { key: 'critical', label: '紧急级', type: 'error', cls: 'tag-critical' },
  { key: 'high', label: '高级', type: 'warning', cls: 'tag-high' },
  { key: 'medium', label: '中级', type: 'info', cls: 'tag-medium' }
])

const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '已处理', value: 'processed' },
  { label: '已忽略', value: 'ignored' }
]
const levelOptions = [
  { label: '紧急', value: 'critical' },
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
]
const handleStatusOptions = [
  { label: '已处理', value: 'processed' },
  { label: '已忽略', value: 'ignored' }
]

const columns = [
  { title: '级别', key: 'level', width: 90 },
  { title: '批号', key: ['batch', 'batch_no'], width: 140, render: (r: any) => r.batch?.batch_no },
  { title: '药品名称', key: 'med_name', width: 180, render: (r: any) => r.batch?.medicine?.name },
  { title: '规格', key: 'med_spec', width: 120, render: (r: any) => r.batch?.medicine?.specification },
  { title: '距效期', key: 'days_to_expiry', width: 100, render: (r: any) => `${r.days_to_expiry} 天` },
  { title: '当前库存', key: 'current_stock', width: 100 },
  { title: '有效期', key: 'expiry', width: 120, render: (r: any) => r.batch?.expiry_date },
  { title: '建议措施', key: 'suggested_action', width: 180, ellipsis: { tooltip: true } },
  { title: '状态', key: 'status', width: 90 },
  { title: '处理人', key: ['handler', 'full_name'], width: 100, render: (r: any) => r.handler?.full_name || '-' },
  { title: '办理时长', key: 'duration', width: 120 },
  { title: '创建时间', key: 'created_at', width: 160, render: (r: any) => r.created_at?.slice(0, 16).replace('T', ' ') },
  { title: '操作', key: 'action', width: 140, fixed: 'right' }
]

function levelTagType(level: string) {
  const m: Record<string, any> = { critical: 'error', high: 'warning', medium: 'info', low: 'success' }
  return m[level] || 'default'
}
function levelText(level: string) {
  const m: Record<string, string> = { critical: '紧急', high: '高', medium: '中', low: '低' }
  return m[level] || level
}
function statusTagType(s: string) {
  const m: Record<string, any> = { pending: 'warning', processed: 'success', ignored: 'default' }
  return m[s] || 'default'
}
function statusText(s: string) {
  const m: Record<string, string> = { pending: '待处理', processed: '已处理', ignored: '已忽略' }
  return m[s] || s
}
function formatDuration(mins: number) {
  if (mins < 60) return `${mins} 分钟`
  const h = Math.floor(mins / 60); const m = mins % 60
  if (h < 24) return `${h} 小时 ${m} 分`
  const d = Math.floor(h / 24); const hh = h % 24
  return `${d} 天 ${hh} 小时`
}

const handleModal = reactive({ show: false, row: null as any })
const handleForm = reactive({ status: 'processed', handle_remark: '' })
function openHandle(row: any) {
  handleModal.row = row
  handleForm.status = 'processed'; handleForm.handle_remark = ''
  handleModal.show = true
}
function showDetail(row: any) {
  dialog.info({
    title: '提醒详情',
    content: `批号: ${row.batch?.batch_no}\n药品: ${row.batch?.medicine?.name}\n距效期: ${row.days_to_expiry}天\n建议: ${row.suggested_action}\n处理备注: ${row.handle_remark || '无'}`,
    positiveText: '关闭'
  })
}
async function confirmHandle() {
  if (!handleForm.handle_remark.trim()) return message.warning('请填写处理说明')
  try {
    saving.value = true
    await apiClient.post<any>(`/reminders/${handleModal.row.id}/handle`, handleForm)
    message.success('处理成功')
    handleModal.show = false; loadData()
  } catch (e: any) { message.error(e?.detail || '操作失败') }
  finally { saving.value = false }
}
async function exportReport() {
  try {
    await apiClient.post<any>('/reports', {
      report_type: 'near_expiry',
      report_name: '近效期提醒报表',
      filters: filters
    })
    message.success('报表生成任务已提交，请在报表中心查看')
  } catch (e: any) { message.error(e?.detail || '导出失败') }
}
async function loadData() {
  loading.value = true
  try {
    const [res, st] = await Promise.all([
      apiClient.get<any>('/reminders', {
        page: pagination.page, page_size: pagination.pageSize, ...filters
      }),
      apiClient.get<any>('/reminders/stats').catch(() => ({}))
    ])
    dataList.value = res.items || []; pagination.itemCount = res.total || 0
    stats.value = st || {}
  } catch (e: any) { message.error(e?.detail || '加载失败') }
  finally { loading.value = false }
}
onMounted(() => { auth.init(); if (!auth.isLoggedIn) return navigateTo('/login'); loadData() })
definePageMeta({ layout: 'default' })
</script>
