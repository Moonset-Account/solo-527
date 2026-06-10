<template>
  <div class="dashboard-page">
    <el-row :gutter="16" class="stats-cards-row">
      <el-col :xs="24" :sm="12" :lg="6" v-for="stat in statsCards" :key="stat.key">
        <el-card
          class="stats-card"
          shadow="hover"
          :class="stat.cardClass"
          @click="toggleDrilldown(stat.key)"
        >
          <div class="stats-card-inner">
            <div class="stats-icon" :style="{ background: stat.bgGradient }">
              <el-icon :size="26"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-label">{{ stat.label }}</div>
              <div class="stats-value">
                <span class="value-prefix" v-if="stat.prefix">{{ stat.prefix }}</span>
                <span class="value-num">{{ formatNumber(stat.value) }}</span>
                <span class="value-suffix" v-if="stat.suffix">{{ stat.suffix }}</span>
              </div>
              <div class="stats-sub" :class="stat.trendClass">
                <el-icon><component :is="stat.trend > 0 ? ArrowUp : ArrowDown" /></el-icon>
                <span>{{ Math.abs(stat.trend) }}% 较昨日</span>
              </div>
            </div>
          </div>
          <div v-if="drilldownType === stat.key" class="drilldown-section">
            <div class="drilldown-header">
              <span class="drilldown-title">汇总数据</span>
            </div>
            <div class="drilldown-summary">
              <div v-for="item in getDrilldownSummary(stat.key)" :key="item.label" class="summary-item">
                <div class="summary-label">{{ item.label }}</div>
                <div class="summary-value">{{ item.value }}</div>
              </div>
            </div>
            <div class="drilldown-header" style="margin-top:12px">
              <span class="drilldown-title">单据明细</span>
              <el-button type="primary" link size="small" @click.stop="exportData(stat.key)">
                导出
              </el-button>
            </div>
            <el-table :data="getDrilldownDetails(stat.key)" size="small" class="drilldown-table">
              <el-table-column prop="orderNo" label="订单号" min-width="160" />
              <el-table-column prop="userName" label="用户" min-width="100" />
              <el-table-column prop="courseTitle" label="课程" min-width="140" />
              <el-table-column prop="amount" label="金额" width="100">
                <template #default="{ row }">
                  ¥{{ Number(row.amount || 0).toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column prop="payTime" label="支付时间" width="160" />
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-alert
      v-if="disputeOrders.length > 0"
      class="dispute-alert"
      type="error"
      :closable="false"
      show-icon
    >
      <template #title>
        <div class="dispute-alert-title">
          <span>佣金争议提醒</span>
          <el-badge :value="disputeOrders.length" class="dispute-badge" />
        </div>
      </template>
      <div class="dispute-alert-content">
        <div
          v-for="order in disputeOrders"
          :key="order.orderNo"
          class="dispute-item"
          @click="goToOrderDetail(order)"
        >
          <span class="dispute-order-no">{{ order.orderNo }}</span>
          <span class="dispute-user">{{ order.userName }}</span>
          <span class="dispute-amount">¥{{ order.amount.toFixed(2) }}</span>
          <el-tag type="danger" size="small">待处理</el-tag>
          <el-icon class="dispute-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </el-alert>

    <el-row :gutter="16" class="charts-row">
      <el-col :span="24">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">
                <el-icon><DataLine /></el-icon>
                补完课率统计（按课程）
              </span>
              <div class="header-actions">
                <el-radio-group v-model="chartPeriod" size="small" @change="renderChart">
                  <el-radio-button label="week">本周</el-radio-button>
                  <el-radio-button label="month">本月</el-radio-button>
                  <el-radio-button label="quarter">本季度</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div ref="chartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User,
  ChatLineRound,
  Document,
  Wallet,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  DataLine
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  getDashboardOverview,
  getDrilldown,
  getCourseCompletionRates,
  getDisputeOrderList
} from '@/api/stats'

const router = useRouter()

const chartRef = ref(null)
let chartInstance = null
const chartPeriod = ref('month')

const drilldownType = ref('')

const drilldownSummary = reactive({
  students: [],
  courses: [],
  orders: [],
  revenue: []
})
const drilldownDetails = reactive({
  students: [],
  courses: [],
  orders: [],
  revenue: []
})

const statsCards = reactive([
  {
    key: 'students',
    label: '总学员',
    value: 0,
    trend: 12.5,
    prefix: '',
    suffix: '人',
    icon: User,
    bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cardClass: 'card-purple',
    trendClass: 'trend-up'
  },
  {
    key: 'courses',
    label: '总课程',
    value: 0,
    trend: 5.2,
    prefix: '',
    suffix: '门',
    icon: ChatLineRound,
    bgGradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    cardClass: 'card-green',
    trendClass: 'trend-up'
  },
  {
    key: 'orders',
    label: '今日订单',
    value: 0,
    trend: -3.1,
    prefix: '',
    suffix: '单',
    icon: Document,
    bgGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    cardClass: 'card-pink',
    trendClass: 'trend-down'
  },
  {
    key: 'revenue',
    label: '本月收入',
    value: 0,
    trend: 18.7,
    prefix: '¥',
    suffix: '',
    icon: Wallet,
    bgGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    cardClass: 'card-orange',
    trendClass: 'trend-up'
  }
])

const disputeOrders = ref([])

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toLocaleString()
}

const toggleDrilldown = (key) => {
  drilldownType.value = drilldownType.value === key ? '' : key
  if (drilldownType.value === key) {
    loadDrilldownData(key)
  }
}

const loadDrilldownData = async (key) => {
  try {
    const dimensionMap = {
      students: 'user',
      courses: 'course',
      orders: 'day',
      revenue: 'day'
    }
    const res = await getDrilldown({ dimension: dimensionMap[key] || 'day' })
    const data = res.data || {}
    const stats = data.stats || []
    const details = data.orderDetails || []

    const totalCount = stats.reduce((sum, s) => sum + (s.orderCount || 0), 0)
    const totalAmount = stats.reduce((sum, s) => sum + Number(s.revenue || 0), 0)
    const totalCommission = stats.reduce((sum, s) => sum + Number(s.commission || 0), 0)
    const totalUsers = stats.reduce((sum, s) => sum + (s.userCount || 0), 0)

    drilldownSummary[key] = [
      { label: '分组数', value: stats.length },
      { label: '订单数', value: totalCount },
      { label: '总金额', value: '¥' + totalAmount.toFixed(2) },
      { label: '佣金', value: '¥' + totalCommission.toFixed(2) }
    ]
    if (key === 'students') {
      drilldownSummary[key] = [
        { label: '学员数', value: stats.length },
        { label: '订单数', value: totalCount },
        { label: '总金额', value: '¥' + totalAmount.toFixed(2) }
      ]
    }
    if (key === 'courses') {
      drilldownSummary[key] = [
        { label: '课程数', value: stats.length },
        { label: '订单数', value: totalCount },
        { label: '总金额', value: '¥' + totalAmount.toFixed(2) }
      ]
    }

    drilldownDetails[key] = details.map(d => {
      const order = d.order || {}
      const user = d.user || {}
      const course = d.course || {}
      return {
        orderNo: order.orderNo || '--',
        userName: user.nickname || user.username || '--',
        courseTitle: course.title || '--',
        amount: Number(order.payAmount || order.amount || 0),
        payTime: order.payTime || '--'
      }
    })
  } catch (e) {
    drilldownSummary[key] = []
    drilldownDetails[key] = []
  }
}

const getDrilldownSummary = (key) => drilldownSummary[key] || []
const getDrilldownDetails = (key) => drilldownDetails[key] || []

const exportData = (key) => {
  ElMessage.success(`正在导出${statsCards.find(s => s.key === key)?.label}数据`)
}

const goToOrderDetail = (order) => {
  router.push({ path: '/admin/orders', query: { orderNo: order.orderNo } })
}

const loadDashboardData = async () => {
  try {
    const res = await getDashboardOverview()
    const data = res.data || {}
    statsCards[0].value = data.totalUsers || 0
    statsCards[1].value = data.totalCourses || 0
    statsCards[2].value = data.todayOrders || 0
    statsCards[3].value = Number(data.todayRevenue || data.totalRevenue || 0)
  } catch (e) {
    statsCards[0].value = 0
    statsCards[1].value = 0
    statsCards[2].value = 0
    statsCards[3].value = 0
  }
}

const loadDisputeOrders = async () => {
  try {
    const res = await getDisputeOrderList({ page: 1, size: 5 })
    const list = res.data?.list || res.data?.records || []
    disputeOrders.value = list.map(o => {
      const order = o.order || o
      return {
        orderNo: order.orderNo || '--',
        userName: o.user?.nickname || o.buyerNickname || order.userName || '--',
        amount: Number(order.payAmount || order.amount || 0)
      }
    })
  } catch (e) {
    disputeOrders.value = []
  }
}

const renderChart = async () => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  let courseNames = []
  let rates = []

  try {
    const res = await getCourseCompletionRates({ dimension: 'course' })
    const data = res.data || {}
    const list = data.courseStats || []
    if (list.length > 0) {
      courseNames = list.map(d => d.courseTitle || '--')
      rates = list.map(d => parseFloat(d.progress) || parseFloat(d.completionRate) || 0)
    }
  } catch (e) {
  }

  if (courseNames.length === 0) {
    courseNames = []
    rates = []
  }

  const colors = rates.map(rate => {
    if (rate >= 70) return '#67c23a'
    if (rate >= 50) return '#409eff'
    if (rate >= 30) return '#e6a23c'
    return '#f56c6c'
  })

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const p = params[0]
        return `${p.name}<br/>完成率：<strong style="color:${p.color}">${p.value}%</strong>`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '12%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: courseNames,
      axisLabel: {
        rotate: 20,
        fontSize: 12,
        color: '#606266',
        interval: 0
      },
      axisLine: { lineStyle: { color: '#ebeef5' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        color: '#909399',
        fontSize: 12
      },
      splitLine: { lineStyle: { color: '#f5f7fa', type: 'dashed' } }
    },
    series: [
      {
        name: '完成率',
        type: 'bar',
        data: rates.map((v, i) => ({
          value: v,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: colors[i] },
              { offset: 1, color: colors[i] + '80' }
            ]),
            borderRadius: [6, 6, 0, 0]
          }
        })),
        barWidth: '42%',
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          color: '#606266',
          fontSize: 12,
          fontWeight: 500
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

const handleResize = () => {
  chartInstance?.resize()
}

onMounted(async () => {
  loadDashboardData()
  loadDisputeOrders()
  await nextTick()
  renderChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-cards-row {
  margin-bottom: 0;
}

.stats-card {
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.25s;
  overflow: visible;
  position: relative;
}

.stats-card:hover {
  transform: translateY(-3px);
}

.stats-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 12px 12px 0 0;
}

.card-purple::before { background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); }
.card-green::before { background: linear-gradient(90deg, #11998e 0%, #38ef7d 100%); }
.card-pink::before { background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%); }
.card-orange::before { background: linear-gradient(90deg, #fa709a 0%, #fee140 100%); }

.stats-card-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stats-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stats-info {
  flex: 1;
  min-width: 0;
}

.stats-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.stats-value {
  display: flex;
  align-items: baseline;
  margin-bottom: 4px;
}

.value-prefix,
.value-suffix {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.value-num {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
  line-height: 1.1;
}

.stats-sub {
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.drilldown-section {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed #ebeef5;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.drilldown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.drilldown-title {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.drilldown-table {
  border-radius: 8px;
  overflow: hidden;
}

.drilldown-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.summary-item {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 8px 10px;
  text-align: center;
}

.summary-label {
  font-size: 11px;
  color: #909399;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.dispute-alert {
  border-radius: 12px;
  border: none;
  padding: 16px 20px;
}

.dispute-alert :deep(.el-alert__content) {
  width: 100%;
}

.dispute-alert-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}

.dispute-badge {
  margin-left: 0;
}

.dispute-alert-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dispute-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 14px;
  background: rgba(245, 108, 108, 0.08);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 13px;
}

.dispute-item:hover {
  background: rgba(245, 108, 108, 0.14);
}

.dispute-order-no {
  font-family: 'SF Mono', Monaco, monospace;
  color: #f56c6c;
  font-weight: 500;
  min-width: 150px;
}

.dispute-user {
  color: #606266;
  min-width: 80px;
}

.dispute-amount {
  font-weight: 600;
  color: #303133;
  min-width: 90px;
}

.dispute-arrow {
  margin-left: auto;
  color: #f56c6c;
}

.charts-row {
  margin-bottom: 0;
}

.chart-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title .el-icon {
  color: #409eff;
}

.chart-container {
  width: 100%;
  height: 380px;
}
</style>
