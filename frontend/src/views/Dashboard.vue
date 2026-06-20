<template>
  <div class="dashboard">
    <div class="stats-section mb-20">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon order-icon">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.overview?.totalOrders || 0 }}</div>
              <div class="stat-label">总订单数</div>
              <div class="stat-sub">今日 {{ stats.overview?.todayOrders || 0 }} 单</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon pending-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.overview?.pendingOrders || 0 }}</div>
              <div class="stat-label">待确认订单</div>
              <div class="stat-sub pending">待处理</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon schedule-icon">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.overview?.todaySchedules || 0 }}</div>
              <div class="stat-label">今日排期</div>
              <div class="stat-sub">进行中</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon revenue-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">¥{{ formatNumber(stats.overview?.revenueToday || 0) }}</div>
              <div class="stat-label">今日营收</div>
              <div class="stat-sub">累计统计</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="16">
      <el-col :span="12">
        <div class="card mb-20">
          <div class="flex-between mb-16">
            <div class="section-title" style="margin-bottom: 0">待处理异常</div>
            <el-button text type="primary" @click="goToOrders">查看全部</el-button>
          </div>
          <div class="anomaly-list">
            <div v-if="anomalies.pendingOrders?.length === 0" class="empty-text">
              暂无待处理订单
            </div>
            <div
              v-for="order in anomalies.pendingOrders?.slice(0, 5)"
              :key="order.id"
              class="anomaly-item"
              @click="goToOrderDetail(order.id)"
            >
              <div class="anomaly-icon pending">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="anomaly-info">
                <div class="anomaly-title">{{ order.orderNo }}</div>
                <div class="anomaly-desc">{{ order.customerName }} - ¥{{ order.totalAmount }}</div>
              </div>
              <div class="anomaly-time">
                {{ formatTime(order.createdAt) }}
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex-between mb-16">
            <div class="section-title" style="margin-bottom: 0">库存预警</div>
            <el-button text type="primary" @click="goToInventory">查看全部</el-button>
          </div>
          <div class="anomaly-list">
            <div v-if="anomalies.lowStock?.length === 0" class="empty-text">
              暂无库存预警
            </div>
            <div
              v-for="item in anomalies.lowStock?.slice(0, 5)"
              :key="item.id"
              class="anomaly-item"
              @click="goToInventoryDetail(item.id)"
            >
              <div class="anomaly-icon warning">
                <el-icon><Goods /></el-icon>
              </div>
              <div class="anomaly-info">
                <div class="anomaly-title">{{ item.tourName }}</div>
                <div class="anomaly-desc">{{ item.tourDate }} {{ item.startTime }}</div>
              </div>
              <div class="anomaly-badge">
                仅剩 {{ item.remaining }} 位
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="12">
        <div class="card mb-20">
          <div class="flex-between mb-16">
            <div class="section-title" style="margin-bottom: 0">今日清洁任务</div>
            <el-button text type="primary" @click="goToCleaning">查看全部</el-button>
          </div>
          <div class="anomaly-list">
            <div v-if="anomalies.overdueCleaning?.length === 0" class="empty-text">
              暂无待处理清洁任务
            </div>
            <div
              v-for="task in anomalies.overdueCleaning?.slice(0, 5)"
              :key="task.id"
              class="anomaly-item"
              @click="goToCleaningTasks"
            >
              <div class="anomaly-icon cleaning">
                <el-icon><Brush /></el-icon>
              </div>
              <div class="anomaly-info">
                <div class="anomaly-title">{{ task.taskNo }}</div>
                <div class="anomaly-desc">{{ formatCleaningType(task.cleaningType) }} · {{ task.assigneeName || '未分配' }}</div>
              </div>
              <el-tag :type="getPriorityType(task.priority)" size="small">
                {{ formatPriority(task.priority) }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="section-title mb-16">订单状态分布</div>
          <div class="order-stats">
            <el-row :gutter="12">
              <el-col :span="8" v-for="(count, status) in stats.orderStats" :key="status">
                <div class="order-stat-item">
                  <div class="order-stat-count">{{ count }}</div>
                  <div class="order-stat-label">{{ formatOrderStatus(status) }}</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDashboardStats, getAnomalies } from '@/api/dashboard'

const router = useRouter()

const stats = ref({})
const anomalies = ref({})

const fetchData = async () => {
  try {
    const [statsData, anomaliesData] = await Promise.all([
      getDashboardStats(),
      getAnomalies()
    ])
    stats.value = statsData
    anomalies.value = anomaliesData
  } catch (e) {
    // error handled
  }
}

const formatNumber = (num) => {
  return Number(num).toLocaleString()
}

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const formatOrderStatus = (status) => {
  const map = {
    pending_payment: '待支付',
    pending_confirmation: '待确认',
    confirmed: '已确认',
    in_progress: '进行中',
    completed: '已完成',
    refund_pending: '退款中',
    refunded: '已退款',
    cancelled: '已取消'
  }
  return map[status] || status
}

const formatCleaningType = (type) => {
  const map = { daily: '日常清洁', deep: '深度清洁', emergency: '紧急清洁' }
  return map[type] || type
}

const formatPriority = (priority) => {
  const map = { low: '低', medium: '中', high: '高' }
  return map[priority] || priority
}

const getPriorityType = (priority) => {
  const map = { low: 'info', medium: 'warning', high: 'danger' }
  return map[priority] || 'info'
}

const goToOrders = () => router.push('/orders')
const goToOrderDetail = (id) => router.push(`/orders/${id}`)
const goToInventory = () => router.push('/inventory')
const goToInventoryDetail = (id) => router.push(`/inventory/${id}`)
const goToCleaning = () => router.push('/cleaning-tasks')
const goToCleaningTasks = () => router.push('/cleaning-tasks')

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.order-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.pending-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.schedule-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.revenue-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.stat-sub {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

.stat-sub.pending {
  color: #e6a23c;
}

.anomaly-list {
  max-height: 260px;
  overflow-y: auto;
}

.anomaly-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
  transition: background 0.2s;
}

.anomaly-item:last-child {
  border-bottom: none;
}

.anomaly-item:hover {
  background: #f5f7fa;
  margin: 0 -12px;
  padding: 12px;
  border-radius: 6px;
}

.anomaly-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #fff;
  margin-right: 12px;
  flex-shrink: 0;
}

.anomaly-icon.pending {
  background: #e6a23c;
}

.anomaly-icon.warning {
  background: #f56c6c;
}

.anomaly-icon.cleaning {
  background: #67c23a;
}

.anomaly-info {
  flex: 1;
  min-width: 0;
}

.anomaly-title {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.anomaly-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.anomaly-time {
  font-size: 12px;
  color: #c0c4cc;
  flex-shrink: 0;
}

.anomaly-badge {
  background: #fef0f0;
  color: #f56c6c;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  flex-shrink: 0;
}

.empty-text {
  text-align: center;
  color: #c0c4cc;
  padding: 40px 0;
  font-size: 14px;
}

.order-stats {
  padding: 8px 0;
}

.order-stat-item {
  text-align: center;
  padding: 16px 0;
  background: #f5f7fa;
  border-radius: 8px;
}

.order-stat-count {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.order-stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
