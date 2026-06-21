<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">库存管理</h2>
      <n-space>
        <n-button type="warning" @click="checkAlerts">检查预警</n-button>
        <n-button type="primary" @click="showCreateModal = true">新增库存</n-button>
      </n-space>
    </div>

    <div class="card">
      <div class="filter-bar">
        <n-select
          v-model:value="filters.status"
          placeholder="库存状态"
          clearable
          :options="statusOptions"
          style="width: 150px"
        />
        <n-input
          v-model:value="filters.keyword"
          placeholder="搜索食材名称"
          clearable
          style="width: 200px"
        />
        <n-button type="primary" @click="loadInventory">查询</n-button>
        <n-button @click="resetFilters">重置</n-button>
      </div>

      <n-data-table
        :columns="columns"
        :data="filteredInventory"
        :loading="loading"
        :pagination="{
          page: page,
          pageSize: 10,
          itemCount: filteredInventory.length,
          onChange: (p: number) => { page = p }
        }"
      />
    </div>

    <n-modal v-model:show="showCreateModal" preset="card" title="新增库存" style="width: 500px">
      <n-form :model="inventoryForm" :rules="inventoryRules" label-width="100px">
        <n-form-item label="食材" path="ingredient_id">
          <n-select v-model:value="inventoryForm.ingredient_id" :options="ingredientOptions" placeholder="请选择食材" />
        </n-form-item>
        <n-form-item label="库存数量" path="quantity">
          <n-input-number v-model:value="inventoryForm.quantity" :min="0" step="0.01" style="width: 100%" />
        </n-form-item>
        <n-form-item label="最低库存" path="min_stock">
          <n-input-number v-model:value="inventoryForm.min_stock" :min="0" step="0.01" style="width: 100%" />
        </n-form-item>
        <n-form-item label="备注" path="remark">
          <n-input v-model:value="inventoryForm.remark" type="textarea" :rows="2" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="createInventory">确认</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showStockModal" preset="card" :title="stockModalTitle" style="width: 450px">
      <n-form label-width="100px">
        <n-form-item label="食材">
          <n-input :value="selectedInventory?.ingredient?.name" disabled />
        </n-form-item>
        <n-form-item label="当前库存">
          <n-input :value="selectedInventory?.quantity" disabled />
        </n-form-item>
        <n-form-item label="操作数量" required>
          <n-input-number v-model:value="stockForm.quantity" :min="0.01" step="0.01" style="width: 100%" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="stockForm.remark" type="textarea" :rows="2" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showStockModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleStock">{{ stockModalTitle }}</n-button>
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
const { getInventory, createInventory: apiCreateInventory, stockIn, stockOut, checkAlerts: apiCheckAlerts } = useInventoryApi()
const { getIngredients } = useMasterApi()
const { getUser, isStoreManager } = useAuth()

const loading = ref(false)
const submitting = ref(false)
const page = ref(1)
const inventory = ref<InventoryItem[]>([])
const ingredients = ref<Ingredient[]>([])
const showCreateModal = ref(false)
const showStockModal = ref(false)
const stockType = ref<'in' | 'out'>('in')
const selectedInventory = ref<InventoryItem | null>(null)

const filters = reactive({
  status: null as string | null,
  keyword: ''
})

const inventoryForm = reactive({
  ingredient_id: null as number | null,
  quantity: null as number | null,
  min_stock: null as number | null,
  remark: ''
})

const stockForm = reactive({
  quantity: null as number | null,
  remark: ''
})

const inventoryRules = {
  ingredient_id: [{ required: true, message: '请选择食材', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入库存数量', trigger: 'blur' }],
  min_stock: [{ required: true, message: '请输入最低库存', trigger: 'blur' }]
}

const statusOptions = [
  { label: '正常', value: 'in_stock' },
  { label: '库存不足', value: 'low_stock' },
  { label: '缺货', value: 'out_of_stock' }
]

const ingredientOptions = computed(() => ingredients.value.map(i => ({ label: i.name, value: i.id })))

const stockModalTitle = computed(() => stockType.value === 'in' ? '入库' : '出库')

const filteredInventory = computed(() => {
  let data = inventory.value
  if (filters.status) {
    data = data.filter(i => i.status === filters.status)
  }
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    data = data.filter(i => i.ingredient?.name?.toLowerCase().includes(kw))
  }
  return data
})

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = { in_stock: '正常', low_stock: '库存不足', out_of_stock: '缺货' }
  return map[status] || status
}

const getStatusClass = (status: string) => {
  const map: Record<string, string> = { in_stock: 'success', low_stock: 'warning', out_of_stock: 'error' }
  return map[status] || 'default'
}

const columns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '食材', key: 'ingredient_name', render: (row: any) => row.ingredient?.name || '-' },
  { title: '分类', key: 'category', render: (row: any) => row.ingredient?.category || '-' },
  { title: '当前库存', key: 'quantity', render: (row: any) => `${row.quantity} ${row.ingredient?.unit || ''}` },
  { title: '最低库存', key: 'min_stock', render: (row: any) => `${row.min_stock} ${row.ingredient?.unit || ''}` },
  { title: '单价(元)', key: 'unit_price', render: (row: any) => `¥${row.ingredient?.unit_price?.toFixed(2) || '0.00'}` },
  { title: '库存金额', key: 'total_value', render: (row: any) => `¥${(row.quantity * (row.ingredient?.unit_price || 0)).toFixed(2)}` },
  { title: '状态', key: 'status', width: 100, render: (row: any) => h('span', { class: `status-tag status-${getStatusClass(row.status)}` }, getStatusLabel(row.status)) },
  { title: '最后补货', key: 'last_restocked', width: 140, render: (row: any) => row.last_restocked ? dayjs(row.last_restocked).format('MM-DD HH:mm') : '-' },
  {
    title: '操作', key: 'actions', width: 180, render: (row: any) => h('div', { class: 'table-actions' }, [
      isStoreManager() && h('n-button', { size: 'small', type: 'success', onClick: () => openStockModal(row, 'in') }, () => '入库'),
      isStoreManager() && h('n-button', { size: 'small', type: 'warning', onClick: () => openStockModal(row, 'out') }, () => '出库')
    ])
  }
]

const loadInventory = async () => {
  loading.value = true
  try {
    inventory.value = await getInventory({ limit: 100 })
  } finally {
    loading.value = false
  }
}

const loadIngredients = async () => {
  ingredients.value = await getIngredients()
}

const resetFilters = () => {
  filters.status = null
  filters.keyword = ''
  page.value = 1
}

const checkAlerts = async () => {
  try {
    const res = await apiCheckAlerts()
    message.success(`检查完成，创建了${res.created}条预警`)
    loadInventory()
  } catch (e: any) {
    message.error(e.data?.detail || '检查失败')
  }
}

const createInventory = async () => {
  try {
    submitting.value = true
    const user = getUser()
    await apiCreateInventory({
      ...inventoryForm,
      store_id: user?.store_id
    })
    message.success('库存创建成功')
    showCreateModal.value = false
    Object.assign(inventoryForm, { ingredient_id: null, quantity: null, min_stock: null, remark: '' })
    loadInventory()
  } catch (e: any) {
    message.error(e.data?.detail || '创建失败')
  } finally {
    submitting.value = false
  }
}

const openStockModal = (item: InventoryItem, type: 'in' | 'out') => {
  selectedInventory.value = item
  stockType.value = type
  stockForm.quantity = null
  stockForm.remark = ''
  showStockModal.value = true
}

const handleStock = async () => {
  if (!selectedInventory.value || stockForm.quantity === null) return
  try {
    submitting.value = true
    if (stockType.value === 'in') {
      await stockIn(selectedInventory.value.id, stockForm.quantity)
      message.success('入库成功')
    } else {
      await stockOut(selectedInventory.value.id, stockForm.quantity)
      message.success('出库成功')
    }
    showStockModal.value = false
    loadInventory()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadIngredients()
  loadInventory()
})
</script>
