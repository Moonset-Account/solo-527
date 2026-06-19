<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">签收差异管理</h2>
      <n-tag type="error" size="large">差异追踪 | 办理留痕</n-tag>
    </div>

    <n-alert type="error" show-icon style="margin-bottom: 16px">
      管理端专用：追踪所有签收差异，完整记录办理时长、处理人、解决方案。
    </n-alert>

    <div class="filter-bar">
      <n-form inline :model="filters" label-placement="top">
        <n-form-item label="状态">
          <n-select v-model:value="filters.status" :options="statusOptions" clearable placeholder="全部" style="width: 160px" />
        </n-form-item>
        <n-form-item label="批号关键词">
          <n-input v-model:value="filters.batch_no" clearable style="width: 160px" />
        </n-form-item>
        <n-form-item label="采购单号">
          <n-input v-model:value="filters.order_no" clearable style="width: 180px" />
        </n-form-item>
        <n-form-item label="差异数量(≥)">
          <n-input-number v-model:value="filters.min_diff_qty" :min="1" style="width: 140px" />
        </n-form-item>
        <n-form-item label="差异金额(≥)">
          <n-input-number v-model:value="filters.min_diff_amt" :min="1" :precision="2" style="width: 160px" />
        </n-form-item>
      </n-form>
      <n-space justify="end" style="margin-top: 12px">
        <n-button @click="resetFilters">重置</n-button>
        <n-button type="primary" :loading="loading" @click="loadData">筛选查询</n-button>
        <n-button type="warning" @click="exportReport">导出差异报表</n-button>
      </n-space>
    </div>

    <n-card style="margin-bottom: 16px">
      <n-space size="large" wrap>
        <n-statistic label="差异总数" :value="pagination.itemCount" />
        <n-statistic label="待处理" :value="statusCounts.pending" value-style="color: #d03050" />
        <n-statistic label="处理中" :value="statusCounts.processing" />
        <n-statistic label="已处理" :value="statusCounts.resolved" value-style="color: #18a058" />
        <n-statistic label="差异总数量" :value="totalDiffQty" />
        <n-statistic label="差异总金额" :value="totalDiffAmt.toFixed(2)" prefix="¥" value-style="color: #f0a020" />
        <n-statistic label="平均办理时长(分)" :value="avgDuration" />
      </n-space>
    </n-card>

    <div class="content-area">
      <n-data-table
        :columns="columns"
        :data="filteredList"
        :loading="loading"
        :pagination="pagination"
        @update:page="p => { pagination.page = p; loadData() }"
        @update:page-size="s => { pagination.pageSize = s; pagination.page = 1; loadData() }"
        bordered striped
      >
        <template #diff_qty="{ row }">
          <span :class="row.difference_quantity < 0 ? 'critical' : 'high'">{{ row.difference_quantity }}</span>
        </template>
        <template #diff_amt="{ row }">
          <span :class="Number(row.difference_amount || 0) < 0 ? 'critical' : 'high'">
            ¥{{ Number(row.difference_amount || 0).toFixed(2) }}
          </span>
        </template>
        <template #status="{ row }">
          <n-tag :type="statusTagType(row.status)" size="small">{{ statusText(row.status) }}</n-tag>
        </template>
        <template #duration="{ row }">
          <span v-if="row.handle_duration_minutes" class="medium">{{ formatDuration(row.handle_duration_minutes) }}</span>
          <span v-else style="color: #d03050">未处理</span>
        </template>
        <template #action="{ row }">
          <n-button-group size="small">
            <n-button type="primary" @click="openHandle(row)" v-if="row.status === 'pending'">处理</n-button>
            <n-button @click="viewDetail(row)">详情</n-button>
          </n-button-group>
        </template>
      </n-data-table>
    </div>

    <n-modal v-model:show="handleModal.show" preset="card" title="处理签收差异" style="width: 580px">
      <n-descriptions v-if="handleModal.row" bordered :column="2" label-placement="left" size="small" style="margin-bottom: 16px">
        <n-descriptions-item label="采购单号">{{ handleModal.row.purchase_order_no || '-' }}</n-descriptions-item>
        <n-descriptions-item label="批号">{{ handleModal.row.batch?.batch_no }}</n-descriptions-item>
        <n-descriptions-item label="药品">{{ handleModal.row.batch?.medicine?.name }}</n-descriptions-item>
        <n-descriptions-item label="规格">{{ handleModal.row.batch?.medicine?.specification }}</n-descriptions-item>
        <n-descriptions-item label="预期数量">{{ handleModal.row.expected_quantity }}</n-descriptions-item>
        <n-descriptions-item label="实际数量">{{ handleModal.row.actual_quantity }}</n-descriptions-item>
        <n-descriptions-item label="差异数量" :span="2">
          <n-tag type="error" size="small">{{ handleModal.row.difference_quantity }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="差异金额" :span="2">
          <n-tag type="error" size="small">¥{{ Number(handleModal.row.difference_amount || 0).toFixed(2) }}</n-tag>
        </n-descriptions-item>
      </n-descriptions>
      <n-form :model="handleForm" label-placement="left" label-width="100px">
        <n-form-item label="处理状态" required>
          <n-select v-model:value="handleForm.status" :options="handleStatusOptions" />
        </n-form-item>
        <n-form-item label="差异原因" required>
          <n-input v-model:value="handleForm.difference_reason" type="textarea" :rows="2" placeholder="如：运输途中损耗 / 供应商少发 / 数据录入错误..." />
        </n-form-item>
        <n-form-item label="处理方案" required>
          <n-input v-model:value="handleForm.handle_solution" type="textarea" :rows="3" placeholder="解决方案、责任人、跟进事项..." />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="handleModal.show = false">取消</n-button>
          <n-button type="primary" :loading="handling" @click="confirmHandle">确认提交</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  NSpace, NButton, NForm, NFormItem, NInput, NInputNumber, NSelect, NDataTable,
  NTag, NAlert, NCard, NStatistic, NModal, NButtonGroup, NDescriptions, NDescriptionsItem,
  useMessage, useDialog
} from 'naive-ui'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()
const loading = ref(false); const handling = ref(false)

const filters = reactive({
  status: null as any, batch_no: '', order_no: '',
  min_diff_qty: null as any, min_diff_amt: null as any
})
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const dataList = ref<any[]>([])

const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已解决', value: 'resolved' },
  { label: '已关闭', value: 'closed' }
]
const handleStatusOptions = [
  { label: '处理中', value: 'processing' },
  { label: '已解决', value: 'resolved' },
  { label: '已关闭', value: 'closed' }
]

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '采购单号', key: 'purchase_order_no', width: 150, render: (r: any) => r.purchase_order_no || '-' },
  { title: '批号', key: ['batch', 'batch_no'], width: 140, render: (r: any) => r.batch?.batch_no },
  { title: '药品', key: 'med', width: 160, render: (r: any) => r.batch?.medicine?.name },
  { title: '规格', key: 'spec', width: 120, render: (r: any) => r.batch?.medicine?.specification },
  { title: '预期数量', key: 'expected_quantity', width: 100 },
  { title: '实际数量', key: 'actual_quantity', width: 100 },
  { title: '差异数量', key: 'diff_qty', width: 100 },
  { title: '差异金额', key: 'diff_amt', width: 110 },
  { title: '差异原因', key: 'difference_reason', width: 160, ellipsis: { tooltip: true }, render: (r: any) => r.difference_reason || '-' },
  { title: '状态', key: 'status', width: 90 },
  { title: '处理人', key: 'handler', width: 100, render: (r: any) => r.handler?.full_name || '-' },
  { title: '办理时长', key: 'duration', width: 120 },
  { title: '创建时间', key: 'created_at', width: 160, render: (r: any) => r.created_at?.slice(0, 16).replace('T', ' ') },
  { title: '操作', key: 'action', width: 140, fixed: 'right' }
]

const filteredList = computed(() => {
  let list = [...dataList.value]
  if (filters.status) list = list.filter(r => r.status === filters.status)
  if (filters.batch_no) list = list.filter(r => r.batch?.batch_no?.includes(filters.batch_no))
  if (filters.order_no) list = list.filter(r => (r.purchase_order_no || '').includes(filters.order_no))
  if (filters.min_diff_qty) list = list.filter(r => Math.abs(r.difference_quantity || 0) >= filters.min_diff_qty)
  if (filters.min_diff_amt) list = list.filter(r => Math.abs(Number(r.difference_amount || 0)) >= filters.min_diff_amt)
  return list
})
const statusCounts = computed(() => ({
  pending: filteredList.value.filter(r => r.status === 'pending').length,
  processing: filteredList.value.filter(r => r.status === 'processing').length,
  resolved: filteredList.value.filter(r => ['resolved', 'closed'].includes(r.status)).length
}))
const totalDiffQty = computed(() => filteredList.value.reduce((s, r) => s + Math.abs(r.difference_quantity || 0), 0))
const totalDiffAmt = computed(() => filteredList.value.reduce((s, r) => s + Math.abs(Number(r.difference_amount || 0)), 0))
const avgDuration = computed(() => {
  const handled = filteredList.value.filter(r => r.handle_duration_minutes)
  if (!handled.length) return 0
  return Math.round(handled.reduce((s, r) => s + r.handle_duration_minutes, 0) / handled.length)
})

function statusTagType(s: string) {
  const m: Record<string, any> = { pending: 'error', processing: 'warning', resolved: 'success', closed: 'default' }
  return m[s] || 'default'
}
function statusText(s: string) {
  const m: Record<string, string> = { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }
  return m[s] || s
}
function formatDuration(mins: number) {
  if (mins < 60) return `${mins} 分钟`
  const h = Math.floor(mins / 60); const m = mins % 60
  if (h < 24) return `${h}h ${m}m`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

const handleModal = reactive({ show: false, row: null as any })
const handleForm = reactive({ status: 'resolved' as any, difference_reason: '', handle_solution: '' })
function openHandle(row: any) {
  handleModal.row = row
  handleForm.status = 'resolved'; handleForm.difference_reason = ''; handleForm.handle_solution = ''
  handleModal.show = true
}
function viewDetail(row: any) {
  dialog.info({
    title: `签收差异 #${row.id}`,
    content: `采购单号: ${row.purchase_order_no || '-'}\n批号: ${row.batch?.batch_no}\n差异: ${row.difference_quantity} / ¥${Number(row.difference_amount || 0).toFixed(2)}\n原因: ${row.difference_reason || '未填写'}\n方案: ${row.handle_solution || '未填写'}\n处理人: ${row.handler?.full_name || '-'}\n办理时长: ${row.handle_duration_minutes ? formatDuration(row.handle_duration_minutes) : '未处理'}`,
    positiveText: '关闭'
  })
}
async function confirmHandle() {
  if (!handleForm.difference_reason.trim()) return message.warning('请填写差异原因')
  if (!handleForm.handle_solution.trim()) return message.warning('请填写处理方案')
  try {
    handling.value = true
    await apiClient.post<any>(`/sign-differences/${handleModal.row.id}/handle`, handleForm)
    message.success('处理已提交'); handleModal.show = false; loadData()
  } catch (e: any) { message.error(e?.detail || '操作失败') }
  finally { handling.value = false }
}
function resetFilters() {
  Object.assign(filters, {
    status: null, batch_no: '', order_no: '', min_diff_qty: null, min_diff_amt: null
  }); loadData()
}
async function exportReport() {
  try {
    await apiClient.post<any>('/reports', {
      report_type: 'sign_difference',
      report_name: `签收差异报表_${new Date().toLocaleDateString()}`,
      filters: filters
    })
    message.success('导出任务已提交')
  } catch (e: any) { message.error(e?.detail || '失败') }
}
async function loadData() {
  loading.value = true
  try {
    const res = await apiClient.get<any>('/sign-differences', {
      page: pagination.page, page_size: pagination.pageSize
    })
    dataList.value = res.items || []; pagination.itemCount = res.total || 0
  } catch (e: any) { message.error(e?.detail || '加载失败') }
  finally { loading.value = false }
}
onMounted(() => {
  auth.init()
  if (!auth.isLoggedIn) return navigateTo('/login')
  if (!auth.canAccessAdmin) {
    message.warning('无权限访问管理中心')
    return navigateTo('/')
  }
  loadData()
})
definePageMeta({ layout: 'default' })
</script>
