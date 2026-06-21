<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">库存预警</h2>
      <n-badge :value="unhandledCount" type="error" style="margin-left: 10px">
        <n-tag type="error">待处理 {{ unhandledCount }} 条</n-tag>
      </n-badge>
    </div>

    <div class="card">
      <div class="filter-bar">
        <n-select
          v-model:value="filters.alert_level"
          placeholder="预警级别"
          clearable
          :options="levelOptions"
          style="width: 150px"
        />
        <n-select
          v-model:value="filters.is_handled"
          placeholder="处理状态"
          clearable
          :options="handledOptions"
          style="width: 150px"
        />
        <n-button type="primary" @click="loadAlerts">查询</n-button>
        <n-button @click="resetFilters">重置</n-button>
      </div>

      <n-data-table
        :columns="columns"
        :data="alerts"
        :loading="loading"
        :pagination="{
          page: page,
          pageSize: 10,
          itemCount: total,
          onChange: (p: number) => { page = p; loadAlerts() }
        }"
      />
    </div>

    <n-modal v-model:show="showHandleModal" preset="card" title="处理预警" style="width: 550px">
      <n-form label-width="100px">
        <n-form-item label="预警级别">
          <n-tag :type="selectedAlert?.alert_level === 'critical' ? 'error' : 'warning'">
            {{ selectedAlert?.alert_level === 'critical' ? '严重' : '警告' }}
          </n-tag>
        </n-form-item>
        <n-form-item label="食材">
          <n-input :value="selectedAlert?.inventory_item?.ingredient?.name" disabled />
        </n-form-item>
        <n-form-item label="当前库存">
          <n-input :value="`${selectedAlert?.current_quantity} ${selectedAlert?.inventory_item?.ingredient?.unit || ''}`" disabled />
        </n-form-item>
        <n-form-item label="最低库存">
          <n-input :value="`${selectedAlert?.min_stock} ${selectedAlert?.inventory_item?.ingredient?.unit || ''}`" disabled />
        </n-form-item>
        <n-form-item label="缺口">
          <n-input :value="`${((selectedAlert?.min_stock || 0) - (selectedAlert?.current_quantity || 0)).toFixed(2)} ${selectedAlert?.inventory_item?.ingredient?.unit || ''}`" disabled />
        </n-form-item>
        <n-form-item label="处理结果" required>
          <n-select v-model:value="handleForm.result" :options="resultOptions" placeholder="请选择处理结果" />
        </n-form-item>
        <n-form-item label="补货数量" v-if="handleForm.result === 'restock'">
          <n-input-number v-model:value="handleForm.restock_quantity" :min="0" step="0.01" style="width: 100%" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="handleForm.remark" type="textarea" :rows="3" placeholder="请输入处理备注" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showHandleModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="handleAlert">确认处理</n-button>
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
const { getAlerts, handleAlert: apiHandleAlert } = useInventoryApi()
const { stockIn } = useInventoryApi()
const { getUser, isStoreManager } = useAuth()

const loading = ref(false)
const submitting = ref(false)
const page = ref(1)
const total = ref(0)
const alerts = ref<StockAlert[]>([])
const showHandleModal = ref(false)
const selectedAlert = ref<StockAlert | null>(null)

const filters = reactive({
  alert_level: null as string | null,
  is_handled: null as boolean | null
})

const handleForm = reactive({
  result: null as string | null,
  restock_quantity: null as number | null,
  remark: ''
})

const levelOptions = [
  { label: '严重', value: 'critical' },
  { label: '警告', value: 'warning' }
]

const handledOptions = [
  { label: '未处理', value: false },
  { label: '已处理', value: true }
]

const resultOptions = [
  { label: '已补货', value: 'restock' },
  { label: '暂时缺货，后续补货', value: 'later' },
  { label: '已替换其他食材', value: 'replace' },
  { label: '已调整菜单', value: 'menu_adjust' },
  { label: '其他', value: 'other' }
]

const unhandledCount = computed(() => alerts.value.filter(a => !a.is_handled).length)

const columns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '预警级别', key: 'alert_level', width: 100, render: (row: any) => h('n-tag', { type: row.alert_level === 'critical' ? 'error' : 'warning' }, () => row.alert_level === 'critical' ? '严重' : '警告') },
  { title: '食材', key: 'ingredient', render: (row: any) => row.inventory_item?.ingredient?.name || '-' },
  { title: '当前库存', key: 'current_quantity', render: (row: any) => `${row.current_quantity} ${row.inventory_item?.ingredient?.unit || ''}` },
  { title: '最低库存', key: 'min_stock', render: (row: any) => `${row.min_stock} ${row.inventory_item?.ingredient?.unit || ''}` },
  { title: '状态', key: 'is_handled', width: 100, render: (row: any) => h('span', { class: `status-tag status-${row.is_handled ? 'success' : 'warning'}` }, row.is_handled ? '已处理' : '待处理') },
  { title: '处理人', key: 'handler', render: (row: any) => row.handler?.full_name || '-' },
  { title: '处理结果', key: 'handle_result', ellipsis: { tooltip: true } },
  { title: '创建时间', key: 'created_at', width: 160, render: (row: any) => dayjs(row.created_at).format('YYYY-MM-DD HH:mm') },
  {
    title: '操作', key: 'actions', width: 120, render: (row: any) => h('div', { class: 'table-actions' }, [
      !row.is_handled && isStoreManager() && h('n-button', { size: 'small', type: 'primary', onClick: () => handleAlertModal(row) }, () => '处理')
    ])
  }
]

const loadAlerts = async () => {
  loading.value = true
  try {
    const params: any = { skip: (page.value - 1) * 10, limit: 100, unhandled_only: filters.is_handled === false }
    if (filters.alert_level) params.alert_level = filters.alert_level
    alerts.value = await getAlerts(params)
    total.value = alerts.value.length
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.alert_level = null
  filters.is_handled = null
  page.value = 1
  loadAlerts()
}

const handleAlertModal = (alert: StockAlert) => {
  selectedAlert.value = alert
  handleForm.result = null
  handleForm.restock_quantity = null
  handleForm.remark = ''
  showHandleModal.value = true
}

const handleAlert = async () => {
  if (!selectedAlert.value || !handleForm.result) return
  try {
    submitting.value = true

    if (handleForm.result === 'restock' && handleForm.restock_quantity && selectedAlert.value.inventory_item_id) {
      await stockIn(selectedAlert.value.inventory_item_id, handleForm.restock_quantity)
    }

    const resultLabel = resultOptions.find(o => o.value === handleForm.result)?.label || handleForm.result
    const fullResult = handleForm.restock_quantity
      ? `${resultLabel}，补货${handleForm.restock_quantity}单位`
      : resultLabel

    await apiHandleAlert(selectedAlert.value.id, fullResult, handleForm.remark)
    message.success('处理成功')
    showHandleModal.value = false
    loadAlerts()
  } catch (e: any) {
    message.error(e.data?.detail || '操作失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadAlerts()
})
</script>
