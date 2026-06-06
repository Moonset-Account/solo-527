<template>
  <div class="my-deposit">
    <h2>我的押金</h2>
    
    <el-row :gutter="20" class="deposit-overview">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-label">押金余额</div>
          <div class="stat-value primary">¥{{ depositAccount?.balance || '0.00' }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-label">冻结金额</div>
          <div class="stat-value warning">¥{{ depositAccount?.frozen_amount || '0.00' }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-label">状态</div>
          <div class="stat-value">
            <el-tag :type="depositAccount?.is_active ? 'success' : 'danger'">
              {{ depositAccount?.is_active ? '正常' : '已冻结' }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-tabs v-model="activeTab" class="deposit-tabs">
      <el-tab-pane label="交易记录" name="transactions">
        <el-table :data="transactions" v-loading="loadingTransactions" stripe>
          <el-table-column prop="transaction_type_display" label="类型" width="100" />
          <el-table-column prop="amount" label="金额" width="120">
            <template #default="{ row }">
              <span :class="row.amount > 0 ? 'amount-positive' : 'amount-negative'">
                {{ row.amount > 0 ? '+' : '' }}{{ row.amount }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getTransactionStatusType(row.status)" size="small">
                {{ row.get_status_display || row.status_display || row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" />
          <el-table-column prop="related_borrow_id" label="关联借阅" width="120">
            <template #default="{ row }">
              {{ row.related_borrow_id || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button 
                type="warning" 
                size="small" 
                @click="openAppealDialog(row)"
                v-if="row.transaction_type === 'deduct' && row.status === 'confirmed' && !row.has_appeal"
              >
                申诉
              </el-button>
              <el-tag v-if="row.has_appeal" type="info" size="small">
                已申诉
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane label="申诉记录" name="appeals">
        <el-table :data="appeals" v-loading="loadingAppeals" stripe>
          <el-table-column prop="amount" label="申诉金额" width="120">
            <template #default="{ row }">
              <span class="amount-negative">¥{{ row.amount }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getAppealStatusType(row.status)" size="small">
                {{ row.status_display || row.get_status_display || row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="申诉理由" show-overflow-tooltip />
          <el-table-column label="处理结果">
            <template #default="{ row }">
              {{ row.admin_notes || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="申诉时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column prop="handled_at" label="处理时间" width="180">
            <template #default="{ row }">
              {{ row.handled_at ? formatDate(row.handled_at) : '-' }}
            </template>
          </el-table-column>
        </el-table>
        
        <el-empty v-if="!loadingAppeals && appeals.length === 0" description="暂无申诉记录" />
      </el-tab-pane>
    </el-tabs>
    
    <el-dialog v-model="appealDialogVisible" title="押金扣减申诉" width="500px">
      <el-form :model="appealForm" label-width="100px">
        <el-form-item label="原交易金额">
          <span>¥{{ appealForm.transaction_amount }}</span>
        </el-form-item>
        <el-form-item label="申诉理由" required>
          <el-input 
            v-model="appealForm.reason" 
            type="textarea" 
            :rows="4" 
            placeholder="请详细说明申诉理由..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="凭证图片">
          <el-upload
            v-model:file-list="appealForm.proof_images"
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :limit="3"
            accept="image/*"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">最多上传3张图片作为申诉凭证</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appealDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAppeal" :loading="submittingAppeal">
          提交申诉
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import api from '@/api'

const activeTab = ref('transactions')
const depositAccount = ref(null)
const transactions = ref([])
const appeals = ref([])
const loadingTransactions = ref(false)
const loadingAppeals = ref(false)

const appealDialogVisible = ref(false)
const submittingAppeal = ref(false)
const appealForm = reactive({
  transaction_id: null,
  transaction_amount: 0,
  reason: '',
  proof_images: []
})

const getTransactionStatusType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'confirmed': 'success',
    'failed': 'danger',
    'cancelled': 'info'
  }
  return typeMap[status] || 'info'
}

const getAppealStatusType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger'
  }
  return typeMap[status] || 'info'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadDepositAccount = async () => {
  try {
    const res = await api.deposits.myAccount()
    depositAccount.value = res
  } catch (error) {
    console.error('加载押金账户失败', error)
  }
}

const loadTransactions = async () => {
  loadingTransactions.value = true
  try {
    const res = await api.deposits.myTransactions()
    transactions.value = res.results || res
  } catch (error) {
    ElMessage.error('加载交易记录失败')
  } finally {
    loadingTransactions.value = false
  }
}

const loadAppeals = async () => {
  loadingAppeals.value = true
  try {
    const res = await api.deposits.myAppeals()
    appeals.value = res.results || res
  } catch (error) {
    console.error('加载申诉记录失败', error)
  } finally {
    loadingAppeals.value = false
  }
}

const openAppealDialog = (transaction) => {
  appealForm.transaction_id = transaction.id
  appealForm.transaction_amount = Math.abs(transaction.amount)
  appealForm.reason = ''
  appealForm.proof_images = []
  appealDialogVisible.value = true
}

const submitAppeal = async () => {
  if (!appealForm.reason.trim()) {
    ElMessage.warning('请填写申诉理由')
    return
  }
  
  submittingAppeal.value = true
  try {
    await api.deposits.createAppeal({
      transaction_id: appealForm.transaction_id,
      reason: appealForm.reason
    })
    
    ElMessage.success('申诉提交成功，请等待管理员处理')
    appealDialogVisible.value = false
    loadTransactions()
    loadAppeals()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '提交失败')
  } finally {
    submittingAppeal.value = false
  }
}

onMounted(() => {
  loadDepositAccount()
  loadTransactions()
  loadAppeals()
})
</script>

<style scoped>
.my-deposit {
  padding: 20px;
}

.my-deposit h2 {
  margin-bottom: 20px;
}

.deposit-overview {
  margin-bottom: 30px;
}

.stat-card {
  text-align: center;
}

.stat-label {
  color: #909399;
  margin-bottom: 10px;
  font-size: 14px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.stat-value.primary {
  color: #409eff;
}

.stat-value.warning {
  color: #e6a23c;
}

.deposit-tabs {
  margin-top: 20px;
}

.amount-positive {
  color: #67c23a;
  font-weight: 500;
}

.amount-negative {
  color: #f56c6c;
  font-weight: 500;
}

.upload-tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}
</style>
