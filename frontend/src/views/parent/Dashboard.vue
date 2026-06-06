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
            <el-table-column prop="borrow_date" label="借阅日期" width="100">
              <template #default="{ row }">{{ row.borrow_date }}</template>
            </el-table-column>
            <el-table-column prop="due_date" label="应还日期" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.is_overdue ? 'danger' : 'success'" size="small">
                  {{ row.is_overdue ? '已逾期' : '借阅中' }}
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
          <div v-for="activity in myActivities" :key="activity.id" class="activity-item">
            <div class="activity-name">{{ activity.activity_title }}</div>
            <div class="activity-time">
              <el-icon><Clock /></el-icon>
              {{ activity.activity_start_time }}
            </div>
            <el-tag :type="activity.status === 'confirmed' ? 'success' : 'warning'" size="small">
              {{ activity.status === 'confirmed' ? '已确认' : (activity.waitlist_position ? `候补 #${activity.waitlist_position}` : '候补中') }}
            </el-tag>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">押金流水</h3>
        <el-button type="primary" link @click="$router.push('/parent/deposits')">查看全部</el-button>
      </div>
      <el-table :data="recentDeposits" size="small">
        <el-table-column prop="create_time" label="时间" width="160" />
        <el-table-column prop="trans_type_display" label="类型" width="100" />
        <el-table-column prop="description" label="说明" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.trans_type === 'deduct' ? '#f56c6c' : '#67c23a' }">
              {{ row.trans_type === 'deduct' ? '-' : '+' }}¥{{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
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
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const userInfo = ref({
  family_name: '王家长',
  child_name: '小明'
})

const borrowCount = ref(2)
const activityCount = ref(1)
const depositBalance = ref('150.00')

const myBorrows = ref([
  { id: 1, book_title: '猜猜我有多爱你', borrow_date: '2024-01-01', due_date: '2024-01-15', is_overdue: false },
  { id: 2, book_title: '好饿的毛毛虫', borrow_date: '2023-12-25', due_date: '2024-01-08', is_overdue: true }
])

const myActivities = ref([
  { id: 1, activity_title: '周六海洋主题故事会', activity_start_time: '2024-01-13 10:00', status: 'confirmed' },
  { id: 2, activity_title: '周日手工绘本课', activity_start_time: '2024-01-14 14:00', status: 'waitlist', waitlist_position: 2 }
])

const recentDeposits = ref([
  { id: 1, create_time: '2024-01-05 14:30', trans_type: 'deduct', trans_type_display: '押金扣减', amount: '50.00', description: '绘本破损赔偿', status: 'confirmed' },
  { id: 2, create_time: '2024-01-01 10:00', trans_type: 'deposit', trans_type_display: '押金充值', amount: '200.00', description: '初始押金', status: 'confirmed' }
])

const appealDialogVisible = ref(false)
const appealForm = reactive({
  id: null,
  amount: '',
  reason: ''
})

const showAppeal = (row) => {
  appealForm.id = row.id
  appealForm.amount = row.amount
  appealForm.reason = ''
  appealDialogVisible.value = true
}

const submitAppeal = () => {
  if (!appealForm.reason) {
    ElMessage.warning('请输入申诉原因')
    return
  }
  ElMessage.success('申诉已提交，请等待审核')
  appealDialogVisible.value = false
}
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
