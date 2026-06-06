<template>
  <div class="debts-page">
    <div class="page-header">
      <h2>欠款管理</h2>
    </div>

    <el-card class="filter-card mb-20">
      <el-form :model="filters" inline>
        <el-form-item label="欠款编号">
          <el-input v-model="filters.keyword" placeholder="请输入欠款编号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="待还款" value="pending" />
            <el-option label="部分还款" value="partial" />
            <el-option label="已结清" value="paid" />
            <el-option label="已逾期" value="overdue" />
          </el-select>
        </el-form-item>
        <el-form-item label="逾期">
          <el-switch v-model="filters.is_overdue" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="debts" style="width: 100%" v-loading="loading">
        <el-table-column prop="debt_no" label="欠款编号" width="160" />
        <el-table-column prop="customer_name" label="客户">
          <template #default="{ row }">
            {{ row.customer?.name }}
          </template>
        </el-table-column>
        <el-table-column prop="order_no" label="关联订单" width="160">
          <template #default="{ row }">
            {{ row.order?.order_no || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="欠款金额" width="120">
          <template #default="{ row }">
            ¥{{ row.amount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="remaining_amount" label="剩余金额" width="120">
          <template #default="{ row }">
            <span class="text-danger">¥{{ row.remaining_amount?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="到期日期" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)">{{ getStatusName(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              v-if="['pending', 'partial', 'overdue'].includes(row.status) && hasPermission('debt.payment')"
              @click="handlePayment(row)"
            >
              还款
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.perPage"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="paymentDialogVisible" title="还款登记" width="500px">
      <el-form :model="paymentForm" label-width="100px">
        <el-form-item label="还款金额">
          <el-input-number v-model="paymentForm.amount" :min="0.01" :precision="2" />
        </el-form-item>
        <el-form-item label="还款方式">
          <el-select v-model="paymentForm.payment_method">
            <el-option label="现金" value="cash" />
            <el-option label="银行转账" value="bank" />
            <el-option label="微信" value="wechat" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="交易流水号">
          <el-input v-model="paymentForm.transaction_no" placeholder="请输入交易流水号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="paymentForm.remarks" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="paymentDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPayment">确认还款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const loading = ref(false)
const debts = ref([])
const paymentDialogVisible = ref(false)
const currentDebt = ref(null)

const filters = reactive({
  keyword: '',
  status: '',
  is_overdue: false,
})

const paymentForm = reactive({
  amount: 0,
  payment_method: 'cash',
  transaction_no: '',
  remarks: '',
})

const pagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
})

const hasPermission = (p) => userStore.hasPermission(p)

onMounted(() => {
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const response = await request.get('/debts', {
      params: {
        page: pagination.page,
        per_page: pagination.perPage,
        ...filters,
      },
    })
    debts.value = response.data.data
    pagination.total = response.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.status = ''
  filters.is_overdue = false
  pagination.page = 1
  fetchData()
}

function handlePageChange(page) {
  pagination.page = page
  fetchData()
}

function handleSizeChange(size) {
  pagination.perPage = size
  pagination.page = 1
  fetchData()
}

function handlePayment(row) {
  currentDebt.value = row
  paymentForm.amount = row.remaining_amount
  paymentForm.payment_method = 'cash'
  paymentForm.transaction_no = ''
  paymentForm.remarks = ''
  paymentDialogVisible.value = true
}

async function confirmPayment() {
  if (paymentForm.amount <= 0) {
    ElMessage.warning('请输入还款金额')
    return
  }
  try {
    await request.post(`/debts/${currentDebt.value.id}/payment`, paymentForm)
    ElMessage.success('还款成功')
    paymentDialogVisible.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

function getStatusType(row) {
  if (row.status === 'paid') return 'success'
  if (row.status === 'overdue' || (row.due_date && dayjs(row.due_date).isBefore(dayjs()))) return 'danger'
  if (row.status === 'partial') return 'warning'
  return 'info'
}

function getStatusName(row) {
  if (row.status === 'paid') return '已结清'
  if (row.status === 'overdue' || (row.due_date && dayjs(row.due_date).isBefore(dayjs()))) return '已逾期'
  if (row.status === 'partial') return '部分还款'
  return '待还款'
}
</script>

<style scoped lang="scss">
.debts-page {
  .page-header h2 {
    margin: 0 0 20px 0;
    font-size: 20px;
    font-weight: 600;
  }
  .text-danger {
    color: #F56C6C;
    font-weight: 500;
  }
  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
