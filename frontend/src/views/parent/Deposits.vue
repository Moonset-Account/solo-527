<template>
  <div class="page-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <div class="card balance-card">
          <h3>押金余额</h3>
          <div class="balance">¥{{ account.balance }}</div>
          <el-tag v-if="account.is_abnormal" type="danger">账户异常</el-tag>
        </div>
      </el-col>
    </el-row>

    <div class="card">
      <h3 class="card-title">交易流水</h3>
      <el-table :data="transactions" stripe>
        <el-table-column prop="create_time" label="时间" width="180" />
        <el-table-column prop="trans_type_display" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.trans_type === 'deduct' ? 'danger' : 'success'" size="small">
              {{ row.trans_type_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span :style="{ color: row.trans_type === 'deduct' ? '#f56c6c' : '#67c23a', fontWeight: '600' }">
              {{ row.trans_type === 'deduct' ? '-' : '+' }}¥{{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" />
        <el-table-column prop="status_display" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button 
              v-if="row.trans_type === 'deduct' && row.status === 'confirmed'" 
              type="text" 
              size="small"
              @click="showAppeal(row)"
            >
              申诉
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="appealDialogVisible" title="押金申诉" width="500px">
      <el-form :model="appealForm" label-width="80px">
        <el-form-item label="交易金额">
          <span>¥{{ appealForm.amount }}</span>
        </el-form-item>
        <el-form-item label="交易说明">
          <span>{{ appealForm.description }}</span>
        </el-form-item>
        <el-form-item label="申诉原因" required>
          <el-input v-model="appealForm.reason" type="textarea" :rows="4" placeholder="请详细说明申诉原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appealDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAppeal">提交申诉</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const account = ref({
  balance: '150.00',
  is_abnormal: false
})

const transactions = ref([
  { id: 1, create_time: '2024-01-08 15:30:00', trans_type: 'deduct', trans_type_display: '押金扣减', amount: '50.00', description: '绘本《小恐龙》内页撕毁赔偿', status: 'appealing', status_display: '申诉中' },
  { id: 2, create_time: '2024-01-05 14:30:00', trans_type: 'deduct', trans_type_display: '押金扣减', amount: '50.00', description: '绘本破损赔偿', status: 'confirmed', status_display: '已确认' },
  { id: 3, create_time: '2024-01-01 10:00:00', trans_type: 'deposit', trans_type_display: '押金充值', amount: '200.00', description: '初始押金', status: 'confirmed', status_display: '已确认' }
])

const appealDialogVisible = ref(false)
const appealForm = reactive({
  id: null,
  amount: '',
  description: '',
  reason: ''
})

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    confirmed: 'success',
    rejected: 'danger',
    appealing: 'info'
  }
  return types[status] || 'info'
}

const showAppeal = (row) => {
  appealForm.id = row.id
  appealForm.amount = row.amount
  appealForm.description = row.description
  appealForm.reason = ''
  appealDialogVisible.value = true
}

const submitAppeal = () => {
  if (!appealForm.reason) {
    ElMessage.warning('请输入申诉原因')
    return
  }
  ElMessage.success('申诉已提交，请等待馆员审核')
  appealDialogVisible.value = false
}
</script>

<style scoped>
.balance-card {
  text-align: center;
}

.balance-card h3 {
  font-size: 16px;
  color: #606266;
  margin-bottom: 16px;
}

.balance {
  font-size: 36px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 12px;
}
</style>
