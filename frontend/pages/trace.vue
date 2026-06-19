<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">批号流向追踪</h2>
    </div>

    <div class="filter-bar">
      <n-form inline :model="form">
        <n-form-item label="批号" required>
          <n-input v-model:value="form.batchNo" placeholder="请输入完整批号" style="width: 260px" @keyup.enter="doTrace" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" @click="doTrace" :loading="tracing">追溯查询</n-button>
        </n-form-item>
      </n-form>
      <div style="margin-top: 12px; color: #86909c; font-size: 13px">
        💡 可查询批号的完整入库、出库、调拨、退货、报废等流转记录
      </div>
    </div>

    <div v-if="traceResult" class="content-area">
      <n-tabs type="line" animated>
        <n-tab-pane name="batch" tab="批次信息">
          <n-descriptions bordered :column="3" label-placement="left">
            <n-descriptions-item label="批号">
              <n-tag size="large" type="primary">{{ currentBatch?.batch_no }}</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="药品名称">
              {{ currentBatch?.medicine?.name }}
            </n-descriptions-item>
            <n-descriptions-item label="规格">
              {{ currentBatch?.medicine?.specification }}
            </n-descriptions-item>
            <n-descriptions-item label="生产厂家">
              {{ currentBatch?.medicine?.manufacturer }}
            </n-descriptions-item>
            <n-descriptions-item label="批准文号">
              {{ currentBatch?.medicine?.approval_no }}
            </n-descriptions-item>
            <n-descriptions-item label="供应商">
              {{ currentBatch?.medicine?.supplier?.name || '-' }}
            </n-descriptions-item>
            <n-descriptions-item label="生产日期">
              {{ currentBatch?.production_date }}
            </n-descriptions-item>
            <n-descriptions-item label="有效期至">
              <n-tag :type="expiryTagType" size="small" :bordered="false" :class="expiryTagClass">
                {{ currentBatch?.expiry_date }} (距效期{{ daysLeft }}天)
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="状态">
              <n-tag>{{ batchStatusText }}</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="入库数量">
              {{ currentBatch?.received_quantity }} {{ currentBatch?.medicine?.unit }}
            </n-descriptions-item>
            <n-descriptions-item label="当前库存">
              <span :class="totalStock <= 0 ? 'critical' : ''">{{ totalStock }} {{ currentBatch?.medicine?.unit }}</span>
            </n-descriptions-item>
            <n-descriptions-item label="采购单价">
              ¥{{ currentBatch?.purchase_price }}
            </n-descriptions-item>
          </n-descriptions>
        </n-tab-pane>

        <n-tab-pane name="stock" tab="库位分布">
          <n-data-table
            :columns="stockColumns"
            :data="stockList"
            :pagination="false"
            bordered
            striped
          />
        </n-tab-pane>

        <n-tab-pane name="flow" tab="流转轨迹">
          <n-timeline>
            <n-timeline-item
              v-for="f in flows"
              :key="f.id"
              :type="flowType(f.flow_type).color"
              :title="flowType(f.flow_type).label"
              :time="f.operation_time?.replace('T', ' ')"
            >
              <n-descriptions :column="2" bordered size="small" label-placement="left">
                <n-descriptions-item label="数量">{{ f.quantity }}</n-descriptions-item>
                <n-descriptions-item label="操作人">{{ f.operator?.full_name || '-' }}</n-descriptions-item>
                <n-descriptions-item label="往来单位">{{ f.counterparty || '-' }}</n-descriptions-item>
                <n-descriptions-item label="关联单号">{{ f.reference_no || '-' }}</n-descriptions-item>
                <n-descriptions-item label="源库位">{{ f.from_location?.name || '-' }}</n-descriptions-item>
                <n-descriptions-item label="目标库位">{{ f.to_location?.name || '-' }}</n-descriptions-item>
                <n-descriptions-item label="备注" v-if="f.remark" :span="2">{{ f.remark }}</n-descriptions-item>
              </n-descriptions>
            </n-timeline-item>
          </n-timeline>
          <div v-if="flows.length === 0" style="text-align: center; padding: 60px; color: #86909c">
            暂无流转记录
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>

    <div v-else class="content-area" style="text-align: center; padding: 80px 20px">
      <div style="font-size: 56px; margin-bottom: 16px">📦</div>
      <div style="font-size: 16px; color: #4e5969; margin-bottom: 8px">请输入批号进行流向追溯查询</div>
      <div style="font-size: 13px; color: #86909c">支持查询所有历史流转记录（含入库、出库、调拨、退货等）</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  NSpace,
  NForm,
  NFormItem,
  NInput,
  NButton,
  NTag,
  NDescriptions,
  NDescriptionsItem,
  NDataTable,
  NTabs,
  NTabPane,
  NTimeline,
  NTimelineItem,
  useMessage
} from 'naive-ui'
import dayjs from 'dayjs'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const auth = useAuthStore()
const tracing = ref(false)
const traceResult = ref<any>(null)
const flows = ref<any[]>([])
const stockList = ref<any[]>([])
const form = reactive({ batchNo: '' })

const stockColumns = [
  { title: '库位编码', key: ['location', 'code'], width: 120 },
  { title: '库位名称', key: ['location', 'name'], width: 180 },
  { title: '所在区域', key: ['location', 'zone'], width: 100 },
  { title: '数量', key: 'quantity', width: 100 },
  { title: '可用数量', key: 'available_quantity', width: 100 },
  { title: '锁定数量', key: 'locked_quantity', width: 100 },
  { title: '最后变动日期', key: 'last_move_date', width: 140 }
]

const currentBatch = computed(() => traceResult.value?.batches?.[0])
const totalStock = computed(() => stockList.value.reduce((s, i) => s + (i.quantity || 0), 0))
const daysLeft = computed(() => {
  if (!currentBatch.value?.expiry_date) return 0
  return dayjs(currentBatch.value.expiry_date).diff(dayjs(), 'day')
})
const batchStatusText = computed(() => {
  const m: Record<string, string> = { in_stock: '在库', partial: '部分出库', sold_out: '售罄', expired: '已过期', recalled: '已召回' }
  return m[currentBatch.value?.status || ''] || currentBatch.value?.status
})
const expiryTagType = computed(() => {
  if (daysLeft.value < 0) return 'error'
  if (daysLeft.value <= 30) return 'error'
  if (daysLeft.value <= 90) return 'warning'
  if (daysLeft.value <= 180) return 'info'
  return 'success'
})
const expiryTagClass = computed(() => {
  if (daysLeft.value < 0) return 'tag-critical'
  if (daysLeft.value <= 30) return 'tag-critical'
  if (daysLeft.value <= 90) return 'tag-high'
  if (daysLeft.value <= 180) return 'tag-medium'
  return 'tag-low'
})

function flowType(type: string) {
  const m: Record<string, { label: string; color: string }> = {
    purchase_in: { label: '📥 采购入库', color: 'success' },
    sales_out: { label: '📤 销售出库', color: 'info' },
    transfer_in: { label: '↩️ 调拨入库', color: 'primary' },
    transfer_out: { label: '↪️ 调拨出库', color: 'warning' },
    adjustment: { label: '🔧 库存调整', color: 'warning' },
    return_in: { label: '↩️ 退货入库', color: 'success' },
    return_out: { label: '↩️ 退货出库', color: 'error' },
    scrap: { label: '🗑️ 报废处理', color: 'error' }
  }
  return m[type] || { label: type, color: 'default' }
}

async function doTrace() {
  if (!form.batchNo.trim()) return message.warning('请输入批号')
  tracing.value = true
  try {
    const res = await apiClient.get<any>(`/batches/trace/${form.batchNo}`)
    if (!res?.batches?.length) {
      message.warning('未找到该批号的任何记录')
      traceResult.value = null
      return
    }
    traceResult.value = res
    const batchId = res.batches[0].id
    const [flowsRes, stocksRes] = await Promise.all([
      apiClient.get<any>(`/batches/${batchId}/flows`, { page: 1, page_size: 200 }),
      apiClient.get<any>('/stocks', { batch_id: batchId, only_positive: false, page_size: 200 })
    ])
    flows.value = flowsRes.items || []
    stockList.value = stocksRes.items || []
    message.success(`找到 ${res.total_flows} 条流转记录`)
  } catch (e: any) {
    message.error(e?.detail || '查询失败')
    traceResult.value = null
  } finally { tracing.value = false }
}

onMounted(() => { auth.init(); if (!auth.isLoggedIn) return navigateTo('/login') })
definePageMeta({ layout: 'default' })
</script>
