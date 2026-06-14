<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">订单管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon> 新建订单
      </el-button>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent="loadData">
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="订单号" clearable style="width: 180px;" />
        </el-form-item>
        <el-form-item label="订单类型">
          <el-select v-model="filters.type" placeholder="全部" clearable style="width: 120px;">
            <el-option label="品牌赞助" value="brand" />
            <el-option label="会员订阅" value="subscription" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px;">
            <el-option v-for="s in dictStore.getDict('order_status')" :key="s.key" :label="s.label" :value="s.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付状态">
          <el-select v-model="filters.paymentStatus" placeholder="全部" clearable style="width: 120px;">
            <el-option v-for="s in dictStore.getDict('payment_status')" :key="s.key" :label="s.label" :value="s.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px;"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData"><el-icon><Search /></el-icon> 查询</el-button>
          <el-button @click="resetFilters"><el-icon><Refresh /></el-icon> 重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="订单号" width="160" />
        <el-table-column label="关联合作" width="140">
          <template #default="{ row }">
            {{ row.partnership?.brandName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'subscription' ? 'success' : 'primary'" size="small">
              {{ row.type === 'subscription' ? '订阅' : '品牌' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="130">
          <template #default="{ row }">
            <span class="font-medium">¥{{ formatMoney(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'completed' ? 'success' : row.status === 'cancelled' ? 'danger' : row.status === 'processing' ? 'warning' : 'info'"
              size="small"
            >
              {{ dictStore.getDictLabel('order_status', row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.paymentStatus === 'paid' ? 'success' : row.paymentStatus === 'refunded' ? 'danger' : 'warning'"
              size="small"
            >
              {{ dictStore.getDictLabel('payment_status', row.paymentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="100">
          <template #default="{ row }">
            <span v-if="row.paymentMethod === 'alipay'">支付宝</span>
            <span v-else-if="row.paymentMethod === 'wechat'">微信</span>
            <span v-else-if="row.paymentMethod === 'bank_transfer'">银行转账</span>
            <span v-else-if="row.paymentMethod === 'card'">银行卡</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="支付时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.paidAt) }}</template>
        </el-table-column>
        <el-table-column label="备注" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '-' }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="$router.push(`/orders/${row.id}`)">详情</el-button>
            <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="perPage"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑订单' : '新建订单'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="关联合作">
          <el-input v-model="form.partnershipId" type="number" placeholder="合作ID（可选）" />
        </el-form-item>
        <el-form-item label="订单类型" prop="type">
          <el-select v-model="form.type" style="width: 100%;">
            <el-option label="品牌赞助" value="brand" />
            <el-option label="会员订阅" value="subscription" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="form.paymentMethod" style="width: 100%;" clearable>
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信支付" value="wechat" />
            <el-option label="银行转账" value="bank_transfer" />
            <el-option label="银行卡" value="card" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isEdit" label="订单状态">
          <el-select v-model="form.status" style="width: 100%;">
            <el-option v-for="s in dictStore.getDict('order_status')" :key="s.key" :label="s.label" :value="s.key" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isEdit" label="支付状态">
          <el-select v-model="form.paymentStatus" style="width: 100%;">
            <el-option v-for="s in dictStore.getDict('payment_status')" :key="s.key" :label="s.label" :value="s.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { orderApi } from '@/api/modules'
import { useDictStore } from '@/stores/dict'
import { formatMoney, formatDateTime } from '@/utils'

const dictStore = useDictStore()
const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)
const dateRange = ref<string[]>([])
const filters = reactive({
  keyword: '',
  type: '',
  status: '',
  paymentStatus: '',
  startDate: '',
  endDate: ''
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const editId = ref<number | null>(null)
const form = reactive<any>({
  partnershipId: null,
  type: 'brand',
  amount: 0,
  paymentMethod: '',
  status: 'pending',
  paymentStatus: 'unpaid',
  remark: ''
})

const rules: FormRules = {
  type: [{ required: true, message: '请选择订单类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }]
}

const handleDateChange = (val: string[] | null) => {
  if (val && val.length === 2) {
    filters.startDate = val[0]
    filters.endDate = val[1]
  } else {
    filters.startDate = ''
    filters.endDate = ''
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = { page: page.value, perPage: perPage.value, ...filters }
    Object.keys(params).forEach(k => {
      if (!params[k]) delete params[k]
    })
    const res: any = await orderApi.list(params)
    list.value = res.data || []
    total.value = res.meta?.total || res.total || 0
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  Object.assign(filters, { keyword: '', type: '', status: '', paymentStatus: '', startDate: '', endDate: '' })
  dateRange.value = []
  page.value = 1
  loadData()
}

const openCreateDialog = () => {
  isEdit.value = false
  editId.value = null
  Object.assign(form, {
    partnershipId: null, type: 'brand', amount: 0, paymentMethod: '',
    status: 'pending', paymentStatus: 'unpaid', remark: ''
  })
  dialogVisible.value = true
}

const openEditDialog = (row: any) => {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    partnershipId: row.partnershipId, type: row.type, amount: row.amount,
    paymentMethod: row.paymentMethod, status: row.status,
    paymentStatus: row.paymentStatus, remark: row.remark
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value && editId.value) {
        await orderApi.update(editId.value, form)
        ElMessage.success('更新成功')
      } else {
        await orderApi.create(form)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      loadData()
    } finally {
      submitting.value = false
    }
  })
}

onMounted(loadData)
</script>
