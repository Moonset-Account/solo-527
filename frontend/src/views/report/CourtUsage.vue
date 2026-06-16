<template>
  <div class="court-usage">
    <el-card>
      <div class="search-form">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="开始日期">
            <el-date-picker
              v-model="searchForm.startDate"
              type="date"
              placeholder="选择开始日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="结束日期">
            <el-date-picker
              v-model="searchForm.endDate"
              type="date"
              placeholder="选择结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="场地ID">
            <el-input v-model="searchForm.courtId" placeholder="请输入场地ID" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
            <el-button type="success" @click="handleGenerate">生成统计</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-row :gutter="20" class="stat-cards">
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-icon primary">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ totalBookedHours }}</div>
                <div class="stat-label">总预订时长(小时)</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-icon success">
                <el-icon><List /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ totalBookingCount }}</div>
                <div class="stat-label">总预订次数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-icon warning">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ totalRevenue }}</div>
                <div class="stat-label">总收入</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <div class="stat-card">
              <div class="stat-icon info">
                <el-icon><DataLine /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ avgUsageRate }}%</div>
                <div class="stat-label">平均使用率</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="chart-card">
        <template #header>
          <span>场地利用趋势</span>
        </template>
        <div ref="chartRef" class="chart-container"></div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts, List, Money, DataLine } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { getCourtUsageTrend, generateCourtUsageStats } from '@/api/report'

const chartRef = ref(null)
let chartInstance = null

const searchForm = reactive({
  startDate: getDefaultStartDate(),
  endDate: getDefaultEndDate(),
  courtId: ''
})

const chartData = ref([])

const totalBookedHours = computed(() => {
  return chartData.value.reduce((sum, item) => sum + (item.bookedHours || 0), 0).toFixed(1)
})

const totalBookingCount = computed(() => {
  return chartData.value.reduce((sum, item) => sum + (item.bookingCount || 0), 0)
})

const totalRevenue = computed(() => {
  return chartData.value.reduce((sum, item) => sum + (item.totalRevenue || 0), 0).toFixed(2)
})

const avgUsageRate = computed(() => {
  if (chartData.value.length === 0) return '0'
  const total = chartData.value.reduce((sum, item) => sum + (item.usageRate || 0), 0)
  return (total / chartData.value.length).toFixed(1)
})

function getDefaultStartDate() {
  const date = new Date()
  date.setDate(date.getDate() - 30)
  return formatDate(date)
}

function getDefaultEndDate() {
  const date = new Date()
  return formatDate(date)
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const initChart = () => {
  if (!chartRef.value) return
  chartInstance = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chartInstance) return

  const dates = chartData.value.map(item => item.statDate)
  const usageRates = chartData.value.map(item => item.usageRate)
  const bookedHours = chartData.value.map(item => item.bookedHours)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['使用率', '预订时长']
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
      data: dates
    },
    yAxis: [
      {
        type: 'value',
        name: '使用率(%)',
        position: 'left',
        axisLabel: {
          formatter: '{value}%'
        }
      },
      {
        type: 'value',
        name: '预订时长(小时)',
        position: 'right',
        axisLabel: {
          formatter: '{value}h'
        }
      }
    ],
    series: [
      {
        name: '使用率',
        type: 'line',
        yAxisIndex: 0,
        smooth: true,
        data: usageRates,
        itemStyle: {
          color: '#409eff'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      },
      {
        name: '预订时长',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: bookedHours,
        itemStyle: {
          color: '#67c23a'
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

const fetchData = async () => {
  try {
    const params = {
      startDate: searchForm.startDate,
      endDate: searchForm.endDate
    }
    if (searchForm.courtId) params.courtId = searchForm.courtId
    const res = await getCourtUsageTrend(params)
    chartData.value = res
    nextTick(() => {
      updateChart()
    })
  } catch (error) {
    console.error('获取场地利用趋势失败:', error)
  }
}

const handleSearch = () => {
  if (!searchForm.startDate || !searchForm.endDate) {
    ElMessage.warning('请选择开始和结束日期')
    return
  }
  fetchData()
}

const handleReset = () => {
  searchForm.startDate = getDefaultStartDate()
  searchForm.endDate = getDefaultEndDate()
  searchForm.courtId = ''
  fetchData()
}

const handleGenerate = async () => {
  if (!searchForm.endDate) {
    ElMessage.warning('请选择统计日期')
    return
  }
  try {
    await generateCourtUsageStats(searchForm.endDate)
    ElMessage.success('统计生成成功')
    fetchData()
  } catch (error) {
    console.error('生成统计失败:', error)
  }
}

const handleResize = () => {
  chartInstance && chartInstance.resize()
}

onMounted(() => {
  nextTick(() => {
    initChart()
    fetchData()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance && chartInstance.dispose()
})
</script>

<style scoped>
.court-usage {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  margin-right: 15px;
}

.stat-icon.primary {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-icon.success {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.warning {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.stat-icon.info {
  background: linear-gradient(135deg, #909399, #a6a9ad);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.chart-card {
  margin-top: 20px;
}

.chart-container {
  height: 400px;
  width: 100%;
}
</style>
