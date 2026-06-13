<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">单店利润报表</h2>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.storeId" placeholder="选择门店" style="width: 200px">
        <el-option v-for="store in storeList" :key="store.id" :label="store.name" :value="store.id" />
      </el-select>
      <el-date-picker
        v-model="filters.startDate"
        type="date"
        placeholder="开始日期"
        value-format="YYYY-MM-DD"
      />
      <el-date-picker
        v-model="filters.endDate"
        type="date"
        placeholder="结束日期"
        value-format="YYYY-MM-DD"
      />
      <el-button type="primary" @click="loadReport">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">总营业额</div>
          <div class="value positive">¥{{ formatNumber(report.summary?.totalSales) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">总成本</div>
          <div class="value" style="color: #e6a23c">¥{{ formatNumber(report.summary?.totalCost) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">总利润</div>
          <div class="value" :class="{ 'positive': (report.summary?.totalProfit || 0) >= 0, 'negative': (report.summary?.totalProfit || 0) < 0 }">
            ¥{{ formatNumber(report.summary?.totalProfit) }}
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">净收益</div>
          <div class="value" :class="{ 'positive': (report.summary?.netProfit || 0) >= 0, 'negative': (report.summary?.netProfit || 0) < 0 }">
            ¥{{ formatNumber(report.summary?.netProfit) }}
          </div>
          <div class="sub-info">利润 - 报损</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">总订单数</div>
          <div class="value">{{ formatNumber(report.summary?.totalOrders, 0) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">客单价</div>
          <div class="value">¥{{ formatNumber(report.summary?.avgOrderValue) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">报损总额</div>
          <div class="value negative">¥{{ formatNumber(report.summary?.totalLoss) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">优惠总额</div>
          <div class="value" style="color: #e6a23c">¥{{ formatNumber(report.summary?.totalDiscount) }}</div>
        </div>
      </el-col>
    </el-row>

    <el-card style="margin-bottom: 20px">
      <template #header>
        <span>营业趋势图</span>
      </template>
      <div ref="chartRef" style="height: 350px"></div>
    </el-card>

    <el-card>
      <template #header>
        <span>每日明细</span>
      </template>
      <el-table :data="report.daily || []" stripe size="small">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="salesAmount" label="营业额" width="120">
          <template #default="{ row }">¥{{ formatNumber(row.salesAmount) }}</template>
        </el-table-column>
        <el-table-column prop="costAmount" label="成本" width="100">
          <template #default="{ row }">¥{{ formatNumber(row.costAmount) }}</template>
        </el-table-column>
        <el-table-column prop="profitAmount" label="利润" width="100">
          <template #default="{ row }">
            <span :class="{ 'text-success': (row.profitAmount || 0) >= 0, 'text-danger': (row.profitAmount || 0) < 0 }">
              ¥{{ formatNumber(row.profitAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="discountAmount" label="优惠" width="100">
          <template #default="{ row }">¥{{ formatNumber(row.discountAmount) }}</template>
        </el-table-column>
        <el-table-column prop="orderCount" label="订单数" width="90" />
        <el-table-column prop="lossAmount" label="报损" width="100">
          <template #default="{ row }">
            <span class="text-danger">¥{{ formatNumber(row.lossAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="exceptionCount" label="异常数" width="90" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import api from '@/utils/api'
import dayjs from 'dayjs'

const chartRef = ref(null)
const storeList = ref([])
const report = ref({ summary: {}, daily: [] })

const filters = reactive({
  storeId: null,
  startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD')
})

const formatNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '0.00'
  return Number(num).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

const loadStores = async () => {
  try {
    const res = await api.get('/stores', { params: { limit: 100 } })
    storeList.value = res.data || []
    if (storeList.value.length > 0 && !filters.storeId) {
      filters.storeId = storeList.value[0].id
    }
  } catch (e) {}
}

const loadReport = async () => {
  if (!filters.storeId) return
  try {
    const res = await api.get('/reports/profit-report', {
      params: {
        store_id: filters.storeId,
        start_date: filters.startDate,
        end_date: filters.endDate
      }
    })
    report.value = res
    await nextTick()
    initChart()
  } catch (e) {}
}

let chartInstance = null

const initChart = () => {
  if (!chartRef.value) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)

  const daily = report.value.daily || []
  const dates = daily.map(d => d.date).reverse()
  const sales = daily.map(d => d.salesAmount || 0).reverse()
  const profits = daily.map(d => d.profitAmount || 0).reverse()
  const costs = daily.map(d => d.costAmount || 0).reverse()

  chartInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['营业额', '成本', '利润'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '营业额',
        type: 'line',
        smooth: true,
        data: sales,
        itemStyle: { color: '#409eff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      },
      {
        name: '成本',
        type: 'line',
        smooth: true,
        data: costs,
        itemStyle: { color: '#e6a23c' }
      },
      {
        name: '利润',
        type: 'line',
        smooth: true,
        data: profits,
        itemStyle: { color: '#67c23a' }
      }
    ]
  })
}

const resetFilters = () => {
  filters.startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
  filters.endDate = dayjs().format('YYYY-MM-DD')
  loadReport()
}

onMounted(async () => {
  await loadStores()
  await loadReport()

  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})
</script>

<style scoped>
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
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-card .value.positive {
  color: #67c23a;
}

.stat-card .value.negative {
  color: #f56c6c;
}

.stat-card .sub-info {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}
</style>
