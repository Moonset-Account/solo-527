<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">缺货风险预警</h2>
      <n-space>
        <n-button type="primary" @click="loadData" :loading="loading">刷新</n-button>
      </n-space>
    </div>

    <div class="filter-bar">
      <n-form inline :model="filters">
        <n-form-item label="状态">
          <n-select v-model:value="filters.status" :options="statusOptions" clearable placeholder="全部" style="width: 140px" />
        </n-form-item>
        <n-form-item label="风险等级">
          <n-select v-model:value="filters.level" :options="levelOptions" clearable placeholder="全部" style="width: 120px" />
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
          <n-tag :type="levelTagType(row.risk_level)" size="small" :bordered="false" :class="'tag-' + row.risk_level">
            {{ levelText(row.risk_level) }}
          </n-tag>
        </template>
        <template #status="{ row }">
          <n-tag :type="statusTagType(row.status)" size="small">{{ statusText(row.status) }}</n-tag>
        </template>
        <template #days_stock="{ row }">
          <span :class="Number(row.days_of_stock) < 3 ? 'critical' : Number(row.days_of_stock) < 7 ? 'high' : ''">
            {{ row.days_of_stock ? Number(row.days_of_stock).toFixed(1) : '-' }} 天
          </span>
        </template>
        <template #action="{ row }">
          <n-button-group size="small">
            <n-button @click="goReplenish(row.medicine_id)" type="primary">补货</n-button>
            <n-button @click="resolve(row)" v-if="row.status === 'pending' && auth.isPurchaser">已处理</n-button>
          </n-button-group>
        </template>
      </n-data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  NSpace, NButton, NForm, NFormItem, NSelect, NDataTable, NTag, NButtonGroup,
  useMessage, useDialog
} from 'naive-ui'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()
const loading = ref(false)

const filters = reactive({ status: null as any, level: null as any })
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const dataList = ref<any[]>([])

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

const columns = [
  { title: '风险等级', key: 'level', width: 100 },
  { title: '药品编码', key: ['medicine', 'code'], width: 100, render: (r: any) => r.medicine?.code },
  { title: '药品名称', key: 'med_name', width: 180, render: (r: any) => r.medicine?.name },
  { title: '规格', key: 'med_spec', width: 120, render: (r: any) => r.medicine?.specification },
  { title: '供应商', key: 'sup', width: 140, render: (r: any) => r.medicine?.supplier?.name || '-' },
  { title: '当前库存', key: 'current_stock', width: 100 },
  { title: '安全库存', key: 'safety', width: 100, render: (r: any) => r.medicine?.safety_stock },
  { title: '日均消耗', key: 'avg_daily_consumption', width: 100, render: (r: any) => Number(r.avg_daily_consumption || 0).toFixed(1) },
  { title: '可销天数', key: 'days_stock', width: 100 },
  { title: '风险说明', key: 'description', width: 200, ellipsis: { tooltip: true } },
  { title: '状态', key: 'status', width: 90 },
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
function goReplenish(medId: any) {
  navigateTo(`/replenish?medicine_id=${medId}`)
}
function resolve(row: any) {
  dialog.warning({
    title: '确认',
    content: '确认标记为已处理？',
    positiveText: '确认', negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await apiClient.post<any>(`/risks/${row.id}/resolve`)
        message.success('状态已更新'); loadData()
      } catch (e: any) { message.error(e?.detail || '操作失败') }
    }
  })
}
async function loadData() {
  loading.value = true
  try {
    const res = await apiClient.get<any>('/risks', {
      page: pagination.page, page_size: pagination.pageSize, ...filters
    })
    dataList.value = res.items || []; pagination.itemCount = res.total || 0
  } catch (e: any) { message.error(e?.detail || '加载失败') }
  finally { loading.value = false }
}
onMounted(() => { auth.init(); if (!auth.isLoggedIn) return navigateTo('/login'); loadData() })
definePageMeta({ layout: 'default' })
</script>
