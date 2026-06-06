<template>
  <div class="dashboard">
    <h2 class="page-title">工作台</h2>
    
    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card card-1">
          <div class="icon-wrapper">
            <el-icon :size="32"><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="number">{{ dashboardData.today_returns?.count || 0 }}</div>
            <div class="label">今日待归还</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-2">
          <div class="icon-wrapper">
            <el-icon :size="32"><Tools /></el-icon>
          </div>
          <div class="stat-content">
            <div class="number">{{ dashboardData.pending_repairs?.count || 0 }}</div>
            <div class="label">待修复绘本</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-3">
          <div class="icon-wrapper">
            <el-icon :size="32"><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="number">{{ dashboardData.waitlist_activities?.count || 0 }}</div>
            <div class="label">故事会候补</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card card-4">
          <div class="icon-wrapper">
            <el-icon :size="32"><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="number">{{ dashboardData.abnormal_deposits?.count || 0 }}</div>
            <div class="label">押金异常</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Clock /></el-icon>
              今日待归还
            </h3>
            <el-button type="primary" link @click="goToBorrows">查看全部</el-button>
          </div>
          <el-table :data="dashboardData.today_returns?.items || []" size="small">
            <el-table-column prop="book_title" label="绘本名称" />
            <el-table-column prop="member_name" label="会员" width="100" />
            <el-table-column prop="member_phone" label="电话" width="120" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.is_overdue ? 'danger' : 'warning'" size="small">
                  {{ row.is_overdue ? '已逾期' : '今日到期' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!dashboardData.today_returns?.items?.length" description="今日无待归还绘本" />
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Tools /></el-icon>
              待修复绘本
            </h3>
            <el-button type="primary" link @click="goToRepairs">查看全部</el-button>
          </div>
          <el-table :data="dashboardData.pending_repairs?.items || []" size="small">
            <el-table-column prop="book_title" label="绘本名称" />
            <el-table-column prop="damage_level_display" label="破损程度" width="100">
              <template #default="{ row }">
                <el-tag :type="getDamageTagType(row.damage_level)" size="small">
                  {{ row.damage_level_display }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reporter" label="录入人" width="100" />
          </el-table>
          <el-empty v-if="!dashboardData.pending_repairs?.items?.length" description="暂无待修复绘本" />
        </div>
      </el-col>

      <el-col :span="12">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><UserFilled /></el-icon>
              故事会候补
            </h3>
            <el-button type="primary" link @click="goToActivities">查看全部</el-button>
          </div>
          <div v-for="activity in dashboardData.waitlist_activities?.items || []" :key="activity.id" class="waitlist-item">
            <div class="activity-info">
              <span class="activity-title">{{ activity.title }}</span>
              <span class="waitlist-count">候补 {{ activity.waitlist_count }} 人</span>
            </div>
            <div class="waitlist-users">
              <el-tag v-for="item in activity.waitlist_items" :key="item.id" size="small" type="info">
                {{ item.member_name }} #{{ item.position }}
              </el-tag>
            </div>
          </div>
          <el-empty v-if="!dashboardData.waitlist_activities?.items?.length" description="暂无候补活动" />
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><WarningFilled /></el-icon>
              押金异常
            </h3>
            <el-button type="primary" link @click="goToDeposits">查看全部</el-button>
          </div>
          <el-table :data="dashboardData.abnormal_deposits?.items || []" size="small">
            <el-table-column prop="member_name" label="会员" width="120" />
            <el-table-column prop="balance" label="余额" width="100">
              <template #default="{ row }">
                <span style="color: #f56c6c">¥{{ row.balance }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="异常原因" />
          </el-table>
          <el-empty v-if="!dashboardData.abnormal_deposits?.items?.length" description="暂无押金异常" />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><TrendCharts /></el-icon>
              即将满额的活动
            </h3>
          </div>
          <el-row :gutter="16">
            <el-col :span="6" v-for="activity in dashboardData.almost_full_activities?.items || []" :key="activity.id">
              <div class="activity-card">
                <h4>{{ activity.title }}</h4>
                <div class="activity-meta">
                  <el-icon><Calendar /></el-icon>
                  {{ formatDate(activity.start_time) }}
                </div>
                <el-progress 
                  :percentage="activity.fill_rate" 
                  :color="getProgressColor(activity.fill_rate)"
                  :stroke-width="8"
                />
                <div class="capacity-info">
                  {{ activity.current_capacity }} / {{ activity.max_capacity }} 人
                </div>
              </div>
            </el-col>
          </el-row>
          <el-empty v-if="!dashboardData.almost_full_activities?.items?.length" description="暂无即将满额的活动" />
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const dashboardData = ref({
  today_returns: {
    count: 3,
    items: [
      { id: 1, book_title: '猜猜我有多爱你', member_name: '王家长', member_phone: '13800000001', is_overdue: false },
      { id: 2, book_title: '好饿的毛毛虫', member_name: '李家长', member_phone: '13800000002', is_overdue: true },
      { id: 3, book_title: '我爸爸', member_name: '张家长', member_phone: '13800000003', is_overdue: false }
    ]
  },
  pending_repairs: {
    count: 2,
    items: [
      { id: 1, book_title: '不一样的卡梅拉', damage_level: 'affect_read', damage_level_display: '影响阅读', reporter: '李馆员' },
      { id: 2, book_title: '神奇校车', damage_level: 'need_off', damage_level_display: '需下架', reporter: '王馆员' }
    ]
  },
  waitlist_activities: {
    count: 1,
    items: [
      {
        id: 1,
        title: '周六海洋主题故事会',
        waitlist_count: 3,
        waitlist_items: [
          { id: 1, member_name: '赵家长', position: 1 },
          { id: 2, member_name: '钱家长', position: 2 },
          { id: 3, member_name: '孙家长', position: 3 }
        ]
      }
    ]
  },
  abnormal_deposits: {
    count: 1,
    items: [
      { id: 1, member_name: '周家长', balance: '-50.00', reason: '押金余额不足' }
    ]
  },
  almost_full_activities: {
    count: 2,
    items: [
      { id: 1, title: '周日手工绘本课', start_time: '2024-01-14 14:00:00', current_capacity: 18, max_capacity: 20, fill_rate: 90 },
      { id: 2, title: '周三亲子阅读会', start_time: '2024-01-17 10:00:00', current_capacity: 16, max_capacity: 20, fill_rate: 80 }
    ]
  }
})

const getDamageTagType = (level) => {
  const types = {
    light: 'success',
    affect_read: 'warning',
    need_off: 'danger'
  }
  return types[level] || 'info'
}

const getProgressColor = (rate) => {
  if (rate >= 90) return '#f56c6c'
  if (rate >= 80) return '#e6a23c'
  return '#67c23a'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.substring(0, 16)
}

const goToBorrows = () => router.push('/librarian/borrows')
const goToRepairs = () => router.push('/librarian/repairs')
const goToActivities = () => router.push('/librarian/activities')
const goToDeposits = () => router.push('/librarian/deposits')

onMounted(() => {
})
</script>

<style scoped>
.dashboard {
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
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
}

.card-1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card-2 {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card-3 {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card-4 {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  flex: 1;
}

.stat-content .number {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-content .label {
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
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.waitlist-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.waitlist-item:last-child {
  border-bottom: none;
}

.activity-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.activity-title {
  font-weight: 500;
  color: #303133;
}

.waitlist-count {
  color: #909399;
  font-size: 13px;
}

.waitlist-users {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.activity-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
}

.activity-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.activity-card h4 {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.activity-meta {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.capacity-info {
  text-align: center;
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
}
</style>
