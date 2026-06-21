<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">烘焙批次管理</h2>
      <n-space>
        <n-button type="primary" @click="showCreateModal = true">
          新建批次
        </n-button>
      </n-space>
    </div>

    <div class="card">
      <div class="filter-bar">
        <n-select
          v-model:value="filters.status"
          placeholder="状态筛选"
          clearable
          :options="statusOptions"
          style="width: 150px"
        />
        <n-select
          v-model:value="filters.product_id"
          placeholder="产品筛选"
          clearable
          :options="productOptions"
          style="width: 180px"
        />
        <n-button type="primary" @click="loadBatches">查询</n-button>
        <n-button @click="resetFilters">重置</n-button>
      </div>

      <n-data-table
        :columns="columns"
        :data="batches"
        :loading="loading"
        :pagination="{
          page: page,
          pageSize: 10,
          itemCount: total,
          onChange: (p: number) => { page = p; loadBatches() }
        }"
      />
    </div>

    <n-modal v-model:show="showCreateModal" preset="card" title="新建烘焙批次" style="width: 600px">
      <n-form :model="batchForm" :rules="batchRules" label-width="100px">
        <n-form-item label="产品" path="product_id">
          <n-select v-model:value="batchForm.product_id" :options="productOptions" placeholder="请选择产品" />
        </n-form-item>
        <n-form-item label="计划数量" path="planned_quantity">
          <n-input-number v-model:value="batchForm.planned_quantity" :min="1" style="width: 100%" />
        </n-form-item>
        <n-form-item label="烘焙温度(℃)" path="temperature">
          <n-input-number v-model:value="batchForm.temperature" :min="0" :max="300" style="width: 100%" />
        </n-form-item>
        <n-form-item label="烘焙时间(分钟)" path="baking_time">
          <n-input-number v-model:value="batchForm.baking_time" :min="0" style="width: 100%" />
        </n-form-item>
        <n-form-item label="湿度(%)" path="humidity">
          <n-input-number v-model:value="batchForm.humidity" :min="0" :max="100" style="width: 100%" />
        </n-form-item>
        <n-form-item label="备注" path="remark">
          <n-input v-model:value="batchForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="submitCreateBatch">创建</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showCompleteModal" preset="card" title="完成批次" style="width: 500px">
      <n-form label-width="100px">
        <n-form-item label="批次号">
          <n-input :value="selectedBatch?.batch_no" disabled />
        </n-form-item>
        <n-form-item label="产品">
          <n-input :value="selectedBatch?.product?.name" disabled />
        </n-form-item>
        <n-form-item label="计划数量">
          <n-input :value="selectedBatch?.planned_quantity" disabled />
        </n-form-item>
        <n-form-item label="实际产量" required>
          <n-input-number v-model:value="completeForm.actual_quantity" :min="0" :max="selectedBatch?.planned_quantity || 9999" style="width: 100%" />
        </n-form-item>
        <n-form-item v-if="selectedBatch && completeForm.actual_quantity < (selectedBatch.planned_quantity || 0)">
          <n-alert type="warning" title="提示">
            实际产量低于计划产量，系统将自动生成报损记录
          </n-alert>
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCompleteModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="completeBatch">确认完成</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, h } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import dayjs from 'dayjs'

const message = useMessage()
const dialog = useDialog()

const { getBatches, createBatch: apiCreateBatch, updateBatch: apiUpdateBatch, completeBatch: apiCompleteBatch, createLoss: apiCreateLoss } = useBatchApi()
const { getProducts } = useMasterApi()
const { getUser } = useAuth()

const loading = ref(false)
const submitting = ref(false)
const page = ref(1)
const total = ref(0)
const batches = ref<BakingBatch[]>([])
const products = ref<Product[]>([])
const showCreateModal = ref(false)
const showCompleteModal = ref(false)
const selectedBatch = ref<BakingBatch | null>(null)

const filters = reactive({
  status: null as string | null,
  product_id: null as number | null
})

const batchForm = reactive({
  product_id: null as number | null,
  planned_quantity: null as number | null,
  temperature: null as number | null,
  baking_time: null as number | null,
  humidity: null as number | null,
  remark: ''
})

const completeForm = reactive({
  actual_quantity: null as number | null
})

const batchRules = {
  product_id: [{ required: true, message: '请选择产品', trigger: 'change' }],
  planned_quantity: [{ required: true, message: '请输入计划数量', trigger: 'blur' }]
}

const statusOptions = [
  { label: '准备中', value: 'preparing' },
  { label: '烘焙中', value: 'baking' },
  { label: '冷却中', value: 'cooling' },
  { label: '已完成', value: 'completed' },
  { label: '部分报损', value: 'partial_damaged' },
  { label: '全部报损', value: 'fully_damaged' }
]

const productOptions = computed(() => products.value.map(p => ({ label: p.name, value: p.id })))

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    preparing: '准备中', baking: '烘焙中', cooling: '冷却中',
    completed: '已完成', partial_damaged: '部分报损', fully_damaged: '全部报损'
  }
  return map[status] || status
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    preparing: 'info', baking: 'warning', cooling: 'info',
    completed: 'success', partial_damaged: 'warning', fully_damaged: 'error'
  }
  return map[status] || 'default'
}

const columns = [
  { title: '批次号', key: 'batch_no', width: 140 },
  { title: '产品', key: 'product_name', render: (row: any) => row.product?.name || '-' },
  { title: '烘焙师', key: 'baker_name', render: (row: any) => row.baker?.full_name || '-' },
  { title: '计划数量', key: 'planned_quantity' },
  { title: '实际产量', key: 'actual_quantity', render: (row: any) => row.actual_quantity ?? '-' },
  { title: '温度', key: 'temperature', render: (row: any) => row.temperature ? `${row.temperature}℃` : '-' },
  { title: '烘焙时间', key: 'baking_time', render: (row: any) => row.baking_time ? `${row.baking_time}分钟` : '-' },
  { title: '状态', key: 'status', width: 100, render: (row: any) => h('span', { class: `status-tag status-${getStatusClass(row.status)}` }, getStatusLabel(row.status)) },
  { title: '创建时间', key: 'created_at', width: 160, render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm') },
  {
    title: '操作', key: 'actions', width: 180, render: (row: any) => h('div', { class: 'table-actions' }, [
      row.status === 'preparing' && h('n-button', { size: 'small', type: 'primary', onClick: () => startBatch(row) }, () => '开始烘焙'),
      row.status === 'baking' && h('n-button', { size: 'small', type: 'warning', onClick: () => completeBatchModal(row) }, () => '完成'),
      (row.status === 'preparing' || row.status === 'baking') && h('n-button', { size: 'small', onClick: () => editBatch(row) }, () => '编辑')
    ])
  }
]

const loadProducts = async () => {
  products.value = await getProducts()
}

const loadBatches = async () => {
  loading.value = true
  try {
    const params: any = { skip: (page.value - 1) * 10, limit: 10 }
    if (filters.status) params.status = filters.status
    if (filters.product_id) params.product_id = filters.product_id
    const data = await getBatches(params)
    batches.value = data
    total.value = data.length
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.status = null
  filters.product_id = null
  page.value = 1
  loadBatches()
}

const submitCreateBatch = async () => {
  try {
    submitting.value = true
    const user = getUser()
    await apiCreateBatch({
      ...batchForm,
      store_id: user?.store_id,
      baker_id: user?.id
    })
    message.success('批次创建成功')
    showCreateModal.value = false
    Object.assign(batchForm, { product_id: null, planned_quantity: null, temperature: null, baking_time: null, humidity: null, remark: '' })
    loadBatches()
  } catch (e: any) {
    message.error(e.data?.detail || '创建失败')
  } finally {
    submitting.value = false
  }
}

const startBatch = async (batch: BakingBatch) => {
  try {
    await apiUpdateBatch(batch.id, { status: 'baking', start_time: new Date().toISOString() })
    message.success('烘焙已开始')
    loadBatches()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  }
}

const apiBatchUpdate = async (id: number, data: any) => {
  return apiUpdateBatch(id, data)
}

const completeBatchModal = (batch: BakingBatch) => {
  selectedBatch.value = batch
  completeForm.actual_quantity = null
  showCompleteModal.value = true
}

const completeBatch = async () => {
  if (!selectedBatch.value || completeForm.actual_quantity === null) return
  try {
    submitting.value = true
    await apiCompleteBatch(selectedBatch.value.id, completeForm.actual_quantity)

    const diff = (selectedBatch.value.planned_quantity || 0) - completeForm.actual_quantity
    if (diff > 0) {
      await apiCreateLoss({
        store_id: selectedBatch.value.store_id,
        batch_id: selectedBatch.value.id,
        loss_type: 'baking_failure',
        quantity: diff,
        unit: selectedBatch.value.product?.unit || '个',
        unit_price: selectedBatch.value.product?.standard_cost || 0,
        remark: '烘焙产量不足自动报损'
      })
      message.success(`批次完成，已自动报损${diff}个`)
    } else {
      message.success('批次完成')
    }

    showCompleteModal.value = false
    loadBatches()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  } finally {
    submitting.value = false
  }
}

const editBatch = (batch: BakingBatch) => {
  dialog.warning({
    title: '编辑批次',
    content: '请联系管理员进行编辑',
    positiveText: '确定'
  })
}

onMounted(() => {
  loadProducts()
  loadBatches()
})
</script>
