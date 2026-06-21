<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">现金流水</h2>
      <n-space>
        <n-button type="primary" @click="showCreateModal = true">
          新增流水
        </n-button>
      </n-space>
    </div>

    <div class="card">
      <n-grid :cols="3" :x-gap="20" style="margin-bottom: 20px">
        <n-grid-item>
          <div class="stat-card">
            <div class="stat-value" style="color: #18a058">¥{{ summary.total_income?.toFixed(2) || '0.00' }}</div>
            <div class="stat-label">总收入</div>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="stat-card">
            <div class="stat-value" style="color: #d03050">¥{{ summary.total_expense?.toFixed(2) || '0.00' }}</div>
            <div class="stat-label">总支出</div>
          </div>
        </n-grid-item>
        <n-grid-item>
          <div class="stat-card">
            <div class="stat-value" :style="{ color: (summary.net_balance || 0) >= 0 ? '#18a058' : '#d03050' }">
              ¥{{ summary.net_balance?.toFixed(2) || '0.00' }}
            </div>
            <div class="stat-label">净收入</div>
          </div>
        </n-grid-item>
      </n-grid>

      <div class="filter-bar">
        <n-select
          v-model:value="filters.flow_type"
          placeholder="收支类型"
          clearable
          :options="typeOptions"
          style="width: 150px"
        />
        <n-select
          v-model:value="filters.category"
          placeholder="分类"
          clearable
          :options="categoryOptions"
          style="width: 150px"
        />
        <n-date-picker
          v-model:value="filters.date_range"
          type="daterange"
          placeholder="交易时间"
          style="width: 260px"
        />
        <n-button type="primary" @click="loadData">查询</n-button>
        <n-button @click="resetFilters">重置</n-button>
      </div>

      <n-data-table
        :columns="columns"
        :data="cashFlows"
        :loading="loading"
        :pagination="{
          page: page,
          pageSize: 10,
          itemCount: total,
          onChange: (p: number) => { page = p; loadCashFlows() }
        }"
      />
    </div>

    <n-modal v-model:show="showCreateModal" preset="card" title="新增流水" style="width: 550px">
      <n-form :model="cashForm" :rules="cashRules" label-width="100px">
        <n-form-item label="收支类型" path="flow_type">
          <n-radio-group v-model:value="cashForm.flow_type">
            <n-radio value="income">收入</n-radio>
            <n-radio value="expense">支出</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="金额" path="amount">
          <n-input-number v-model:value="cashForm.amount" :min="0.01" step="0.01" style="width: 100%" />
        </n-form-item>
        <n-form-item label="分类" path="category">
          <n-select v-model:value="cashForm.category" :options="cashForm.flow_type === 'income' ? incomeCategoryOptions : expenseCategoryOptions" placeholder="请选择分类" />
        </n-form-item>
        <n-form-item label="说明" path="description">
          <n-input v-model:value="cashForm.description" placeholder="请输入说明" />
        </n-form-item>
        <n-form-item label="交易时间" path="transaction_time">
          <n-date-picker v-model:value="cashForm.transaction_time" type="datetime" placeholder="选择交易时间" style="width: 100%" />
        </n-form-item>
        <n-form-item label="备注" path="remark">
          <n-input v-model:value="cashForm.remark" type="textarea" :rows="2" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCreateModal = false">取消</n-button>
          <n-button type="primary" :loading="submitting" @click="createCashFlow">确认</n-button>
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
const { getCashFlows, getCashFlowSummary, createCashFlow: apiCreate } = useFinanceApi()
const { getUser, isStoreManager, isSupervisor } = useAuth()

const loading = ref(false)
const submitting = ref(false)
const page = ref(1)
const total = ref(0)
const cashFlows = ref<CashFlow[]>([])
const summary = ref<any>({})
const showCreateModal = ref(false)

const filters = reactive({
  flow_type: null as string | null,
  category: null as string | null,
  date_range: null as any
})

const cashForm = reactive({
  flow_type: 'income' as string,
  amount: null as number | null,
  category: null as string | null,
  description: '',
  transaction_time: null as any,
  remark: ''
})

const cashRules = {
  flow_type: [{ required: true, message: '请选择收支类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const typeOptions = [
  { label: '收入', value: 'income' },
  { label: '支出', value: 'expense' }
]

const incomeCategoryOptions = [
  { label: '产品销售', value: '产品销售' },
  { label: '定制订单', value: '定制订单' },
  { label: '会员卡', value: '会员卡' },
  { label: '其他收入', value: '其他收入' }
]

const expenseCategoryOptions = [
  { label: '食材采购', value: '食材采购' },
  { label: '设备维护', value: '设备维护' },
  { label: '房租水电', value: '房租水电' },
  { label: '人员工资', value: '人员工资' },
  { label: '包装材料', value: '包装材料' },
  { label: '其他支出', value: '其他支出' }
]

const categoryOptions = computed(() => [
  ...incomeCategoryOptions,
  ...expenseCategoryOptions
])

const getTypeLabel = (type: string) => type === 'income' ? '收入' : '支出'
const getTypeClass = (type: string) => type === 'income' ? 'success' : 'error'

const columns = [
  { title: 'ID', key: 'id', width: 60 },
  { title: '类型', key: 'flow_type', width: 80, render: (row: any) => h('n-tag', { type: getTypeClass(row.flow_type) as any }, () => getTypeLabel(row.flow_type)) },
  { title: '金额', key: 'amount', render: (row: any) => h('span', { style: { color: row.flow_type === 'income' ? '#18a058' : '#d03050', fontWeight: 600 } }, `${row.flow_type === 'income' ? '+' : '-'}¥${row.amount.toFixed(2)}`) },
  { title: '分类', key: 'category' },
  { title: '说明', key: 'description', ellipsis: { tooltip: true } },
  { title: '操作人', key: 'operator', render: (row: any) => row.operator?.full_name || '-' },
  { title: '交易时间', key: 'transaction_time', width: 160, render: (row: any) => row.transaction_time ? dayjs(row.transaction_time).format('YYYY-MM-DD HH:mm') : '-' },
  { title: '备注', key: 'remark', ellipsis: { tooltip: true } }
]

const loadData = async () => {
  await Promise.all([loadCashFlows(), loadSummary()])
}

const loadCashFlows = async () => {
  loading.value = true
  try {
    const params: any = { skip: (page.value - 1) * 10, limit: 10 }
    if (filters.flow_type) params.flow_type = filters.flow_type
    if (filters.category) params.category = filters.category
    const data = await getCashFlows(params)
    cashFlows.value = data
    total.value = data.length
  } finally {
    loading.value = false
  }
}

const loadSummary = async () => {
  try {
    const params: any = {}
    if (filters.date_range) {
      params.start_date = new Date(filters.date_range[0]).toISOString()
      params.end_date = new Date(filters.date_range[1]).toISOString()
    }
    summary.value = await getCashFlowSummary(params)
  } catch (e) {
    summary.value = {}
  }
}

const resetFilters = () => {
  filters.flow_type = null
  filters.category = null
  filters.date_range = null
  page.value = 1
  loadData()
}

const createCashFlow = async () => {
  try {
    submitting.value = true
    const user = getUser()
    await apiCreate({
      ...cashForm,
      store_id: user?.store_id,
      operator_id: user?.id,
      transaction_time: cashForm.transaction_time ? new Date(cashForm.transaction_time).toISOString() : new Date().toISOString()
    })
    message.success('流水已登记')
    showCreateModal.value = false
    Object.assign(cashForm, { flow_type: 'income', amount: null, category: null, description: '', transaction_time: null, remark: '' })
    loadData()
  } catch (e: any) {
    message.error(e.data?.detail || '登记失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
