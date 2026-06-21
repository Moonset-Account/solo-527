<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">报损登记</h2>
      <n-space>
        <n-button type="primary" @click="showCreateModal = true">
          新增报损
        </n-button>
      </n-space>
    </div>

    <div class="card">
      <n-grid :cols="4" :x-gap="20" style="margin-bottom: 20px">
        <n-grid-item>
          <div class="stat-card">
            <div class="stat-value" style="color: #d03050">¥{{ lossStats.total_amount?.toFixed(2) || '0.00' }}</div>
            <div class="stat-label">累计报损金额</div>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="stat-card">
            <div class="stat-value" style="color: #f0a020">{{ lossStats.count || 0 }}</div>
            <div class="stat-label">报损次数</div>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="stat-card">
            <div class="stat-value" style="color: #2080f0">{{ pendingCount }}</div>
            <div class="stat-label">待处理</div>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="stat-card">
            <div class="stat-value" style="color: #18a058">{{ handledCount }}</div>
            <div class="stat-label">已处理</div>
          </div>
        </n-grid-item>
      </n-grid>

      <div class="filter-bar">
        <n-select
          v-model:value="filters.loss_type"
          placeholder="报损类型"
          clearable
          :options="lossTypeOptions"
          style="width: 150px"
        />
        <n-select
          v-model:value="filters.status"
          placeholder="处理状态"
          clearable
          :options="statusOptions"
          style="width: 150px"
        />
        <n-button type="primary" @click="loadLossRecords">查询</n-button>
        <n-button @click="resetFilters">重置</n-button>
      </div>

      <n-data-table
        :columns="columns"
        :data="lossRecords"
        :loading="loading"
        :pagination="{
          page: page,
          pageSize: 10,
          itemCount: total,
          onChange: (p: number) => { page = p; loadLossRecords() }
        }"
      />
    </div>

    <n-modal v-model:show="showCreateModal" preset="card" title="新增报损" style="width: 600px">
      <n-form :model="lossForm" :rules="lossRules" label-width="100px">
        <n-form-item label="关联批次" path="batch_id">
          <n-select
            v-model:value="lossForm.batch_id"
            :options="batchOptions"
            clearable
            placeholder="选择关联批次（可选）"
            @update:value="onBatchChange"
          />
        </n-form-item>
        <n-form-item label="关联食材" path="ingredient_id">
          <n-select
            v-model:value="lossForm.ingredient_id"
            :options="ingredientOptions"
            clearable
            placeholder="选择关联食材（可选）"
            @update:value="onIngredientChange"
          />
        </n-form-item>
        <n-form-item label="报损类型" path="loss_type">
          <n-select v-model:value="lossForm.loss_type" :options="lossTypeOptions" placeholder="请选择报损类型" />
        </n-form-item>
        <n-form-item label="报损数量" path="quantity">
          <n-input-number v-model:value="lossForm.quantity" :min="0.01" step="0.01" style="width: 100%" />
        </n-form-item>
        <n-form-item label="单位" path="unit">
          <n-input v-model:value="lossForm.unit" placeholder="如：个、kg、L等" />
        </n-form-item>
        <n-form-item label="单价(元)" path="unit_price">
          <n-input-number v-model:value="lossForm.unit_price" :min="0" step="0.01" style="width: 100%" />
        </n-form-item>
        <n-form-item label="报损金额">
          <n-input :value="(lossForm.quantity * (lossForm.unit_price || 0)).toFixed(2)" disabled />
        </n-form-item>
        <n-form-item label="备注" path="remark">
          <n-input v-model:value="lossForm.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="createLoss">提交</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showHandleModal" preset="card" title="处理报损" style="width: 500px">
      <n-form label-width="100px">
        <n-form-item label="报损单号">
          <n-input :value="selectedLoss?.id" disabled />
        </n-form-item>
        <n-form-item label="报损类型">
          <n-input :value="getLossTypeLabel(selectedLoss?.loss_type)" disabled />
        </n-form-item>
        <n-form-item label="报损金额">
          <n-input :value="`¥${selectedLoss?.total_amount?.toFixed(2)}`" disabled />
        </n-form-item>
        <n-form-item label="处理结果" required>
          <n-input v-model:value="handleForm.result" type="textarea" :rows="3" placeholder="请输入处理结果" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="handleForm.remark" type="textarea" :rows="2" placeholder="可选" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showHandleModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleLoss">确认处理</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, h } from 'vue'
import { useMessage } from 'naive-ui'
import dayjs from 'dayjs'

const message = useMessage()
const { getLossRecords, createLoss: apiCreateLoss, handleLoss: apiHandleLoss, getLossStats, getBatches } = useBatchApi()
const { getIngredients } = useMasterApi()
const { getUser, isStoreManager } = useAuth()

const loading = ref(false)
const submitting = ref(false)
const page = ref(1)
const total = ref(0)
const lossRecords = ref<LossRecord[]>([])
const batches = ref<BakingBatch[]>([])
const ingredients = ref<Ingredient[]>([])
const showCreateModal = ref(false)
const showHandleModal = ref(false)
const selectedLoss = ref<LossRecord | null>(null)
const lossStats = ref<any>({})

const filters = reactive({
  loss_type: null as string | null,
  status: null as string | null
})

const lossForm = reactive({
  batch_id: null as number | null,
  ingredient_id: null as number | null,
  loss_type: null as string | null,
  quantity: null as number | null,
  unit: '个',
  unit_price: null as number | null,
  remark: ''
})

const handleForm = reactive({
  result: '',
  remark: ''
})

const lossRules = {
  loss_type: [{ required: true, message: '请选择报损类型', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入报损数量', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }]
}

const lossTypeOptions = [
  { label: '烘焙失败', value: 'baking_failure' },
  { label: '烤过了', value: 'overbake' },
  { label: '没烤熟', value: 'underbake' },
  { label: '装饰错误', value: 'decoration_error' },
  { label: '过期', value: 'expired' },
  { label: '损坏', value: 'damage' },
  { label: '其他', value: 'other' }
]

const statusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '已处理', value: 'handled' }
]

const batchOptions = computed(() => batches.value.map(b => ({ label: `${b.batch_no} - ${b.product?.name}`, value: b.id })))
const ingredientOptions = computed(() => ingredients.value.map(i => ({ label: i.name, value: i.id })))

const pendingCount = computed(() => lossRecords.value.filter(l => !l.handled_at).length)
const handledCount = computed(() => lossRecords.value.filter(l => l.handled_at).length)

const getLossTypeLabel = (type?: string) => {
  const map: Record<string, string> = {
    baking_failure: '烘焙失败', overbake: '烤过了', underbake: '没烤熟',
    decoration_error: '装饰错误', expired: '过期', damage: '损坏', other: '其他'
  }
  return map[type || ''] || type
}

const columns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '报损类型', key: 'loss_type', width: 100, render: (row: any) => getLossTypeLabel(row.loss_type) },
  { title: '关联批次', key: 'batch_no', render: (row: any) => row.batch_id ? `#${row.batch_id}` : '-' },
  { title: '关联食材', key: 'ingredient', render: (row: any) => row.ingredient?.name || '-' },
  { title: '数量', key: 'quantity', render: (row: any) => `${row.quantity}${row.unit}` },
  { title: '金额(元)', key: 'total_amount', render: (row: any) => `¥${row.total_amount?.toFixed(2)}` },
  { title: '状态', key: 'status', width: 100, render: (row: any) => h('span', { class: `status-tag status-${row.handled_at ? 'success' : 'warning'}` }, row.handled_at ? '已处理' : '待处理') },
  { title: '报损人', key: 'reporter', render: (row: any) => row.reporter?.full_name || '-' },
  { title: '处理人', key: 'handler', render: (row: any) => row.handler?.full_name || '-' },
  { title: '创建时间', key: 'created_at', width: 160, render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm') },
  {
    title: '操作', key: 'actions', width: 120, render: (row: any) => h('div', { class: 'table-actions' }, [
      !row.handled_at && isStoreManager() && h('n-button', { size: 'small', type: 'primary', onClick: () => handleLossModal(row) }, () => '处理')
    ])
  }
]

const onBatchChange = (val: number | null) => {
  if (val) {
    const batch = batches.value.find(b => b.id === val)
    if (batch?.product) {
      lossForm.unit = batch.product.unit
      lossForm.unit_price = batch.product.standard_cost
    }
  }
}

const onIngredientChange = (val: number | null) => {
  if (val) {
    const ing = ingredients.value.find(i => i.id === val)
    if (ing) {
      lossForm.unit = ing.unit
      lossForm.unit_price = ing.unit_price
    }
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const [records, stats, batchList, ingList] = await Promise.all([
      getLossRecords({ limit: 100 }),
      getLossStats(),
      getBatches({ limit: 50 }),
      getIngredients()
    ])
    lossRecords.value = records
    lossStats.value = stats
    batches.value = batchList
    ingredients.value = ingList
    total.value = records.length
  } finally {
    loading.value = false
  }
}

const loadLossRecords = async () => {
  loading.value = true
  try {
    const params: any = { skip: (page.value - 1) * 10, limit: 10 }
    if (filters.loss_type) params.loss_type = filters.loss_type
    const data = await getLossRecords(params)
    lossRecords.value = data
    total.value = data.length
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.loss_type = null
  filters.status = null
  page.value = 1
  loadLossRecords()
}

const createLoss = async () => {
  try {
    submitting.value = true
    const user = getUser()
    await apiCreateLoss({
      ...lossForm,
      store_id: user?.store_id
    })
    message.success('报损登记成功')
    showCreateModal.value = false
    Object.assign(lossForm, { batch_id: null, ingredient_id: null, loss_type: null, quantity: null, unit: '个', unit_price: null, remark: '' })
    loadData()
  } catch (e: any) {
    message.error(e.data?.detail || '提交失败')
  } finally {
    submitting.value = false
  }
}

const handleLossModal = (loss: LossRecord) => {
  selectedLoss.value = loss
  handleForm.result = ''
  handleForm.remark = ''
  showHandleModal.value = true
}

const handleLoss = async () => {
  if (!selectedLoss.value || !handleForm.result) return
  try {
    submitting.value = true
    await apiHandleLoss(selectedLoss.value.id, handleForm.result)
    message.success('处理成功')
    showHandleModal.value = false
    loadLossRecords()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
