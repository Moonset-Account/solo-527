<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h2>仪表盘</h2>
      <p class="subtitle">数据概览，掌握全局</p>
    </div>

    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card card-today">
            <div class="stat-icon">
              <el-icon :size="32"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.todayOrders }}</h3>
              <p class="stat-label">今日订单</p>
            </div>
            <div class="stat-trend up">
              <el-icon><Top /></el-icon>
              12%
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card card-pending">
            <div class="stat-icon">
              <el-icon :size="32"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.pendingOrders }}</h3>
              <p class="stat-label">待处理订单</p>
            </div>
            <div class="stat-trend down">
              <el-icon><Bottom /></el-icon>
              5%
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card card-completed">
            <div class="stat-icon">
              <el-icon :size="32"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">{{ stats.completedOrders }}</h3>
              <p class="stat-label">已完成订单</p>
            </div>
            <div class="stat-trend up">
              <el-icon><Top /></el-icon>
              8%
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card card-revenue">
            <div class="stat-icon">
              <el-icon :size="32"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <h3 class="stat-value">¥{{ stats.todayRevenue }}</h3>
              <p class="stat-label">今日营收</p>
            </div>
            <div class="stat-trend up">
              <el-icon><Top /></el-icon>
              15%
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="20" class="chart-section">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>订单趋势</span>
              <el-radio-group v-model="chartPeriod" size="small" @change="handlePeriodChange">
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
                <el-radio-button label="year">全年</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="chartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>设备类型分布</span>
          </template>
          <div ref="pieChartRef" class="chart-container pie-chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="bottom-section">
      <el-col :span="12">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span>最新订单</span>
              <el-button type="primary" link @click="goToOrders">查看全部</el-button>
            </div>
          </template>
          <div class="recent-orders">
            <div v-for="order in recentOrders" :key="order.id" class="recent-order-item">
              <div class="order-info">
                <span class="order-no">{{ order.orderNo }}</span>
                <span class="order-device">{{ order.deviceType }}</span>
              </div>
              <OrderStatusBadge :status="order.status" />
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span>师傅排行</span>
              <el-button type="primary" link @click="goToTechnicians">查看全部</el-button>
            </div>
          </template>
          <div class="technician-rank">
            <div v-for="(tech, index) in topTechnicians" :key="tech.id" class="tech-rank-item">
              <span class="rank-number" :class="`rank-${index + 1}`">{{ index + 1 }}</span>
              <el-avatar :size="40">{{ tech.name.charAt(0) }}</el-avatar>
              <div class="tech-info">
                <span class="tech-name">{{ tech.name }}</span>
                <span class="tech-orders">{{ tech.orderCount }} 单</span>
              </div>
              <el-rate v-model="tech.rating" disabled size="small" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  Document, Clock, CircleCheck, Money, Top, Bottom
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import OrderStatusBadge from '@/components/OrderStatusBadge.vue'
import { useAppStore } from '@/stores/app'
import type { Order } from '@/api/order'
import type { Technician } from '@/api/technician'

const router = useRouter()
const appStore = useAppStore()

const chartRef = ref<HTMLElement>()
const pieChartRef = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null
let pieChartInstance: echarts.ECharts | null = null

const chartPeriod = ref('week')

const stats = ref({
  todayOrders: 28,
  pendingOrders: 15,
  completedOrders: 156,
  todayRevenue: '4,580'
})

const recentOrders = ref<Order[]>([])
const topTechnicians = ref<Technician[]>([])

const isDemo = computed(() => appStore.isDemoMode)

function handlePeriodChange() {
  initChart()
}

function initChart() {
  if (!chartRef.value) return
  
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const xData = chartPeriod.value === 'week' 
    ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    : chartPeriod.value === 'month'
      ? ['1日', '5日', '10日', '15日', '20日', '25日', '30日']
      : ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  const orderData = chartPeriod.value === 'week'
    ? [20, 25, 18, 30, 28, 35, 22]
    : chartPeriod.value === 'month'
      ? [120, 150, 135, 180, 165, 200, 175]
      : [800, 950, 1100, 1050, 1200, 1350, 1500, 1450, 1600, 1550, 1700, 1800]

  const revenueData = orderData.map(v => v * 150)

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['订单数', '营收']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xData
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数'
      },
      {
        type: 'value',
        name: '营收(元)'
      }
    ],
    series: [
      {
        name: '订单数',
        type: 'bar',
        data: orderData,
        itemStyle: {
          color: '#409eff'
        }
      },
      {
        name: '营收',
        type: 'line',
        yAxisIndex: 1,
        data: revenueData,
        smooth: true,
        itemStyle: {
          color: '#67c23a'
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

function initPieChart() {
  if (!pieChartRef.value) return
  
  if (!pieChartInstance) {
    pieChartInstance = echarts.init(pieChartRef.value)
  }

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: '设备类型',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: 1048, name: '空调' },
          { value: 735, name: '冰箱' },
          { value: 580, name: '洗衣机' },
          { value: 484, name: '热水器' },
          { value: 300, name: '其他' }
        ]
      }
    ]
  }

  pieChartInstance.setOption(option)
}

function generateDemoData() {
  recentOrders.value = [
    { id: 1, orderNo: '202401150001', deviceType: '空调', status: 'pending' } as Order,
    { id: 2, orderNo: '202401150002', deviceType: '冰箱', status: 'assigned' } as Order,
    { id: 3, orderNo: '202401150003', deviceType: '洗衣机', status: 'in_progress' } as Order,
    { id: 4, orderNo: '202401150004', deviceType: '热水器', status: 'completed' } as Order,
    { id: 5, orderNo: '202401150005', deviceType: '空调', status: 'confirmed' } as Order
  ]

  topTechnicians.value = [
    { id: 1, name: '李师傅', orderCount: 128, rating: 4.9 } as Technician,
    { id: 2, name: '王师傅', orderCount: 115, rating: 4.8 } as Technician,
    { id: 3, name: '张师傅', orderCount: 102, rating: 4.7 } as Technician,
    { id: 4, name: '刘师傅', orderCount: 95, rating: 4.6 } as Technician,
    { id: 5, name: '陈师傅', orderCount: 88, rating: 4.5 } as Technician
  ]
}

function goToOrders() {
  router.push('/admin/orders')
}

function goToTechnicians() {
  router.push('/admin/technicians')
}

function handleResize() {
  chartInstance?.resize()
  pieChartInstance?.resize()
}

onMounted(() => {
  generateDemoData()
  nextTick(() => {
    initChart()
    initPieChart()
  })
  window.addEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.dashboard-page {
  .page-header {
    margin-bottom: 20px;

    h2 {
      margin: 0 0 4px 0;
      font-size: 24px;
      color: #303133;
    }

    .subtitle {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }
  }

  .stats-cards {
    margin-bottom: 20px;
  }

  .stat-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    align-items: center;
    position: relative;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }

    &.card-today .stat-icon {
      background: #ecf5ff;
      color: #409eff;
    }

    &.card-pending .stat-icon {
      background: #fdf6ec;
      color: #e6a23c;
    }

    &.card-completed .stat-icon {
      background: #f0f9eb;
      color: #67c23a;
    }

    &.card-revenue .stat-icon {
      background: #fef0f0;
      color: #f56c6c;
    }

    .stat-info {
      flex: 1;

      .stat-value {
        margin: 0 0 4px 0;
        font-size: 28px;
        font-weight: 700;
        color: #303133;
      }

      .stat-label {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }
    }

    .stat-trend {
      position: absolute;
      top: 16px;
      right: 16px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 2px;

      &.up {
        color: #67c23a;
      }

      &.down {
        color: #f56c6c;
      }
    }
  }

  .chart-section {
    margin-bottom: 20px;

    .chart-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .chart-container {
        height: 320px;
      }

      .pie-chart {
        height: 320px;
      }
    }
  }

  .bottom-section {
    .list-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }

    .recent-orders {
      .recent-order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f5f7fa;

        &:last-child {
          border-bottom: none;
        }

        .order-info {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .order-no {
            font-size: 14px;
            color: #303133;
          }

          .order-device {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }

    .technician-rank {
      .tech-rank-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #f5f7fa;

        &:last-child {
          border-bottom: none;
        }

        .rank-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          background: #f5f7fa;
          color: #909399;

          &.rank-1 {
            background: #fef0f0;
            color: #f56c6c;
          }

          &.rank-2 {
            background: #fdf6ec;
            color: #e6a23c;
          }

          &.rank-3 {
            background: #ecf5ff;
            color: #409eff;
          }
        }

        .tech-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;

          .tech-name {
            font-size: 14px;
            color: #303133;
          }

          .tech-orders {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
}
</style>
