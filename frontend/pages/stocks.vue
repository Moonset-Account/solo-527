<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">实时库存监控</h2>
      <n-space>
        <n-button v-if="auth.isWarehouse" @click="openFlowModal">
          <template #icon><n-icon><SwapHorizontal /></n-icon></template>
          库存流转
        </n-button>
      </n-space>
    </div>

    <n-space style="margin-bottom: 16px" size="large">
      <n-statistic label="库存品规数" :value="summary.total_skus || 0" />
      <n-statistic label="库存总数量" :value="summary.total_stock || 0" />
      <n-statistic label="库存总金额" :value="summary.total_value || 0" :precision="2" prefix="¥" />
      <n-statistic label="低库存品规" :value="summary.low_stock_count || 0" />
    </n-space>

    <div class="filter-bar">
      <n-form inline :model="filters">
        <n-form-item label="关键词">
          <n-input v-model:value="filters.keyword" placeholder="批号/药品/编码" clearable style="width: 220px" />
        </n-form-item>
        <n-form-item label="库位">
          <n-select v-model:value="filters.location_id" :options="locationOptions" clearable filterable placeholder="全部" style="width: 200px" />
        </n-form-item>
        <n-form-item label="仅低库存">
          <n-switch v-model:value="filters.low_stock_only" />
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
        <template #quantity="{ row }">
          <span :class="row.quantity === 0 ? 'critical' : ''">{{ row.quantity }}</span>
        </template>
        <template #available_qty="{ row }">
          <span :class="row.available_quantity < 10 ? 'high' : ''">{{ row.available_quantity }}</span>
        </template>
        <template #expiry="{ row }">
          <n-tag v-if="row.batch" :type="expiryTagType(row.batch)" size="small" :class="expiryTagClass(row.batch)">
            {{ row.batch.expiry_date }}
          </n-tag>
          <span v-else>-</span>
        </template>
      </n-data-table>
    </div>

    <n-modal v-model:show="flowModal.show" preset="card" title="库存流转登记" style="width: 620px">
      <n-form ref="flowFormRef" :model="flowForm" :rules="flowRules" label-placement="left" label-width="110px">
        <n-form-item label="流转类型" path="flow_type">
          <n-select v-model:value="flowForm.flow_type" :options="flowTypeOptions" />
        </n-form-item>
        <n-form-item label="批次" path="batch_id">
          <n-select v-model:value="flowForm.batch_id" :options="batchOptions" filterable clearable />
        </n-form-item>
        <n-form-item label="数量" path="quantity">
          <n-input-number v-model:value="flowForm.quantity" :min="1" style="width: 100%" />
        </n-form-item>
        <n-form-item label="源库位" v-if="['sales_out', 'transfer_out', 'return_out', 'scrap'].includes(flowForm.flow_type)">
          <n-select v-model:value="flowForm.from_location_id" :options="locationOptions" filterable clearable />
        </n-form-item>
        <n-form-item label="目标库位" v-if="['purchase_in', 'transfer_in', 'return_in', 'adjustment'].includes(flowForm.flow_type)">
          <n-select v-model:value="flowForm.to_location_id" :options="locationOptions" filterable clearable />
        </n-form-item>
        <n-form-item label="关联单号">
          <n-input v-model:value="flowForm.reference_no" />
        </n-form-item>
        <n-form-item label="往来单位">
          <n-input v-model:value="flowForm.counterparty" />
        </n-form-item>
        <n-form-item label="操作时间">
          <n-date-picker v-model:value="flowForm.operation_time" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="flowForm.remark" type="textarea" :rows="2" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="flowModal.show = false">取消</n-button>
          <n-button type="primary" :loading="flowSaving" @click="saveFlow">确认</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  NSpace, NButton, NIcon, NForm, NFormItem, NInput, NSelect, NDataTable, NModal,
  NInputNumber, NSwitch, NDatePicker, NStatistic, NTag, useMessage
} from 'naive-ui'
import { SwapHorizontal } from '@vicons/ionicons5'
import dayjs from 'dayjs'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const auth = useAuthStore()
const loading = ref(false); const flowSaving = ref(false); const flowFormRef = ref()

const filters = reactive({ keyword: '', location_id: null as any, low_stock_only: false })
const pagination = reactive({ page: 1, pageSize: 20, itemCount: 0 })
const dataList = ref<any[]>([])
const summary = ref<any>({})
const locationOptions = ref<any[]>([])
const batchOptions = ref<any[]>([])

const flowTypeOptions = [
  { label: '采购入库', value: 'purchase_in' },
  { label: '销售出库', value: 'sales_out' },
  { label: '调拨入库', value: 'transfer_in' },
  { label: '调拨出库', value: 'transfer_out' },
  { label: '库存调整', value: 'adjustment' },
  { label: '退货入库', value: 'return_in' },
  { label: '退货出库', value: 'return_out' },
  { label: '报废处理', value: 'scrap' }
]

const columns = [
  { title: '药品', key: 'med_name', width: 160, render: (r: any) => r.batch?.medicine?.name },
  { title: '规格', key: 'med_spec', width: 120, render: (r: any) => r.batch?.medicine?.specification },
  { title: '批号', key: ['batch', 'batch_no'], width: 140, render: (r: any) => r.batch?.batch_no },
  { title: '效期', key: 'expiry', width: 120 },
  { title: '库位', key: ['location', 'name'], width: 160, render: (r: any) => r.location?.name },
  { title: '总数量', key: 'quantity', width: 90 },
  { title: '锁定', key: 'locked_quantity', width: 80 },
  { title: '可用', key: 'available_qty', width: 90 },
  { title: '采购单价', key: 'price', width: 100, render: (r: any) => r.batch?.purchase_price ? '¥' + r.batch.purchase_price : '-' },
  { title: '最后变动', key: 'last_move_date', width: 120 }
]

function expiryTagType(batch: any) {
  const d = dayjs(batch.expiry_date).diff(dayjs(), 'day')
  if (d <= 30) return 'error'
  if (d <= 90) return 'warning'
  if (d <= 180) return 'info'
  return 'success'
}
function expiryTagClass(batch: any) {
  const d = dayjs(batch.expiry_date).diff(dayjs(), 'day')
  if (d <= 30) return 'tag-critical'
  if (d <= 90) return 'tag-high'
  if (d <= 180) return 'tag-medium'
  return 'tag-low'
}

const flowModal = reactive({ show: false })
const flowForm = reactive({
  flow_type: null as any, batch_id: null as any, quantity: 0,
  from_location_id: null as any, to_location_id: null as any,
  reference_no: '', counterparty: '', operation_time: null as any, remark: ''
})
const flowRules = {
  flow_type: { required: true, message: '请选择类型', trigger: 'change' },
  batch_id: { required: true, message: '请选择批次', trigger: 'change' },
  quantity: { required: true, type: 'number', min: 1, message: '请输入数量', trigger: 'change' }
}
function openFlowModal() {
  Object.assign(flowForm, {
    flow_type: null, batch_id: null, quantity: 0, from_location_id: null, to_location_id: null,
    reference_no: '', counterparty: '', operation_time: null, remark: ''
  })
  flowModal.show = true
}
async function saveFlow() {
  try {
    await flowFormRef.value?.validate(); flowSaving.value = true
    await apiClient.post<any>('/stocks/flow', flowForm)
    message.success('流转已登记'); flowModal.show = false; loadData()
  } catch (e: any) { message.error(e?.detail || '操作失败') }
  finally { flowSaving.value = false }
}

async function loadMeta() {
  try {
    const [locs, bats] = await Promise.all([
      apiClient.get<any>('/locations', { page: 1, page_size: 500 }),
      apiClient.get<any>('/batches', { page: 1, page_size: 1000 })
    ])
    locationOptions.value = (locs.items || []).map((x: any) => ({ label: `${x.code} - ${x.name}`, value: x.id }))
    batchOptions.value = (bats.items || []).map((x: any) => ({
      label: `${x.batch_no} ${x.medicine?.name || ''}`, value: x.id
    }))
  } catch (e) {}
}
async function loadData() {
  loading.value = true
  try {
    const [res, sum] = await Promise.all([
      apiClient.get<any>('/stocks', {
        page: pagination.page, page_size: pagination.pageSize, ...filters,
        only_positive: true
      }),
      apiClient.get<any>('/stocks/summary').catch(() => ({}))
    ])
    dataList.value = res.items || []; pagination.itemCount = res.total || 0
    summary.value = sum || {}
  } catch (e: any) { message.error(e?.detail || '加载失败') }
  finally { loading.value = false }
}
onMounted(() => { auth.init(); if (!auth.isLoggedIn) return navigateTo('/login'); loadMeta(); loadData() })
definePageMeta({ layout: 'default' })
</script>
