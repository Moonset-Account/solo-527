<template>
  <div class="orders-page">
    <n-space vertical :size="20" style="width: 100%">
      <n-card :bordered="false" size="small">
        <n-space :size="16">
          <n-input v-model:value="keyword" placeholder="搜索订单号/批次号/品种" clearable style="width: 240px" />
          <n-select v-model:value="statusFilter" :options="statusOptions" placeholder="状态筛选" clearable style="width: 160px" />
          <n-select v-model:value="qualityFilter" :options="qualityOptions" placeholder="品级筛选" clearable style="width: 160px" />
          <n-button type="primary" @click="loadOrders">查询</n-button>
          <n-button @click="showCreateModal = true">新增订单</n-button>
        </n-space>
      </n-card>

      <n-card :bordered="false" size="small">
        <template #header>
          <div class="card-header">
            <span>分拣订单列表</span>
            <n-space>
              <n-tag type="warning" size="small">待分拣: {{ stats.pending }}</n-tag>
              <n-tag type="info" size="small">分拣中: {{ stats.processing }}</n-tag>
              <n-tag type="success" size="small">已完成: {{ stats.completed }}</n-tag>
            </n-space>
          </div>
        </template>
        <n-data-table
          :columns="columns"
          :data="orders"
          :bordered="false"
          :pagination="{ pageSize: 10 }"
          size="small"
        />
      </n-card>
    </n-space>

    <n-modal v-model:show="showCreateModal" preset="card" :title="editingOrder ? '编辑订单' : '新增分拣订单'" style="width: 560px">
      <n-form :model="formData" label-placement="left" label-width="110px">
        <n-form-item label="订单编号">
          <n-input v-model:value="formData.order_no" placeholder="请输入订单编号" />
        </n-form-item>
        <n-form-item label="关联批次">
          <n-select v-model:value="formData.batch_id" :options="batchOptions" placeholder="请选择批次" filterable />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="数量">
              <n-input-number v-model:value="formData.quantity" :min="0" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="单位">
              <n-select v-model:value="formData.unit" :options="unitOptions" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="品级">
              <n-select v-model:value="formData.quality_level" :options="qualityOptions" placeholder="请选择品级" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="目标市场">
              <n-input v-model:value="formData.target_market" placeholder="请输入目标市场" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="状态">
              <n-select v-model:value="formData.status" :options="statusOptions" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="计划时间">
              <n-date-picker v-model:value="formData.scheduled_time" type="datetime" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="备注">
          <n-input v-model:value="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" @click="handleSubmit">确定</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { NTag, NButton, NPopconfirm, useMessage } from 'naive-ui'
import { useApi } from '@/composables/useApi'
import { useFormat } from '@/composables/useFormat'

const { get, post, put, del } = useApi()
const { formatDateTime, getStatusTagType, getStatusText } = useFormat()
const message = useMessage()

const keyword = ref('')
const statusFilter = ref<string | null>(null)
const qualityFilter = ref<string | null>(null)
const orders = ref<any[]>([])
const batchOptions = ref<any[]>([])
const showCreateModal = ref(false)
const editingOrder = ref<any>(null)

const formData = ref({
  order_no: '',
  batch_id: null as any,
  quantity: 0,
  unit: 'kg',
  quality_level: '',
  target_market: '',
  status: 'pending',
  handler_id: null,
  scheduled_time: null,
  completed_time: null,
  remark: '',
})

const statusOptions = [
  { label: '待分拣', value: 'pending' },
  { label: '分拣中', value: 'processing' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

const qualityOptions = [
  { label: '一级', value: 'grade1' },
  { label: '二级', value: 'grade2' },
  { label: '三级', value: 'grade3' },
]

const unitOptions = [
  { label: 'kg', value: 'kg' },
  { label: 'g', value: 'g' },
  { label: '斤', value: 'jin' },
  { label: '箱', value: 'box' },
]

const stats = computed(() => {
  const result: Record<string, number> = { pending: 0, processing: 0, completed: 0 }
  orders.value.forEach((o) => {
    if (result[o.status] !== undefined) result[o.status]++
  })
  return result
})

const columns = [
  { title: '订单号', key: 'order_no', width: 130 },
  { title: '批次号', key: 'batch_no', width: 120 },
  { title: '品种', key: 'variety_name', width: 100 },
  { title: '数量', key: 'quantity', width: 100, render: (row: any) => `${row.quantity} ${row.unit}` },
  { title: '品级', key: 'quality_level', width: 80 },
  { title: '目标市场', key: 'target_market', width: 100 },
  {
    title: '状态',
    key: 'status',
    width: 90,
    render: (row: any) =>
      h(NTag, { type: getStatusTagType(row.status), size: 'small' }, { default: () => getStatusText(row.status) }),
  },
  { title: '计划时间', key: 'scheduled_time', width: 160, render: (row: any) => formatDateTime(row.scheduled_time) },
  {
    title: '操作',
    key: 'action',
    width: 150,
    render: (row: any) =>
      h('div', { style: 'display: flex; gap: 8px' }, [
        h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => handleEdit(row) }, { default: () => '编辑' }),
        h(NPopconfirm, { onPositiveClick: () => handleDelete(row.id) }, {
          trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, { default: () => '删除' }),
          default: () => '确定删除该订单吗？',
        }),
      ]),
  },
]

async function loadBatches() {
  try {
    const batches: any = await get('/batches')
    batchOptions.value = batches.map((b: any) => ({
      label: `${b.batch_no} - ${b.variety_name}`,
      value: b.id,
    }))
  } catch (e) {
    console.error(e)
  }
}

async function loadOrders() {
  try {
    const params: any = {}
    if (keyword.value) params.keyword = keyword.value
    if (statusFilter.value) params.status = statusFilter.value
    if (qualityFilter.value) params.quality_level = qualityFilter.value
    orders.value = await get('/sorting-orders', params)
  } catch (e) {
    message.error('加载失败')
  }
}

function handleEdit(row: any) {
  editingOrder.value = row
  formData.value = { ...row }
  showCreateModal.value = true
}

async function handleDelete(id: number) {
  try {
    await del(`/sorting-orders/${id}`)
    message.success('删除成功')
    loadOrders()
  } catch (e) {
    message.error('删除失败')
  }
}

async function handleSubmit() {
  try {
    if (editingOrder.value) {
      await put(`/sorting-orders/${editingOrder.value.id}`, formData.value)
      message.success('更新成功')
    } else {
      await post('/sorting-orders', formData.value)
      message.success('创建成功')
    }
    showCreateModal.value = false
    editingOrder.value = null
    resetForm()
    loadOrders()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  }
}

function resetForm() {
  formData.value = {
    order_no: '',
    batch_id: null,
    quantity: 0,
    unit: 'kg',
    quality_level: '',
    target_market: '',
    status: 'pending',
    handler_id: null,
    scheduled_time: null,
    completed_time: null,
    remark: '',
  }
}

onMounted(() => {
  loadBatches()
  loadOrders()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
</style>
