<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">营业录入</h2>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增营业记录</el-button>
    </div>

    <div class="filter-bar">
      <el-date-picker
        v-model="filters.startDate"
        type="date"
        placeholder="开始日期"
        value-format="YYYY-MM-DD"
        size="default"
      />
      <el-date-picker
        v-model="filters.endDate"
        type="date"
        placeholder="结束日期"
        value-format="YYYY-MM-DD"
        size="default"
      />
      <el-button type="primary" @click="loadSales">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <el-card>
      <el-table :data="salesList" v-loading="loading" stripe>
        <el-table-column prop="saleDate" label="营业日期" width="120" />
        <el-table-column prop="totalAmount" label="营业额" width="120">
          <template #default="{ row }">
            ¥{{ Number(row.totalAmount).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="orderCount" label="订单数" width="100" />
        <el-table-column prop="costAmount" label="成本" width="100">
          <template #default="{ row }">
            ¥{{ Number(row.costAmount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="profitAmount" label="利润" width="100">
          <template #default="{ row }">
            <span :class="{ 'text-success': row.profitAmount > 0, 'text-danger': row.profitAmount < 0 }">
              ¥{{ Number(row.profitAmount || 0).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="discountAmount" label="优惠" width="100">
          <template #default="{ row }">
            ¥{{ Number(row.discountAmount || 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="creator.fullName" label="录入人" width="100" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          layout="total, prev, pager, next, jumper"
          @current-change="loadSales"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增营业记录" width="600px" @close="resetForm">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="门店" prop="storeId">
          <el-select v-model="form.storeId" style="width: 100%" placeholder="请选择门店">
            <el-option v-for="store in storeList" :key="store.id" :label="store.name" :value="store.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="营业日期" prop="saleDate">
          <el-date-picker v-model="form.saleDate" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="营业额" prop="totalAmount">
          <el-input-number v-model="form.totalAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="订单数" prop="orderCount">
          <el-input-number v-model="form.orderCount" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="成本" prop="costAmount">
          <el-input-number v-model="form.costAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="优惠金额" prop="discountAmount">
          <el-input-number v-model="form.discountAmount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="营业详情" width="600px">
      <el-descriptions :column="2" border v-if="currentSale">
        <el-descriptions-item label="营业日期">{{ currentSale.saleDate }}</el-descriptions-item>
        <el-descriptions-item label="门店">{{ currentSale.store?.name }}</el-descriptions-item>
        <el-descriptions-item label="营业额">¥{{ Number(currentSale.totalAmount).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="订单数">{{ currentSale.orderCount }}</el-descriptions-item>
        <el-descriptions-item label="成本">¥{{ Number(currentSale.costAmount || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="利润">¥{{ Number(currentSale.profitAmount || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="优惠">¥{{ Number(currentSale.discountAmount || 0).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="录入人">{{ currentSale.creator?.fullName }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentSale.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import api from '@/utils/api'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const formRef = ref(null)
const currentSale = ref(null)

const salesList = ref([])
const storeList = ref([])

const filters = reactive({
  startDate: '',
  endDate: ''
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

const form = reactive({
  storeId: null,
  saleDate: '',
  totalAmount: 0,
  orderCount: 0,
  costAmount: 0,
  discountAmount: 0,
  remark: ''
})

const rules = {
  storeId: [{ required: true, message: '请选择门店', trigger: 'change' }],
  saleDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  totalAmount: [{ required: true, message: '请输入营业额', trigger: 'blur' }],
  orderCount: [{ required: true, message: '请输入订单数', trigger: 'blur' }]
}

const loadSales = async () => {
  loading.value = true
  try {
    const res = await api.get('/operations/sales', {
      params: {
        page: pagination.page,
        limit: pagination.limit,
        start_date: filters.startDate,
        end_date: filters.endDate
      }
    })
    salesList.value = res.data || []
    pagination.total = res.meta?.total || 0
  } finally {
    loading.value = false
  }
}

const loadStores = async () => {
  try {
    const res = await api.get('/stores', { params: { limit: 100 } })
    storeList.value = res.data || []
  } catch (e) {}
}

const openCreateDialog = () => {
  dialogVisible.value = true
}

const resetForm = () => {
  form.storeId = null
  form.saleDate = ''
  form.totalAmount = 0
  form.orderCount = 0
  form.costAmount = 0
  form.discountAmount = 0
  form.remark = ''
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await api.post('/operations/sales', form)
        ElMessage.success('录入成功')
        dialogVisible.value = false
        loadSales()
      } finally {
        submitting.value = false
      }
    }
  })
}

const viewDetail = async (row) => {
  try {
    const res = await api.get(`/operations/sales/${row.id}`)
    currentSale.value = res
    detailVisible.value = true
  } catch (e) {}
}

const resetFilters = () => {
  filters.startDate = ''
  filters.endDate = ''
  pagination.page = 1
  loadSales()
}

onMounted(() => {
  loadSales()
  loadStores()
})
</script>

<style scoped>
.text-success {
  color: #67c23a;
}
.text-danger {
  color: #f56c6c;
}
</style>
