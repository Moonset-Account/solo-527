<template>
  <div class="parent-dashboard">
    <h2 class="page-title">欢迎回来，{{ userInfo?.child_name || '小朋友' }}的家长</h2>
    
    <el-row :gutter="20" class="stat-row">
      <el-col :span="8">
        <div class="stat-card my-borrows">
          <el-icon :size="32"><Notebook /></el-icon>
          <div class="stat-info">
            <div class="num">{{ borrowCount }}</div>
            <div class="label">当前借阅</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card my-activities">
          <el-icon :size="32"><Calendar /></el-icon>
          <div class="stat-info">
            <div class="num">{{ activityCount }}</div>
            <div class="label">活动报名</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card my-deposit">
          <el-icon :size="32"><Wallet /></el-icon>
          <div class="stat-info">
            <div class="num">¥{{ depositBalance }}</div>
            <div class="label">押金余额</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="14">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">我的借阅</h3>
            <el-button type="primary" link @click="$router.push('/parent/borrows')">查看全部</el-button>
          </div>
          <el-table :data="myBorrows" size="small">
            <el-table-column prop="book_title" label="绘本名称" />
            <el-table-column prop="borrow_date" label="借阅日期" width="110">
              <template #default="{ row }">{{ formatDate(row.borrow_date) }}</template>
            </el-table-column>
            <el-table-column prop="due_date" label="应还日期" width="110">
              <template #default="{ row }">{{ formatDate(row.due_date) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getBorrowStatusType(row)" size="small">
                  {{ getBorrowStatusText(row) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      
      <el-col :span="10">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">活动报名</h3>
            <el-button type="primary" link @click="$router.push('/parent/activities')">查看全部</el-button>
          </div>
          <div v-for="reg in myActivities" :key="reg.id" class="activity-item">
            <div class="activity-name">{{ reg.activity_title }}</div>
            <div class="activity-time">
              <el-icon><Clock /></el-icon>
              {{ formatDate(reg.activity_start_time) }}
            </div>
            <el-tag 
              :type="reg.status === 'confirmed' ? 'success' : (reg.status === 'waitlist' ? 'warning' : 'info')" 
              size="small"
            >
              <template v-if="reg.status === 'confirmed'">已确认</template>
              <template v-else-if="reg.status === 'waitlist'">
                候补 #{{ reg.waitlist_position }}
              </template>
              <template v-else>{{ reg.status }}</template>
            </el-tag>
          </div>
          <el-empty v-if="!myActivities.length" description="暂无活动报名" :image-size="80" />
        </div>
      </el-col>
    </el-row>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">押金流水</h3>
        <el-button type="primary" link @click="$router.push('/parent/deposits')">查看全部</el-button>
      </div>
      <el-table :data="recentDeposits" size="small">
        <el-table-column label="时间" width="160">
          <template #default="{ row }">{{ formatDate(row.create_time) }}</template>
        </el-table-column>
        <el-table-column prop="trans_type_display" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.trans_type === 'deduct' ? 'danger' : 'success'" size="small">
              {{ row.trans_type_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'pending'" type="warning" size="small">待确认</el-tag>
            <el-tag v-else-if="row.status === 'confirmed'" type="success" size="small">已确认</el-tag>
            <el-tag v-else-if="row.status === 'appealing'" type="info" size="small">申诉中</el-tag>
            <el-tag v-else size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.trans_type === 'deduct' ? '#f56c6c' : '#67c23a', fontWeight: '600' }">
              {{ row.trans_type === 'deduct' ? '-' : '+' }}¥{{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button 
              v-if="row.trans_type === 'deduct' && row.status === 'pending'" 
              type="primary" 
              size="small"
              @click="handleConfirmDeduct(row)"
            >
              确认
            </el-button>
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
      <el-empty v-if="!recentDeposits.length" description="暂无押金流水" :image-size="80" />
    </div>

    <el-dialog v-model="appealDialogVisible" title="押金申诉" width="500px">
      <el-form :model="appealForm" label-width="80px">
        <el-form-item label="交易金额">
          <span>¥{{ appealForm.amount }}</span>
        </el-form-item>
        <el-form-item label="申诉原因">
          <el-input v-model="appealForm.reason" type="textarea" :rows="4" placeholder="请输入申诉原因" />
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
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { getMyBorrows } from '@/api/borrows'
import { getMyRegistrations } from '@/api/activities'
import { getMyDepositAccount, getMyTransactions, appealTransaction, confirmTransaction } from '@/api/deposits'

const userInfo = ref({
  family_name: '',
  child_name: ''
})

const borrows = ref([])
const registrations = ref([])
const depositAccount = ref(null)
const transactions = ref([])

const borrowCount = computed(() => borrows.value.filter(b => b.status === 'borrowed').length)
const activityCount = computed(() => registrations.value.filter(r => r.status !== 'cancelled').length)
const depositBalance = computed(() => depositAccount.value?.balance || '0.00')

const myBorrows = computed(() => borrows.value.slice(0, 5))
const myActivities = computed(() => registrations.value.slice(0, 3))
const recentDeposits = computed(() => transactions.value.slice(0, 5))

const appealDialogVisible = ref(false)
const appealForm = reactive({
  id: null,
  amount: '',
  reason: ''
})

const fetchAllData = async () => {
  try {
    await Promise.all([
      fetchBorrows(),
      fetchRegistrations(),
      fetchDepositAccount(),
      fetchTransactions()
    ])
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

const fetchBorrows = async () => {
  try {
    const data = await getMyBorrows()
    borrows.value = data.results || data
  } catch (error) {
    console.error('获取借阅记录失败:', error)
  }
}

const fetchRegistrations = async () => {
  try {
    const data = await getMyRegistrations()
    registrations.value = data.results || data
  } catch (error) {
    console.error('获取活动报名失败:', error)
  }
}

const fetchDepositAccount = async () => {
  try {
    const data = await getMyDepositAccount()
    depositAccount.value = data
  } catch (error) {
    console.error('获取押金账户失败:', error)
  }
}

const fetchTransactions = async () => {
  try {
    const data = await getMyTransactions()
    transactions.value = data.results || data
  } catch (error) {
    console.error('获取交易流水失败:', error)
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').substring(0, 16)
}

const getBorrowStatusType = (row) => {
  if (row.status === 'returned') return 'info'
  if (row.is_overdue) return 'danger'
  return 'success'
}

const getBorrowStatusText = (row) => {
  if (row.status === 'returned') return '已归还'
  if (row.is_overdue) return '已逾期'
  return '借阅中'
}

const showAppeal = (row) => {
  appealForm.id = row.id
  appealForm.amount = row.amount
  appealForm.reason = ''
  appealDialogVisible.value = true
}

const handleConfirmDeduct = async (row) => {
  try {
    await confirmTransaction(row.id)
    ElMessage.success('扣减已确认')
    fetchTransactions()
    fetchDepositAccount()
  } catch (error) {
    console.error('确认失败:', error)
  }
}

const submitAppeal = async () => {
  if (!appealForm.reason) {
    ElMessage.warning('请输入申诉原因')
    return
  }
  try {
    await appealTransaction(appealForm.id, { appeal_reason: appealForm.reason })
    ElMessage.success('申诉已提交，请等待审核')
    appealDialogVisible.value = false
    fetchTransactions()
  } catch (error) {
    console.error('申诉失败:', error)
  }
}

onMounted(() => {
  fetchAllData()
})
</script>

<style scoped>
.parent-dashboard {
  padding: 0;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #303133;
}

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
}

.my-borrows {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.my-activities {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.my-deposit {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-info .num {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-info .label {
  font-size: 14px;
  opacity: 0.9;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.activity-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-name {
  font-weight: 500;
  margin-bottom: 6px;
  color: #303133;
}

.activity-time {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
