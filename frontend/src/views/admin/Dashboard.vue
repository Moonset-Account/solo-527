<template>
  <div class="dashboard-page">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card blue">
          <div class="stat-icon">
            <el-icon :size="32"><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">¥{{ summary.today_sales || 0 }}</div>
            <div class="stat-label">今日销售额</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card green">
          <div class="stat-icon">
            <el-icon :size="32"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ summary.today_orders || 0 }}</div>
            <div class="stat-label">今日订单数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card orange">
          <div class="stat-icon">
            <el-icon :size="32"><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ summary.total_members || 0 }}</div>
            <div class="stat-label">会员总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card purple">
          <div class="stat-icon">
            <el-icon :size="32"><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ summary.active_members || 0 }}</div>
            <div class="stat-label">活跃会员(30天)</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>销售趋势</span>
              <el-radio-group v-model="salesPeriod" size="small">
                <el-radio-button value="week">本周</el-radio-button>
                <el-radio-button value="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <v-chart class="chart" :option="salesChartOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>图书分类销售占比</span>
          </template>
          <v-chart class="chart" :option="categoryChartOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="data-row">
      <el-col :span="12">
        <el-card class="data-card">
          <template #header>
            <div class="card-header">
              <span>销量排行 TOP 10</span>
              <el-button type="primary" link size="small" @click="$router.push('/admin/sales')">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table :data="topBooks" size="small" stripe>
            <el-table-column type="index" label="排名" width="60" align="center">
              <template #default="{ $index }">
                <span :class="`rank-${$index + 1}`">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="book.title" label="书名" show-overflow-tooltip />
            <el-table-column prop="total_quantity" label="销量" width="80" align="center" />
            <el-table-column prop="total_amount" label="销售额" width="100" align="right">
              <template #default="{ row }">
                ¥{{ row.total_amount || 0 }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="data-card">
          <template #header>
            <div class="card-header">
              <span>待处理事项</span>
              <el-tag type="danger" size="small">{{ pendingTasks.length }}</el-tag>
            </div>
          </template>
          <div class="pending-list">
            <div class="pending-item" v-if="alerts.expired_reservations_count > 0">
              <el-icon color="#ff4d4f"><Warning /></el-icon>
              <div class="pending-content">
                <div class="pending-title">
                  过期预留单
                  <el-tag type="danger" size="small">{{ alerts.expired_reservations_count }}</el-tag>
                </div>
                <div class="pending-desc">有 {{ alerts.expired_reservations_count }} 个预留单已过期，请及时处理</div>
              </div>
              <el-button type="primary" size="small" link @click="$router.push('/admin/reservations')">
                去处理
              </el-button>
            </div>
            <div class="pending-item" v-if="alerts.low_stock_count > 0">
              <el-icon color="#faad14"><InfoFilled /></el-icon>
              <div class="pending-content">
                <div class="pending-title">
                  库存预警
                  <el-tag type="warning" size="small">{{ alerts.low_stock_count }}</el-tag>
                </div>
                <div class="pending-desc">有 {{ alerts.low_stock_count }} 本图书库存不足，需要补货</div>
              </div>
              <el-button type="primary" size="small" link @click="$router.push('/admin/books?low=1')">
                去查看
              </el-button>
            </div>
            <div class="pending-item" v-for="event in alerts.upcoming_events" :key="event.id">
              <el-icon color="#1890ff"><Calendar /></el-icon>
              <div class="pending-content">
                <div class="pending-title">
                  即将开始活动
                  <el-tag type="primary" size="small">{{ event.available_slots }}个名额</el-tag>
                </div>
                <div class="pending-desc">{{ event.title }}</div>
              </div>
              <el-button type="primary" size="small" link @click="$router.push(`/admin/events/${event.id}`)">
                查看
              </el-button>
            </div>
            <el-empty v-if="pendingTasks.length === 0" description="暂无待处理事项" :image-size="100" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Money, Document, User, TrendCharts, Warning, InfoFilled, Calendar } from '@element-plus/icons-vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, DatasetComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { api } from '@/utils/request'
import { formatDate } from '@/utils/device'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent
])

const summary = ref({})
const alerts = ref({ low_stock_count: 0, expired_reservations_count: 0, upcoming_events: [] })
const topBooks = ref([])
const salesPeriod = ref('week')
const salesData = ref([])

const pendingTasks = computed(() => {
  const tasks = []
  if (alerts.value.expired_reservations_count > 0) tasks.push({ type: 'expired_reservations' })
  if (alerts.value.low_stock_count > 0) tasks.push({ type: 'low_stock' })
  if (alerts.value.upcoming_events?.length > 0) tasks.push({ type: 'events' })
  return tasks
})

const salesChartOption = computed(() => {
  const dates = salesData.value.map(item => formatDate(item.date, 'MM-DD'))
  const amounts = salesData.value.map(item => item.total_amount || 0)
  
  return {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>销售额: ¥{c}'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}'
      }
    },
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        data: amounts,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.5)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
            ]
          }
        },
        lineStyle: {
          color: '#1890ff',
          width: 2
        },
        itemStyle: {
          color: '#1890ff'
        }
      }
    ]
  }
})

const categoryChartOption = computed(() => {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
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
        labelLine: {
          show: false
        },
        data: [
          { value: 35, name: '文学' },
          { value: 25, name: '历史' },
          { value: 20, name: '科学' },
          { value: 15, name: '商业' },
          { value: 5, name: '其他' }
        ]
      }
    ]
  }
})

const loadSummary = async () => {
  try {
    const { data } = await api.get('/sales/dashboard/summary/')
    summary.value = data
  } catch (e) {}
}

const loadAlerts = async () => {
  try {
    const { data } = await api.get('/sales/dashboard/alerts/')
    alerts.value = data
  } catch (e) {}
}

const loadTopBooks = async () => {
  try {
    const { data } = await api.get('/sales/dashboard/top_books/')
    topBooks.value = data.slice(0, 10)
  } catch (e) {}
}

const loadSalesData = async () => {
  try {
    const days = salesPeriod.value === 'week' ? 7 : 30
    const { data } = await api.get('/sales/reports/', { params: { page_size: days } })
    salesData.value = data.results.reverse()
  } catch (e) {}
}

watch(salesPeriod, () => {
  loadSalesData()
})

onMounted(() => {
  loadSummary()
  loadAlerts()
  loadTopBooks()
  loadSalesData()
})
</script>

<style lang="scss" scoped>
.dashboard-page {
  .stats-row {
    margin-bottom: 20px;
    
    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      border-radius: 8px;
      color: #fff;
      
      &.blue {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      &.green {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      }
      &.orange {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
      &.purple {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
      
      .stat-icon {
        margin-right: 20px;
        opacity: 0.9;
      }
      
      .stat-content {
        .stat-value {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        .stat-label {
          font-size: 14px;
          opacity: 0.85;
        }
      }
    }
  }
  
  .charts-row {
    margin-bottom: 20px;
    
    .chart-card {
      .chart {
        height: 300px;
      }
    }
  }
  
  .data-row {
    .data-card {
      .pending-list {
        .pending-item {
          display: flex;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
          
          &:last-child {
            border-bottom: none;
          }
          
          .el-icon {
            font-size: 20px;
            margin-right: 12px;
            flex-shrink: 0;
          }
          
          .pending-content {
            flex: 1;
            
            .pending-title {
              font-weight: 500;
              margin-bottom: 4px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .pending-desc {
              font-size: 13px;
              color: #666;
            }
          }
        }
      }
    }
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  
  .rank-1 { color: #ff4d4f; font-weight: bold; }
  .rank-2 { color: #ff7a45; font-weight: bold; }
  .rank-3 { color: #ffa940; font-weight: bold; }
}
</style>
