<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">补货建议筛选入口</h2>
      <n-tag type="warning" size="large">批量派发 | 快速分配采购任务</n-tag>
    </div>

    <n-alert type="warning" show-icon style="margin-bottom: 16px">
      管理端专用：多维度筛选补货建议，批量分配采购员，减少人工逐条处理的繁琐。
    </n-alert>

    <div class="filter-bar">
      <n-form inline :model="filters" label-placement="top">
        <n-form-item label="优先级">
          <n-select v-model:value="filters.priority" :options="priorityOptions" multiple clearable style="width: 220px" />
        </n-form-item>
        <n-form-item label="状态">
          <n-select v-model:value="filters.status" :options="statusOptions" multiple clearable style="width: 240px" />
        </n-form-item>
        <n-form-item label="指派采购员">
          <n-select v-model:value="filters.purchaser_id" :options="purchaserOptions" clearable filterable style="width: 180px" />
        </n-form-item>
        <n-form-item label="供应商">
          <n-select v-model:value="filters.supplier_id" :options="supplierOptions" multiple filterable clearable style="width: 200px" />
        </n-form-item>
        <n-form-item label="库存缺口(≥)">
          <n-input-number v-model:value="filters.min_gap" :min="1" style="width: 140px" placeholder="数量差" />
        </n-form-item>
        <n-form-item label="建议补货量(≥)">
          <n-input-number v-model:value="filters.min_qty" :min="1" style="width: 140px" />
        </n-form-item>
      </n-form>
      <n-space justify="end" style="margin-top: 12px">
        <n-button @click="resetFilters">重置</n-button>
        <n-button type="primary" :loading="loading" @click="loadData">筛选查询</n-button>
        <n-button type="success" @click="showBatchAssign = true" v-if="filteredList.length">
          <template #icon><n-icon><PeopleOutline /></n-icon></template>
          批量分配 ({{ filteredList.length }})
        </n-button>
      </n-space>
    </div>

    <n-card style="margin-bottom: 16px">
      <n-space size="large" wrap>
        <n-statistic label="匹配建议数" :value="pagination.itemCount" />
        <n-statistic label="紧急级" :value="levelCounts.critical" value-style="color: #d03050" />
        <n-statistic label="高优先级" :value="levelCounts.high" value-style="color: #f0a020" />
        <n-statistic label="待分配" :value="statusCounts.pending" />
        <n-statistic label="处理中" :value="statusCounts.in_progress" />
        <n-statistic label="建议总补货量" :value="totalSuggestedQty" />
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
        <template #priority="{ row }">
          <n-tag :type="levelTagType(row.priority)" size="small" :bordered="false" :class="'tag-' + row.priority">
            {{ levelText(row.priority) }}
          </n-tag>
        </template>
        <template #status="{ row }">
          <n-tag :type="statusTagType(row.status)" size="small">{{ statusText(row.status) }}</n-tag>
        </template>
        <template #gap="{ row }">
          <span class="high">{{ (row.suggested_quantity || 0) - (row.current_stock || 0) }}</span>
        </template>
      </n-data-table>
    </div>

    <n-modal v-model:show="showBatchAssign" preset="card" title="批量分配补货任务" style="width: 480px">
      <n-form label-placement="left" label-width="100px">
        <n-form-item label="选中条数">{{ filteredList.length }} 条</n-form-item>
        <n-form-item label="分配给" required>
          <n-select v-model:value="batchPurchaser" :options="purchaserOptions" filterable />
        </n-form-item>
        <n-form-item label="新状态">
          <n-select v-model:value="batchStatus" :options="assignStatusOptions" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showBatchAssign = false">取消</n-button>
          <n-button type="primary" :loading="assigning" @click="confirmBatchAssign">确认分配</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  NSpace, NButton, NIcon, NForm, NFormItem, NInputNumber, NSelect, NDataTable,
  NTag, NAlert, NCard, NStatistic, NModal, useMessage
} from 'naive-ui'
import { PeopleOutline } from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const auth = useAuthStore()
const loading = ref(false); const assigning = ref(false)

const filters = reactive({
  priority: null as any, status: null as any, purchaser_id: null as any,
  supplier_id: null as any, min_gap: null as any, min_qty: null as any
})
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const dataList = ref<any[]>([])
const purchaserOptions = ref<any[]>([])
const supplierOptions = ref<any[]>([])

const priorityOptions = [
  { label: '紧急', value: 'critical' },
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
]
const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '已分配', value: 'assigned' },
  { label: '采购中', value: 'in_progress' },
  { label: '已下单', value: 'ordered' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]
const assignStatusOptions = [
  { label: '保持现状', value: '' },
  { label: '已分配', value: 'assigned' },
  { label: '采购中', value: 'in_progress' }
]

const columns = [
  { title: 'ID', key: 'id', width: 70 },
  { title: '优先级', key: 'priority', width: 100 },
  { title: '药品编码', key: ['medicine', 'code'], width: 100, render: (r: any) => r.medicine?.code },
  { title: '药品名称', key: ['medicine', 'name'], width: 160, render: (r: any) => r.medicine?.name },
  { title: '规格', key: ['medicine', 'specification'], width: 120, render: (r: any) => r.medicine?.specification },
  { title: '供应商', key: 'sup', width: 140, render: (r: any) => r.medicine?.supplier?.name || '-' },
  { title: '当前库存', key: 'current_stock', width: 100 },
  { title: '安全库存', key: 'safety_stock', width: 100 },
  { title: '补货点', key: 'reorder_point', width: 90 },
  { title: '建议补货量', key: 'suggested_quantity', width: 110 },
  { title: '最大库存', key: 'max_stock', width: 100 },
  { title: '缺口', key: 'gap', width: 90 },
  { title: '状态', key: 'status', width: 90 },
  { title: '采购员', key: 'purchaser', width: 100, render: (r: any) => r.purchaser?.full_name || '-' },
  { title: '补货原因', key: 'suggestion_reason', width: 200, ellipsis: { tooltip: true } }
]

const filteredList = computed(() => {
  let list = [...dataList.value]
  if (filters.min_gap) list = list.filter(r => (r.suggested_quantity || 0) - (r.current_stock || 0) >= filters.min_gap)
  if (filters.min_qty) list = list.filter(r => (r.suggested_quantity || 0) >= filters.min_qty)
  if (filters.priority?.length) list = list.filter(r => filters.priority.includes(r.priority))
  if (filters.status?.length) list = list.filter(r => filters.status.includes(r.status))
  if (filters.purchaser_id) list = list.filter(r => r.purchaser_id === filters.purchaser_id)
  if (filters.supplier_id?.length) list = list.filter(r => filters.supplier_id.includes(r.medicine?.supplier_id))
  return list
})
const levelCounts = computed(() => ({
  critical: filteredList.value.filter(r => r.priority === 'critical').length,
  high: filteredList.value.filter(r => r.priority === 'high').length,
  medium: filteredList.value.filter(r => r.priority === 'medium').length
}))
const statusCounts = computed(() => ({
  pending: filteredList.value.filter(r => r.status === 'pending').length,
  in_progress: filteredList.value.filter(r => ['assigned', 'in_progress', 'ordered'].includes(r.status)).length
}))
const totalSuggestedQty = computed(() => filteredList.value.reduce((s, r) => s + (r.suggested_quantity || 0), 0))

function levelTagType(level: string) {
  const m: Record<string, any> = { critical: 'error', high: 'warning', medium: 'info', low: 'success' }
  return m[level] || 'default'
}
function levelText(level: string) {
  const m: Record<string, string> = { critical: '紧急', high: '高', medium: '中', low: '低' }
  return m[level] || level
}
function statusTagType(s: string) {
  const m: Record<string, any> = {
    pending: 'warning', assigned: 'info', in_progress: 'info',
    ordered: 'primary', completed: 'success', cancelled: 'default'
  }
  return m[s] || 'default'
}
function statusText(s: string) {
  const m: Record<string, string> = {
    pending: '待处理', assigned: '已分配', in_progress: '采购中',
    ordered: '已下单', completed: '已完成', cancelled: '已取消'
  }
  return m[s] || s
}

const showBatchAssign = ref(false)
const batchPurchaser = ref<number | null>(null)
const batchStatus = ref('assigned')
async function confirmBatchAssign() {
  if (!batchPurchaser.value) return message.warning('请选择采购员')
  try {
    assigning.value = true
    let success = 0
    for (const r of filteredList.value) {
      try {
        await apiClient.post<any>(`/replenish/${r.id}/assign`, undefined, { params: { purchaser_id: batchPurchaser.value } })
        if (batchStatus.value) {
          await apiClient.post<any>(`/replenish/${r.id}/status`, undefined, { params: { new_status: batchStatus.value } })
        }
        success++
      } catch (e) {}
    }
    message.success(`批量分配完成，成功 ${success} 条`)
    showBatchAssign.value = false; loadData()
  } catch (e: any) { message.error(e?.detail || '操作失败') }
  finally { assigning.value = false }
}
function resetFilters() {
  Object.assign(filters, {
    priority: null, status: null, purchaser_id: null, supplier_id: null,
    min_gap: null, min_qty: null
  }); loadData()
}
async function loadMeta() {
  try {
    const [purs, sups] = await Promise.all([
      apiClient.get<any>('/users/options/purchasers'),
      apiClient.get<any>('/suppliers', { page: 1, page_size: 500 })
    ])
    purchaserOptions.value = purs || []
    supplierOptions.value = (sups.items || []).map((x: any) => ({ label: x.name, value: x.id }))
  } catch (e) {}
}
async function loadData() {
  loading.value = true
  try {
    const res = await apiClient.get<any>('/replenish', {
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
  loadMeta(); loadData()
})
definePageMeta({ layout: 'default' })
</script>
