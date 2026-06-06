<template>
  <div class="deposit-manage">
    <div class="page-header">
      <h2>押金管理</h2>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="押金账户" name="accounts">
        <div class="filter-bar">
          <el-form :inline="true" :model="accountFilters" @submit.prevent>
            <el-form-item label="家庭名称">
              <el-input v-model="accountFilters.family_name" placeholder="请输入" clearable @keyup.enter="loadAccounts" />
            </el-form-item>
            <el-form-item label="账户状态">
              <el-select v-model="accountFilters.status" placeholder="全部" clearable @change="loadAccounts">
                <el-option label="正常" value="active" />
                <el-option label="冻结" value="frozen" />
                <el-option label="已关闭" value="closed" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadAccounts">查询</el-button>
              <el-button @click="resetAccountFilters">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-table :data="accounts" stripe v-loading="loadingAccounts">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="family_name" label="家庭名称" min-width="150" />
          <el-table-column prop="balance" label="可用余额" width="120">
            <template #default="{ row }">¥{{ row.balance }}</template>
          </el-table-column>
          <el-table-column prop="frozen_amount" label="冻结金额" width="120">
            <template #default="{ row }">¥{{ row.frozen_amount }}</template>
          </el-table-column>
          <el-table-column prop="total_balance" label="总余额" width="120">
            <template #default="{ row }">¥{{ row.total_balance }}</template>
          </el-table-column>
          <el-table-column prop="status_display" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'warning'" size="small">
                {{ row.status_display }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="total_deposited" label="累计充值" width="120">
            <template #default="{ row }">¥{{ row.total_deposited }}</template>
          </el-table-column>
          <el-table-column prop="last_transaction_at" label="最后交易时间" width="160">
            <template #default="{ row }">{{ formatDateTime(row.last_transaction_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" link @click="handleRecharge(row)">充值</el-button>
              <el-button type="danger" size="small" link @click="handleDeduct(row)">扣款</el-button>
              <el-button size="small" link @click="viewTransactions(row)">交易记录</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="accountPagination.page"
          v-model:page-size="accountPagination.pageSize"
          :total="accountPagination.total"
          layout="total, prev, pager, next"
          @current-change="loadAccounts"
          class="pagination"
        />
      </el-tab-pane>

      <el-tab-pane label="交易记录" name="transactions">
        <div class="filter-bar">
          <el-form :inline="true" :model="transactionFilters" @submit.prevent>
            <el-form-item label="交易类型">
              <el-select v-model="transactionFilters.transaction_type" placeholder="全部" clearable @change="loadTransactions">
                <el-option label="充值" value="deposit" />
                <el-option label="扣除" value="deduct" />
                <el-option label="冻结" value="freeze" />
                <el-option label="解冻" value="unfreeze" />
                <el-option label="退款" value="refund" />
                <el-option label="调整" value="adjust" />
              </el-select>
            </el-form-item>
            <el-form-item label="待确认">
              <el-switch v-model="transactionFilters.needs_confirmation" @change="loadTransactions" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadTransactions">查询</el-button>
              <el-button @click="resetTransactionFilters">重置</el-button>
              <el-button type="success" @click="handleExportTransactions">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-table :data="transactions" stripe v-loading="loadingTransactions">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="family_name" label="家庭" width="150" />
          <el-table-column prop="transaction_type_display" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTransactionType(row.transaction_type)" size="small">
                {{ row.transaction_type_display }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="100">
            <template #default="{ row }">
              <span :class="{ 'text-danger': row.transaction_type === 'deduct', 'text-success': row.transaction_type === 'deposit' }">
                {{ row.transaction_type === 'deduct' || row.transaction_type === 'freeze' ? '-' : '+' }}¥{{ row.amount }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="balance_after" label="可用余额" width="120">
            <template #default="{ row }">¥{{ row.balance_after }}</template>
          </el-table-column>
          <el-table-column prop="frozen_after" label="冻结金额" width="120">
            <template #default="{ row }">¥{{ row.frozen_after }}</template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="200" />
          <el-table-column prop="operator_name" label="操作人" width="100" />
          <el-table-column prop="created_at" label="交易时间" width="160">
            <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="确认状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.needs_confirmation && !row.confirmed_at" type="warning" size="small">待确认</el-tag>
              <el-tag v-else-if="row.confirmed_at" type="success" size="small">已确认</el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.needs_confirmation && !row.confirmed_at"
                type="success"
                size="small"
                link
                @click="handleConfirm(row)"
              >
                确认
              </el-button>
              <el-button v-if="row.has_appeal" type="warning" size="small" link @click="viewAppeals(row)">
                有申诉
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="transactionPagination.page"
          v-model:page-size="transactionPagination.pageSize"
          :total="transactionPagination.total"
          layout="total, prev, pager, next"
          @current-change="loadTransactions"
          class="pagination"
        />
      </el-tab-pane>

      <el-tab-pane label="申诉管理" name="appeals">
        <div class="filter-bar">
          <el-form :inline="true" :model="appealFilters" @submit.prevent>
            <el-form-item label="申诉状态">
              <el-select v-model="appealFilters.status" placeholder="全部" clearable @change="loadAppeals">
                <el-option label="待处理" value="pending" />
                <el-option label="已通过" value="approved" />
                <el-option label="已驳回" value="rejected" />
                <el-option label="已关闭" value="closed" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadAppeals">查询</el-button>
              <el-button @click="resetAppealFilters">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-table :data="appeals" stripe v-loading="loadingAppeals">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="family_name" label="申诉家庭" width="150" />
          <el-table-column prop="appellant_name" label="申诉人" width="100" />
          <el-table-column prop="reason" label="申诉理由" min-width="200" show-overflow-tooltip />
          <el-table-column label="关联交易" width="200">
            <template #default="{ row }">
              <div v-if="row.transaction">
                <div>{{ row.transaction.transaction_type_display }} - ¥{{ row.transaction.amount }}</div>
                <div class="text-sm text-gray">{{ row.transaction.description }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="status_display" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getAppealStatusType(row.status)" size="small">
                {{ row.status_display }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="申诉时间" width="160">
            <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
          </el-table-column>
          <el-table-column prop="handler_name" label="处理人" width="100" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 'pending'" type="success" size="small" link @click="handleApprove(row)">
                通过
              </el-button>
              <el-button v-if="row.status === 'pending'" type="danger" size="small" link @click="handleReject(row)">
                驳回
              </el-button>
              <el-button size="small" link @click="viewAppealDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-model:current-page="appealPagination.page"
          v-model:page-size="appealPagination.pageSize"
          :total="appealPagination.total"
          layout="total, prev, pager, next"
          @current-change="loadAppeals"
          class="pagination"
        />
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showRechargeDialog" title="押金充值" width="400px">
      <el-form :model="rechargeForm" label-width="80px">
        <el-form-item label="充值金额">
          <el-input-number v-model="rechargeForm.amount" :min="0.01" :precision="2" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="rechargeForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRechargeDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRecharge">确认充值</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDeductDialog" title="押金扣款" width="400px">
      <el-form :model="deductForm" label-width="80px">
        <el-form-item label="扣款金额">
          <el-input-number v-model="deductForm.amount" :min="0.01" :precision="2" />
        </el-form-item>
        <el-form-item label="扣款原因">
          <el-input v-model="deductForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="需要确认">
          <el-switch v-model="deductForm.require_confirmation" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDeductDialog = false">取消</el-button>
        <el-button type="primary" @click="submitDeduct">确认扣款</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showHandleAppealDialog" :title="appealHandleAction === 'approve' ? '通过申诉' : '驳回申诉'" width="500px">
      <el-form label-width="80px">
        <el-form-item label="处理意见">
          <el-input v-model="appealHandleForm.notes" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item v-if="appealHandleAction === 'approve'" label="退款金额">
          <el-input-number v-model="appealHandleForm.refund_amount" :min="0" :precision="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showHandleAppealDialog = false">取消</el-button>
        <el-button type="primary" @click="submitHandleAppeal">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { api } from '@/api'
import dayjs from 'dayjs'

const activeTab = ref('accounts')

const accounts = ref([])
const loadingAccounts = ref(false)
const accountFilters = reactive({
  family_name: '',
  status: ''
})
const accountPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const transactions = ref([])
const loadingTransactions = ref(false)
const transactionFilters = reactive({
  transaction_type: '',
  needs_confirmation: false
})
const transactionPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const appeals = ref([])
const loadingAppeals = ref(false)
const appealFilters = reactive({
  status: ''
})
const appealPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const showRechargeDialog = ref(false)
const showDeductDialog = ref(false)
const showHandleAppealDialog = ref(false)
const selectedAccount = ref(null)
const selectedTransaction = ref(null)
const selectedAppeal = ref(null)
const appealHandleAction = ref('')

const rechargeForm = reactive({
  amount: 0,
  description: ''
})

const deductForm = reactive({
  amount: 0,
  description: '',
  require_confirmation: true
})

const appealHandleForm = reactive({
  notes: '',
  refund_amount: 0
})

function formatDateTime(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

function getTransactionType(type) {
  const map = {
    deposit: 'success',
    deduct: 'danger',
    freeze: 'warning',
    unfreeze: 'info',
    refund: 'success',
    adjust: 'primary'
  }
  return map[type] || 'info'
}

function getAppealStatusType(status) {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    closed: 'info'
  }
  return map[status] || 'info'
}

async function loadAccounts() {
  loadingAccounts.value = true
  try {
    const params = {
      page: accountPagination.page,
      page_size: accountPagination.pageSize,
      ...Object.fromEntries(Object.entries(accountFilters).filter(([_, v]) => v))
    }
    const data = await api.deposits.list(params)
    accounts.value = data.results || data
    accountPagination.total = data.count || data.length
  } catch (error) {
    ElMessage.error('加载押金账户失败')
  } finally {
    loadingAccounts.value = false
  }
}

function resetAccountFilters() {
  accountFilters.family_name = ''
  accountFilters.status = ''
  accountPagination.page = 1
  loadAccounts()
}

async function loadTransactions() {
  loadingTransactions.value = true
  try {
    const params = {
      page: transactionPagination.page,
      page_size: transactionPagination.pageSize,
      ...Object.fromEntries(Object.entries(transactionFilters).filter(([_, v]) => v !== '' && v !== false))
    }
    if (transactionFilters.needs_confirmation) {
      params.needs_confirmation = 'true'
    }
    const data = await api.deposits.transactions.list(params)
    transactions.value = data.results || data
    transactionPagination.total = data.count || data.length
  } catch (error) {
    ElMessage.error('加载交易记录失败')
  } finally {
    loadingTransactions.value = false
  }
}

function resetTransactionFilters() {
  transactionFilters.transaction_type = ''
  transactionFilters.needs_confirmation = false
  transactionPagination.page = 1
  loadTransactions()
}

async function loadAppeals() {
  loadingAppeals.value = true
  try {
    const params = {
      page: appealPagination.page,
      page_size: appealPagination.pageSize,
      ...Object.fromEntries(Object.entries(appealFilters).filter(([_, v]) => v))
    }
    const data = await api.deposits.appeals.list(params)
    appeals.value = data.results || data
    appealPagination.total = data.count || data.length
  } catch (error) {
    ElMessage.error('加载申诉列表失败')
  } finally {
    loadingAppeals.value = false
  }
}

function resetAppealFilters() {
  appealFilters.status = ''
  appealPagination.page = 1
  loadAppeals()
}

function handleRecharge(row) {
  selectedAccount.value = row
  rechargeForm.amount = 0
  rechargeForm.description = ''
  showRechargeDialog.value = true
}

async function submitRecharge() {
  if (!rechargeForm.amount || rechargeForm.amount <= 0) {
    ElMessage.warning('请输入充值金额')
    return
  }
  try {
    await api.deposits.recharge(selectedAccount.value.id, rechargeForm)
    ElMessage.success('充值成功')
    showRechargeDialog.value = false
    loadAccounts()
  } catch (error) {}
}

function handleDeduct(row) {
  selectedAccount.value = row
  deductForm.amount = 0
  deductForm.description = ''
  deductForm.require_confirmation = true
  showDeductDialog.value = true
}

async function submitDeduct() {
  if (!deductForm.amount || deductForm.amount <= 0) {
    ElMessage.warning('请输入扣款金额')
    return
  }
  if (!deductForm.description) {
    ElMessage.warning('请输入扣款原因')
    return
  }
  try {
    await api.deposits.deduct(selectedAccount.value.id, deductForm)
    ElMessage.success('扣款成功')
    showDeductDialog.value = false
    loadAccounts()
    loadTransactions()
  } catch (error) {}
}

async function handleConfirm(row) {
  try {
    await ElMessageBox.confirm('确认该笔交易吗？', '确认交易', { type: 'info' })
    await api.deposits.transactions.confirm(row.id)
    ElMessage.success('已确认')
    loadTransactions()
  } catch (error) {}
}

function viewTransactions(row) {
  selectedAccount.value = row
  activeTab.value = 'transactions'
  transactionFilters.family_name = row.family_name
  loadTransactions()
}

function viewAppeals(row) {
  selectedTransaction.value = row
  activeTab.value = 'appeals'
  loadAppeals()
}

function viewAppealDetail(row) {
  ElMessage.info('申诉详情功能开发中')
}

function handleApprove(row) {
  selectedAppeal.value = row
  appealHandleAction.value = 'approve'
  appealHandleForm.notes = ''
  appealHandleForm.refund_amount = row.transaction ? row.transaction.amount : 0
  showHandleAppealDialog.value = true
}

function handleReject(row) {
  selectedAppeal.value = row
  appealHandleAction.value = 'reject'
  appealHandleForm.notes = ''
  showHandleAppealDialog.value = true
}

async function submitHandleAppeal() {
  try {
    await api.deposits.appeals.handle(selectedAppeal.value.id, {
      action: appealHandleAction.value,
      notes: appealHandleForm.notes,
      refund_amount: appealHandleForm.refund_amount
    })
    ElMessage.success('处理成功')
    showHandleAppealDialog.value = false
    loadAppeals()
    loadTransactions()
  } catch (error) {}
}

function handleExportTransactions() {
  const params = Object.fromEntries(Object.entries(transactionFilters).filter(([_, v]) => v))
  api.deposits.transactions.export(params).then(blob => {
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `押金交易记录_${dayjs().format('YYYYMMDD')}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('导出成功')
  }).catch(() => {
    ElMessage.error('导出失败')
  })
}

onMounted(() => {
  loadAccounts()
  loadTransactions()
  loadAppeals()
})
</script>

<style scoped>
.deposit-manage {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.filter-bar {
  background: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

.text-sm {
  font-size: 12px;
}

.text-gray {
  color: #909399;
}
</style>
