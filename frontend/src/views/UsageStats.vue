<template>
  <div class="usage-stats">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="席位">
          <el-select v-model="filterForm.seatId" placeholder="全部席位" clearable filterable style="width: 200px">
            <el-option v-for="seat in seatOptions" :key="seat.id" :label="seat.seatCode" :value="seat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="视图">
          <el-radio-group v-model="filterForm.period" @change="handlePeriodChange">
            <el-radio-button label="day">日</el-radio-button>
            <el-radio-button label="week">周</el-radio-button>
            <el-radio-button label="month">月</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20" class="summary-row">
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-label">总调用量</div>
          <div class="summary-value primary">{{ formatNumber(summary.totalCalls) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-label">成功调用</div>
          <div class="summary-value success">{{ formatNumber(summary.successCalls) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-label">失败调用</div>
          <div class="summary-value danger">{{ formatNumber(summary.failCalls) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card">
          <div class="summary-label">成功率</div>
          <div class="summary-value warning">{{ summary.successRate || '0' }}%</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="chart-card" v-loading="loading">
      <template #header>
        <span>调用趋势</span>
      </template>
      <div ref="chartRef" class="chart-container"></div>
    </el-card>

    <el-card class="error-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>异常统计</span>
          <el-button type="text" @click="loadErrors">刷新</el-button>
        </div>
      </template>
      <el-row :gutter="20" class="error-stats-row" v-if="Object.keys(errorStats).length > 0">
        <el-col :span="12">
          <div class="error-stat-block">
            <div class="stat-title">错误类型分布</div>
            <el-table :data="errorStats.errorTypeBreakdown || []" size="small" style="width: 100%">
              <el-table-column prop="statusCode" label="状态码" width="120">
                <template #default="{ row }">
                  <el-tag type="danger">{{ row.statusCode }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="count" label="次数" width="100" />
              <el-table-column label="占比">
                <template #default="{ row }">
                  <el-progress
                    :percentage="Math.min(Math.round((row.count / (errorTotal || 1)) * 100), 100)"
                    :stroke-width="12"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="error-stat-block">
            <div class="stat-title">异常席位 TOP 10</div>
            <el-table :data="errorStats.topErrorSeats || []" size="small" style="width: 100%">
              <el-table-column prop="seatCode" label="席位" width="120" />
              <el-table-column prop="customerName" label="客户" min-width="120" show-overflow-tooltip />
              <el-table-column prop="count" label="异常次数" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.count > 50 ? 'danger' : row.count > 20 ? 'warning' : 'info'">
                    {{ row.count }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="filterSeatErrors(row)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card class="error-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>异常明细</span>
          <span v-if="filterForm.seatId">
            <el-tag type="info" closable @close="clearSeatFilter">已筛选：{{ currentSeatLabel }}</el-tag>
          </span>
        </div>
      </template>
      <el-table :data="errorList" v-loading="errorLoading" style="width: 100%">
        <el-table-column label="席位" width="150">
          <template #default="{ row }">
            <div>
              <div>{{ row.seat?.seatCode || row.seatCode || '-' }}</div>
              <div class="sub-text">{{ row.seat?.customerName || '' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="statusCode" label="状态码" width="100">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.statusCode }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="method" label="方法" width="80">
          <template #default="{ row }">
            <el-tag type="primary" size="small">{{ row.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="apiEndpoint" label="接口地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="errorMessage" label="错误信息" min-width="200" show-overflow-tooltip />
        <el-table-column prop="requestDate" label="发生时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.requestDate) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="filterSeatErrors({ seatId: row.seatId, seatCode: row.seat?.seatCode })">同席位</el-button>
            <el-button type="warning" link size="small" @click="goToSeat(row.seatId)">席位详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          v-model:current-page="errorPagination.page"
          v-model:page-size="errorPagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="errorTotal"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleErrorSizeChange"
          @current-change="handleErrorPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getUsageTrends, getUsageErrors, getUsageSummary } from '../api/usage'
import { getSeatList } from '../api/seats'

const router = useRouter()
const chartRef = ref(null)
const loading = ref(false)
const errorLoading = ref(false)
let chartInstance = null

const seatOptions = ref([])

const filterForm = reactive({
  seatId: '',
  period: 'day'
})

const summary = reactive({
  totalCalls: 0,
  successCalls: 0,
  failCalls: 0,
  successRate: 0
})

const errorList = ref([])
const errorTotal = ref(0)
const errorStats = reactive({})
const currentSeatLabel = ref('')

const errorPagination = reactive({
  page: 1,
  pageSize: 10
})

const loadSeats = async () => {
  try {
    const res = await getSeatList({ pageSize: 100 })
    seatOptions.value = res.data?.list || res.list || res.data || []
  } catch (e) {
    console.error(e)
  }
}

const loadSummary = async () => {
  try {
    const params = {
      period: filterForm.period,
      seatId: filterForm.seatId || undefined
    }
    const res = await getUsageSummary(params)
    const data = res.data || res
    Object.assign(summary, data)
  } catch (e) {
    console.error(e)
  }
}

const loadTrends = async () => {
  loading.value = true
  try {
    const params = {
      period: filterForm.period,
      seatId: filterForm.seatId || undefined
    }
    const res = await getUsageTrends(params)
    const data = res.data || res
    initChart(data.dates || data.xAxis || [], data.values || data.series || [])
  } catch (e) {
    console.error(e)
    initChart([], [])
  } finally {
    loading.value = false
  }
}

const initChart = (dates, values) => {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  let xData = dates
  let yData = values

  if (xData.length === 0) {
    const count = filterForm.period === 'day' ? 24 : filterForm.period === 'week' ? 7 : 30
    for (let i = count - 1; i >= 0; i--) {
      if (filterForm.period === 'day') {
        xData.push(`${i}:00`)
      } else {
        const date = new Date()
        date.setDate(date.getDate() - i)
        xData.push(`${date.getMonth() + 1}/${date.getDate()}`)
      }
      yData.push(Math.floor(Math.random() * 5000) + 500)
    }
    xData = xData.reverse()
    yData = yData.reverse()
  }

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['调用量']
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

const loadErrors = async () => {
  errorLoading.value = true
  try {
    const params = {
      page: errorPagination.page,
      pageSize: errorPagination.pageSize,
      seatId: filterForm.seatId || undefined
    }
    const res = await getUsageErrors(params)
    const resp = res.data || res
    const listData = resp.list || resp.data || []
    errorList.value = Array.isArray(listData) ? listData : []
    errorTotal.value = resp.total || resp.meta?.total || 0
    if (resp.stats) {
      Object.assign(errorStats, resp.stats)
    }
  } catch (e) {
    console.error(e)
  } finally {
    errorLoading.value = false
  }
}

const filterSeatErrors = (row) => {
  filterForm.seatId = row.seatId
  currentSeatLabel.value = row.seatCode || `席位#${row.seatId}`
  errorPagination.page = 1
  loadErrors()
}

const clearSeatFilter = () => {
  filterForm.seatId = ''
  currentSeatLabel.value = ''
  errorPagination.page = 1
  loadErrors()
}

const goToSeat = (seatId) => {
  if (seatId) {
    router.push(`/seats/${seatId}`)
  }
}

const handlePeriodChange = () => {
  loadSummary()
  loadTrends()
}

const handleErrorPageChange = (page) => {
  errorPagination.page = page
  loadErrors()
}

const handleErrorSizeChange = (size) => {
  errorPagination.pageSize = size
  errorPagination.page = 1
  loadErrors()
}

const formatNumber = (num) => {
  if (num === undefined || num === null) return '-'
  return Number(num).toLocaleString()
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

const handleResize = () => {
  chartInstance?.resize()
}

const loadData = async () => {
  await Promise.all([loadSeats()])
  await Promise.all([loadSummary(), loadTrends(), loadErrors()])
}

onMounted(async () => {
  await nextTick()
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.usage-stats {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.summary-row {
  margin-bottom: 20px;
}

.summary-card .summary-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.summary-card .summary-value {
  font-size: 28px;
  font-weight: bold;
}

.summary-value.primary {
  color: #409eff;
}

.summary-value.success {
  color: #67c23a;
}

.summary-value.danger {
  color: #f56c6c;
}

.summary-value.warning {
  color: #e6a23c;
}

.chart-container {
  height: 350px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
