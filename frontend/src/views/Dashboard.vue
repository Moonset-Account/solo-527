<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="item in statsCards" :key="item.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value" :style="{ color: item.color }">
              <el-skeleton :loading="loading" animated>
                <template #default>{{ item.value }}</template>
              </el-skeleton>
            </div>
          </div>
          <div class="stat-icon" :style="{ background: item.bgColor }">
            <el-icon :size="32" :color="item.color"><component :is="item.icon" /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="12">
        <el-card class="todo-card">
          <template #header>
            <div class="card-header">
              <span>我的续费跟进</span>
              <el-button type="text" @click="goToRenewal">查看全部</el-button>
            </div>
          </template>
          <el-table :data="todos.renewals" v-loading="loading" style="width: 100%">
            <el-table-column prop="customerName" label="客户名称" />
            <el-table-column prop="planName" label="套餐" />
            <el-table-column prop="expiryDate" label="到期日" />
            <el-table-column prop="priority" label="优先级">
              <template #default="{ row }">
                <el-tag :type="row.priority === 'high' ? 'danger' : row.priority === 'medium' ? 'warning' : 'info'">
                  {{ row.priority === 'high' ? '高' : row.priority === 'medium' ? '中' : '低' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="todo-card">
          <template #header>
            <div class="card-header">
              <span>即将到期的席位</span>
              <el-button type="text" @click="goToSeats">查看全部</el-button>
            </div>
          </template>
          <el-table :data="todos.expiringSeats" v-loading="loading" style="width: 100%">
            <el-table-column prop="seatCode" label="席位编码" />
            <el-table-column prop="customerName" label="客户名称" />
            <el-table-column prop="expireDays" label="剩余天数">
              <template #default="{ row }">
                <span :style="{ color: row.expireDays <= 7 ? '#f56c6c' : '#67c23a' }">{{ row.expireDays }}天</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <span>调用趋势</span>
          </template>
          <div ref="chartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="activity-card">
          <template #header>
            <span>最近操作记录</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in activities"
              :key="index"
              :timestamp="activity.time"
              :type="activity.type"
            >
              <div class="activity-item">
                <div class="activity-user">{{ activity.user }}</div>
                <div class="activity-action">{{ activity.action }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <div v-if="!loading && activities.length === 0" class="empty-text">暂无记录</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getDashboardStats as getStats, getDashboardTodos as getTodos, getRecentActivity } from '../api/dashboard'
import { getUsageTrends } from '../api/usage'

const router = useRouter()
const chartRef = ref(null)
const loading = ref(false)
let chartInstance = null

const statsCards = reactive([
  { label: '席位总数', value: 0, icon: 'User', color: '#409eff', bgColor: '#ecf5ff' },
  { label: '今日调用量', value: 0, icon: 'DataAnalysis', color: '#67c23a', bgColor: '#f0f9eb' },
  { label: '待处理续费', value: 0, icon: 'Bell', color: '#e6a23c', bgColor: '#fdf6ec' },
  { label: '闲置席位', value: 0, icon: 'UserFilled', color: '#f56c6c', bgColor: '#fef0f0' }
])

const todos = reactive({
  renewals: [],
  expiringSeats: []
})

const activities = ref([])

const loadStats = async () => {
  try {
    const res = await getStats()
    const data = res.data || res
    statsCards[0].value = data.totalSeats || 0
    statsCards[1].value = data.todayCalls || 0
    statsCards[2].value = data.pendingRenewals || 0
    statsCards[3].value = data.idleSeats || 0
  } catch (e) {
    console.error(e)
  }
}

const loadTodos = async () => {
  try {
    const res = await getTodos()
    const data = res.data || res
    todos.renewals = data.myRenewals || []
    todos.expiringSeats = data.upcomingFollowUps?.map((item) => ({
      seatCode: item.seat?.seatCode || '-',
      customerName: item.customerName,
      expireDays: Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
    })) || []
  } catch (e) {
    console.error(e)
  }
}

const loadActivities = async () => {
  try {
    const res = await getRecentActivity()
    const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : [])
    activities.value = list.map(item => ({
      time: item.createdAt,
      user: item.userName,
      action: item.action,
      type: 'primary'
    }))
  } catch (e) {
    console.error(e)
  }
}

const initChart = async () => {
  await nextTick()
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  
  const xData = []
  const yData = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    xData.push(`${date.getMonth() + 1}/${date.getDate()}`)
    yData.push(Math.floor(Math.random() * 10000) + 1000)
  }

  try {
    const res = await getUsageTrends({ period: 'week' })
    const data = res.data || res
    if (data.dates && data.values) {
      xData.length = 0
      yData.length = 0
      xData.push(...data.dates)
      yData.push(...data.values)
    }
  } catch (e) {
    console.error(e)
  }

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xData
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '调用量',
        type: 'line',
        smooth: true,
        data: yData,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        },
        lineStyle: {
          color: '#409eff',
          width: 2
        },
        itemStyle: {
          color: '#409eff'
        }
      }
    ]
  }
  chartInstance.setOption(option)
}

const handleResize = () => {
  chartInstance?.resize()
}

const goToRenewal = () => {
  router.push('/renewal')
}

const goToSeats = () => {
  router.push('/seats')
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([loadStats(), loadTodos(), loadActivities(), initChart()])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
}

.stat-content {
  padding: 10px 0;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
}

.stat-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
}

.activity-item {
  padding: 5px 0;
}

.activity-user {
  font-weight: 500;
  color: #303133;
}

.activity-action {
  font-size: 13px;
  color: #606266;
  margin-top: 5px;
}

.empty-text {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}
</style>
