<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">智能补货建议</h2>
      <n-space>
        <n-button @click="exportReport" v-if="auth.isPurchaser">
          <template #icon><n-icon><BarChartOutline /></n-icon></template>
          导出补货清单
        </n-button>
        <n-button type="primary" @click="loadData" :loading="loading">
          <template #icon><n-icon><RefreshOutline /></n-icon></template>
          刷新建议
        </n-button>
      </n-space>
    </div>

    <div class="filter-bar">
      <n-form inline :model="filters">
        <n-form-item label="状态">
          <n-select v-model:value="filters.status" :options="statusOptions" clearable placeholder="全部" style="width: 140px" />
        </n-form-item>
        <n-form-item label="优先级">
          <n-select v-model:value="filters.priority" :options="priorityOptions" clearable placeholder="全部" style="width: 120px" />
        </n-form-item>
        <n-form-item label="关键词">
          <n-input v-model:value="filters.keyword" placeholder="药品名称/编码" clearable style="width: 200px" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" @click="loadData">查询</n-button>
        </n-form-item>
        <n-form-item>
          <n-button @click="resetFilters">重置</n-button>
        </n-form-item>
      </n-form>
    </div>

    <div class="content-area">
      <n-data-table
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :pagination="pagination"
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        striped
        bordered
      >
        <template #priority="{ row }">
          <n-tag :type="levelTagType(row.priority)" size="small" :bordered="false" :class="'tag-' + row.priority">
            {{ levelText(row.priority) }}
          </n-tag>
        </template>
        <template #status="{ row }">
          <n-tag :type="statusTagType(row.status)" size="small">
            {{ statusText(row.status) }}
          </n-tag>
        </template>
        <template #stock_gap="{ row }">
          <span :class="row.current_stock < row.safety_stock ? 'critical' : ''">
            {{ row.current_stock || 0 }} / {{ row.safety_stock }}
          </span>
        </template>
        <template #supplier="{ row }">
          <span>{{ row.medicine?.supplier?.name || '-' }}</span>
        </template>
        <template #action="{ row }">
          <n-dropdown
            :options="actionOptions(row)"
            @select="(k: string) => handleAction(k, row)"
            trigger="click"
          >
            <n-button size="small" type="primary" quaternary>操作</n-button>
          </n-dropdown>
        </template>
      </n-data-table>
    </div>

    <n-modal v-model:show="assignModal.show" preset="card" title="分配采购任务" style="width: 460px">
      <n-form label-placement="left" label-width="80">
        <n-form-item label="药品">
          <span>{{ assignModal.row?.medicine?.name }} - {{ assignModal.row?.medicine?.specification }}</span>
        </n-form-item>
        <n-form-item label="建议量">
          <n-tag type="warning" size="small">{{ assignModal.row?.suggested_quantity }} {{ assignModal.row?.medicine?.unit }}</n-tag>
        </n-form-item>
        <n-form-item label="采购员" required>
          <n-select v-model:value="assignModal.purchaserId" :options="purchaserOptions" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="assignModal.show = false">取消</n-button>
          <n-button type="primary" :loading="assigning" @click="confirmAssign">确认分配</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import {
  NSpace,
  NButton,
  NIcon,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NTag,
  NDataTable,
  NModal,
  NDropdown,
  useMessage,
  useDialog
} from 'naive-ui'
import { BarChartOutline, RefreshOutline } from '@vicons/ionicons5'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()
const loading = ref(false)
const assigning = ref(false)

const filters = reactive({ status: null as any, priority: null as any, keyword: '' })
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const dataList = ref<any[]>([])
const purchaserOptions = ref<any[]>([])

const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '已分配', value: 'assigned' },
  { label: '采购中', value: 'in_progress' },
  { label: '已下单', value: 'ordered' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]
const priorityOptions = [
  { label: '紧急', value: 'critical' },
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
]

const columns = [
  { title: '药品编码', key: ['medicine', 'code'], width: 110 },
  { title: '药品名称', key: ['medicine', 'name'], width: 180 },
  { title: '规格', key: ['medicine', 'specification'], width: 140 },
  { title: '供应商', key: 'supplier', width: 160 },
  { title: '当前/安全库存', key: 'stock_gap', width: 140 },
  { title: '建议补货量', key: 'suggested_quantity', width: 110 },
  { title: '补货原因', key: 'suggestion_reason', width: 200, ellipsis: { tooltip: true } },
  { title: '优先级', key: 'priority', width: 80 },
  { title: '状态', key: 'status', width: 90 },
  { title: '采购负责人', key: ['purchaser', 'full_name'], width: 100, render: (r: any) => r.purchaser?.full_name || '-' },
  { title: '创建时间', key: 'created_at', width: 170, render: (r: any) => r.created_at?.slice(0, 16).replace('T', ' ') },
  { title: '操作', key: 'action', width: 90, fixed: 'right' }
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

function actionOptions(row: any) {
  const opts: any[] = []
  if (auth.canAccessAdmin) {
    if (row.status === 'pending') {
      opts.push({ label: '分配采购员', key: 'assign' })
    }
  }
  if (auth.isPurchaser) {
    if (row.status === 'pending' || row.status === 'assigned') {
      opts.push({ label: '标记采购中', key: 'in_progress' })
    }
    if (['pending', 'assigned', 'in_progress'].includes(row.status)) {
      opts.push({ label: '标记已下单', key: 'ordered' })
      opts.push({ label: '标记完成', key: 'completed' })
    }
    if (row.status !== 'completed' && row.status !== 'cancelled') {
      opts.push({ key: 'd1', type: 'divider' })
      opts.push({ label: '取消', key: 'cancelled' })
    }
  }
  return opts.length ? opts : [{ label: '无操作权限', key: 'none', disabled: true }]
}

const assignModal = reactive({ show: false, row: null as any, purchaserId: null as any })

async function handleAction(key: string, row: any) {
  if (key === 'assign') {
    assignModal.row = row
    assignModal.show = true
    if (!purchaserOptions.value.length) {
      try { purchaserOptions.value = await apiClient.get<any>('/users/options/purchasers') } catch (e) {}
    }
  } else if (['in_progress', 'ordered', 'completed', 'cancelled'].includes(key)) {
    dialog.warning({
      title: '确认操作',
      content: `确认将此条补货建议标记为「${statusText(key)}」吗？`,
      positiveText: '确认',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await apiClient.post<any>(`/replenish/${row.id}/status`, undefined, { params: { new_status: key } })
          message.success('状态已更新')
          loadData()
        } catch (e: any) { message.error(e?.detail || '操作失败') }
      }
    })
  }
}

async function confirmAssign() {
  if (!assignModal.purchaserId) return message.warning('请选择采购员')
  try {
    assigning.value = true
    await apiClient.post<any>(`/replenish/${assignModal.row.id}/assign`, undefined, { params: { purchaser_id: assignModal.purchaserId } })
    message.success('分配成功')
    assignModal.show = false
    loadData()
  } catch (e: any) {
    message.error(e?.detail || '操作失败')
  } finally { assigning.value = false }
}

async function exportReport() {
  try {
    const res = await apiClient.post<any>('/reports', {
      report_type: 'replenish',
      report_name: '补货建议清单',
      filters: filters
    })
    message.success('报表生成任务已提交，请在报表中心查看')
  } catch (e: any) { message.error(e?.detail || '导出失败') }
}

async function loadData() {
  loading.value = true
  try {
    const res = await apiClient.get<any>('/replenish', {
      page: pagination.page,
      page_size: pagination.pageSize,
      ...filters
    })
    dataList.value = res.items || []
    pagination.itemCount = res.total || 0
  } catch (e: any) { message.error(e?.detail || '加载失败') }
  finally { loading.value = false }
}
function resetFilters() { filters.status = null; filters.priority = null; filters.keyword = ''; loadData() }
function handlePageChange(p: number) { pagination.page = p; loadData() }
function handlePageSizeChange(s: number) { pagination.pageSize = s; pagination.page = 1; loadData() }

onMounted(() => { auth.init(); if (!auth.isLoggedIn) return navigateTo('/login'); loadData() })
definePageMeta({ layout: 'default' })
</script>
