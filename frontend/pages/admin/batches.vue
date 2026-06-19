<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">批次效期筛选入口</h2>
      <n-tag type="info" size="large">批量操作 | 减少人工搬运</n-tag>
    </div>

    <n-alert type="info" show-icon style="margin-bottom: 16px">
      管理端专用：可通过多维度筛选快速定位问题批次，批量导出、派发处理任务，减少人工搬数据。
    </n-alert>

    <div class="filter-bar">
      <n-form inline :model="filters" label-placement="top">
        <n-form-item label="效期范围">
          <n-date-picker v-model:value="filters.expiry_range" type="daterange" value-format="YYYY-MM-DD" clearable style="width: 260px" />
        </n-form-item>
        <n-form-item label="剩余天数 (≤)">
          <n-input-number v-model:value="filters.days_left" :min="1" placeholder="例如: 90" style="width: 140px" />
        </n-form-item>
        <n-form-item label="批次状态">
          <n-select v-model:value="filters.status" :options="statusOptions" multiple clearable style="width: 200px" />
        </n-form-item>
        <n-form-item label="供应商">
          <n-select v-model:value="filters.supplier_id" :options="supplierOptions" multiple filterable clearable style="width: 200px" />
        </n-form-item>
        <n-form-item label="存放库位">
          <n-select v-model:value="filters.location_id" :options="locationOptions" multiple filterable clearable style="width: 200px" />
        </n-form-item>
        <n-form-item label="是否含签收差异">
          <n-select v-model:value="filters.has_diff" clearable style="width: 140px">
            <n-select-option :value="true">有差异</n-select-option>
            <n-select-option :value="false">无差异</n-select-option>
          </n-select>
        </n-form-item>
        <n-form-item label="关键词 (批号/药品)">
          <n-input v-model:value="filters.keyword" clearable placeholder="模糊搜索" style="width: 200px" />
        </n-form-item>
      </n-form>
      <n-space justify="end" style="margin-top: 12px">
        <n-button @click="resetFilters">重置筛选</n-button>
        <n-button type="primary" :loading="loading" @click="loadData">
          <template #icon><n-icon><SearchOutline /></n-icon></template>
          筛选查询
        </n-button>
        <n-button type="warning" v-if="dataList.length" @click="exportSelected">
          <template #icon><n-icon><DownloadOutline /></n-icon></template>
          导出筛选结果
        </n-button>
      </n-space>
    </div>

    <n-card style="margin-bottom: 16px">
      <n-space size="large" wrap>
        <n-statistic label="筛选匹配批次" :value="pagination.itemCount" />
        <n-statistic label="其中近效期(≤30天)" :value="criticalCount" value-style="color: #d03050" />
        <n-statistic label="含签收差异" :value="diffCount" value-style="color: #f0a020" />
        <n-statistic label="总库存数量" :value="totalQty" />
        <n-statistic label="总库存金额" :value="totalAmount.toFixed(2)" prefix="¥" value-style="color: #18a058" />
      </n-space>
    </n-card>

    <div class="content-area">
      <n-data-table
        :columns="columns"
        :data="dataList"
        :loading="loading"
        :pagination="pagination"
        @update:page="p => { pagination.page = p; loadData() }"
        @update:page-size="s => { pagination.pageSize = s; pagination.page = 1; loadData() }"
        bordered striped
        :row-props="(row: any) => ({ style: highlightRow(row) })"
      >
        <template #expiry="{ row }">
          <n-tag :type="expiryTagType(row)" size="small" :class="expiryTagClass(row)">
            {{ row.expiry_date }} ({{ daysLeft(row) }}天)
          </n-tag>
        </template>
      </n-data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  NSpace, NButton, NIcon, NForm, NFormItem, NInput, NSelect, NSelectOption,
  NDataTable, NTag, NAlert, NCard, NStatistic, NInputNumber, NDatePicker,
  useMessage
} from 'naive-ui'
import { SearchOutline, DownloadOutline } from '@vicons/ionicons5'
import dayjs from 'dayjs'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const auth = useAuthStore()
const loading = ref(false)

const filters = reactive({
  expiry_range: null as any, days_left: null as any, status: null as any,
  supplier_id: null as any, location_id: null as any, has_diff: null as any, keyword: ''
})
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const dataList = ref<any[]>([])
const supplierOptions = ref<any[]>([])
const locationOptions = ref<any[]>([])

const statusOptions = [
  { label: '在库', value: 'in_stock' },
  { label: '部分出库', value: 'partial' },
  { label: '售罄', value: 'sold_out' },
  { label: '已过期', value: 'expired' }
]

const columns = [
  { title: '批号', key: 'batch_no', width: 140, fixed: 'left' },
  { title: '药品', key: ['medicine', 'name'], width: 160, render: (r: any) => r.medicine?.name },
  { title: '规格', key: ['medicine', 'specification'], width: 120, render: (r: any) => r.medicine?.specification },
  { title: '供应商', key: ['supplier', 'name'], width: 140, render: (r: any) => r.supplier?.name || '-' },
  { title: '库位', key: ['location', 'name'], width: 120, render: (r: any) => r.location?.name || '-' },
  { title: '生产日期', key: 'production_date', width: 110 },
  { title: '有效期(剩)', key: 'expiry', width: 170 },
  { title: '入库数量', key: 'quantity', width: 90 },
  { title: '采购价', key: 'purchase_price', width: 90, render: (r: any) => r.purchase_price ? '¥' + r.purchase_price : '-' },
  { title: '签收差异', key: 'sign_difference', width: 100, render: (r: any) => {
    const v = Number(r.sign_difference || 0)
    return v ? h(NTag, { type: 'warning', size: 'small' }, () => '¥' + v) : '-'
  } },
  { title: '状态', key: 'status', width: 100, render: (r: any) => h(NTag, { size: 'small' }, () => statusText(r.status)) },
  { title: '创建人', key: ['creator', 'full_name'], width: 100, render: (r: any) => r.creator?.full_name || '-' },
  { title: '创建时间', key: 'created_at', width: 160, render: (r: any) => r.created_at?.slice(0, 16).replace('T', ' ') }
]

import { h } from 'vue'
const criticalCount = computed(() => dataList.value.filter(r => daysLeft(r) <= 30).length)
const diffCount = computed(() => dataList.value.filter(r => Number(r.sign_difference || 0) !== 0).length)
const totalQty = computed(() => dataList.value.reduce((s, r) => s + (r.quantity || 0), 0))
const totalAmount = computed(() => dataList.value.reduce((s, r) => s + ((r.quantity || 0) * Number(r.purchase_price || 0)), 0))

function statusText(s: string) {
  const m: Record<string, string> = { in_stock: '在库', partial: '部分出库', sold_out: '售罄', expired: '已过期', recalled: '已召回' }
  return m[s] || s
}
function daysLeft(row: any) { return dayjs(row.expiry_date).diff(dayjs(), 'day') }
function expiryTagType(row: any) {
  const d = daysLeft(row)
  if (d <= 30) return 'error'
  if (d <= 90) return 'warning'
  if (d <= 180) return 'info'
  return 'success'
}
function expiryTagClass(row: any) {
  const d = daysLeft(row)
  if (d <= 30) return 'tag-critical'
  if (d <= 90) return 'tag-high'
  if (d <= 180) return 'tag-medium'
  return 'tag-low'
}
function highlightRow(row: any) {
  const d = daysLeft(row)
  if (d <= 7) return { background: 'rgba(208,48,80,0.06)' }
  if (Number(row.sign_difference || 0) !== 0) return { background: 'rgba(240,160,32,0.06)' }
  return {}
}

function resetFilters() {
  Object.assign(filters, {
    expiry_range: null, days_left: null, status: null, supplier_id: null,
    location_id: null, has_diff: null, keyword: ''
  }); loadData()
}
async function exportSelected() {
  try {
    await apiClient.post<any>('/reports', {
      report_type: 'batch_flow',
      report_name: `批次效期筛选_${new Date().toLocaleDateString()}`,
      filters: filters
    })
    message.success('导出任务已提交，请在报表中心查看')
  } catch (e: any) { message.error(e?.detail || '操作失败') }
}
async function loadMeta() {
  try {
    const [sups, locs] = await Promise.all([
      apiClient.get<any>('/suppliers', { page: 1, page_size: 500 }),
      apiClient.get<any>('/locations', { page: 1, page_size: 500 })
    ])
    supplierOptions.value = (sups.items || []).map((x: any) => ({ label: x.name, value: x.id }))
    locationOptions.value = (locs.items || []).map((x: any) => ({ label: `${x.code} - ${x.name}`, value: x.id }))
  } catch (e) {}
}
async function loadData() {
  loading.value = true
  try {
    const params: any = { page: pagination.page, page_size: pagination.pageSize }
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.status?.length) params.status = filters.status.join(',')
    if (filters.supplier_id?.length) params.supplier_id = filters.supplier_id[0]
    if (filters.location_id?.length) params.location_id = filters.location_id[0]
    if (filters.expiry_range) {
      params.expiry_from = filters.expiry_range[0]
      params.expiry_to = filters.expiry_range[1]
    }
    if (filters.has_diff === true) params.sign_diff_only = true
    const res = await apiClient.get<any>('/batches', params)
    let list = res.items || []
    if (filters.days_left) list = list.filter((r: any) => daysLeft(r) <= filters.days_left)
    dataList.value = list
    pagination.itemCount = res.total || 0
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
