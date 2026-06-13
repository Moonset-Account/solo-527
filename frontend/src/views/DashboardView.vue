<template>
  <div class="dashboard">
    <div class="page-header">
      <h2 class="page-title">今日概览</h2>
      <div class="date-range">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </div>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">今日营业额</div>
          <div class="value positive">¥{{ stats.todaySales?.toFixed(2) || '0.00' }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">今日订单数</div>
          <div class="value">{{ stats.todayOrders || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">待处理异常</div>
          <div class="value negative">{{ stats.pendingExceptions || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">待整改项</div>
          <div class="value negative">{{ stats.pendingRectifications || 0 }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <span>近7日营业趋势</span>
          </template>
          <div ref="salesChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>异常类型分布</span>
          </template>
          <div ref="exceptionChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近异常记录</span>
            <el-button type="primary" link @click="$router.push('/operations/exceptions')">查看全部</el-button>
          </template>
          <el-table :data="recentExceptions" size="small">
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ typeMap[row.type] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="statusTypeMap[row.status]">{{ statusMap[row.status] }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最近整改任务</span>
            <el-button type="primary" link @click="$router.push('/rectifications')">查看全部</el-button>
          </template>
          <el-table :data="recentRectifications" size="small">
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="level" label="级别" width="90">
              <template #default="{ row }">
                <el-tag size="small" :type="levelTypeMap[row.level]">{{ levelMap[row.level] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deadline" label="截止日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.deadline) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import api from '@/utils/api'
import dayjs from 'dayjs'

const salesChartRef = ref(null)
const exceptionChartRef = ref(null)
const dateRange = ref([
  dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD')
])

const stats = ref({})
const recentExceptions = ref([])
const recentRectifications = ref([])

const typeMap = {
  loss: '报损',
  damage: '损坏',
  complaint: '投诉',
  equipment: '设备',
  other: '其他'
}

const statusMap = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭'
}

const statusTypeMap = {
  pending: 'warning',
  processing: 'primary',
  resolved: 'success',
  closed: 'info'
}

const levelMap = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急'
}

const levelTypeMap = {
  low: 'info',
  medium: 'warning',
  high: 'danger',
  critical: 'danger'
}

const formatDate = (date) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

const loadStats = async () => {
  try {
    const reportRes = await api.get('/reports/profit-report', {
      params: {
        start_date: dayjs().format('YYYY-MM-DD'),
        end_date: dayjs().format('YYYY-MM-DD')
      }
    })
    stats.value.todaySales = reportRes.summary?.totalSales || 0
    stats.value.todayOrders = reportRes.summary?.totalOrders || 0
  } catch (e) {}

  try {
    const expRes = await api.get('/operations/exceptions', {
      params: { status: 'pending', limit: 5, page: 1 }
    })
    recentExceptions.value = expRes.data || []
    stats.value.pendingExceptions = expRes.meta?.total || 0
  } catch (e) {}

  try {
    const rectRes = await api.get('/rectifications', {
      params: { status: 'pending', limit: 5, page: 1 }
    })
    recentRectifications.value = rectRes.data || []
    stats.value.pendingRectifications = rectRes.meta?.total || 0
  } catch (e) {}
}

const initCharts = async () => {
  await nextTick()

  let salesChart = null
  let exceptionChart = null

  if (salesChartRef.value) {
    salesChart = echarts.init(salesChartRef.value)
    salesChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['营业额', '利润'] },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: '营业额',
          type: 'line',
          smooth: true,
          data: [7200, 6800, 7500, 7100, 8200, 9500, 9200],
          itemStyle: { color: '#409eff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ])
          }
        },
        {
          name: '利润',
          type: 'line',
          smooth: true,
          data: [4680, 4420, 4875, 4615, 5330, 6175, 5980],
          itemStyle: { color: '#67c23a' }
        }
      ]
    })
  }

  if (exceptionChartRef.value) {
    exceptionChart = echarts.init(exceptionChartRef.value)
    exceptionChart.setOption({
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          data: [
            { value: 35, name: '食材报损' },
            { value: 20, name: '设备损坏' },
            { value: 15, name: '顾客投诉' },
            { value: 10, name: '操作损耗' },
            { value: 20, name: '其他' }
          ],
          label: {
            show: true,
            formatter: '{b}\n{d}%'
          }
        }
      ]
    })
  }
}

onMounted(() => {
  loadStats()
  initCharts()

  window.addEventListener('resize', () => {
    // 简单处理，实际项目中应保存 chart 实例
  })
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
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
}

.stat-card .label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-card .value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-card .value.positive {
  color: #67c23a;
}

.stat-card .value.negative {
  color: #f56c6c;
}

.chart-card {
  height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}
</style>
