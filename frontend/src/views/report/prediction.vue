<template>
  <div class="prediction-report">
    <el-row :gutter="16" class="kpi-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="card-content">
            <div class="card-icon blue"><el-icon :size="24"><DataLine /></el-icon></div>
            <div class="card-info">
              <div class="card-label">总线索数</div>
              <div class="card-value">{{ kpi.totalLeads }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="card-content">
            <div class="card-icon green"><el-icon :size="24"><CircleCheck /></el-icon></div>
            <div class="card-info">
              <div class="card-label">已成交数</div>
              <div class="card-value">{{ kpi.dealedLeads }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="card-content">
            <div class="card-icon orange"><el-icon :size="24"><TrendCharts /></el-icon></div>
            <div class="card-info">
              <div class="card-label">成交率</div>
              <div class="card-value">{{ formatPercent(kpi.dealRate) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="card-content">
            <div class="card-icon purple"><el-icon :size="24"><Wallet /></el-icon></div>
            <div class="card-info">
              <div class="card-label">预测本月成交金额</div>
              <div class="card-value">{{ formatAmountWithPrefix(kpi.predictedAmount) }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="charts-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="chart-title">跟进阶段分布</div>
          </template>
          <div ref="stageChartRef" class="chart-container" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-row :gutter="16">
          <el-col :span="24">
            <el-card shadow="hover">
              <template #header>
                <div class="chart-title">负责人成交对比</div>
              </template>
              <div ref="ownerChartRef" class="chart-container" />
            </el-card>
          </el-col>
          <el-col :span="24" style="margin-top: 16px">
            <el-card shadow="hover">
              <template #header>
                <div class="chart-title">来源分布</div>
              </template>
              <div ref="sourceChartRef" class="chart-container" />
            </el-card>
          </el-col>
        </el-row>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="chart-title">近6个月成交趋势</div>
          </template>
          <div ref="trendChartRef" class="chart-container" />
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="table-section">
      <template #header>
        <div class="chart-title">高意向线索列表</div>
      </template>
      <el-table :data="highIntentLeads" stripe>
        <el-table-column prop="leadNo" label="线索编号" width="160" />
        <el-table-column prop="customerName" label="客户" width="140" />
        <el-table-column prop="projectName" label="项目名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="source" label="来源" width="120" />
        <el-table-column prop="stage" label="当前阶段" width="120" />
        <el-table-column prop="ownerName" label="负责人" width="100" />
        <el-table-column prop="expectedDealDate" label="预测成交日期" width="140" />
        <el-table-column label="预测成交率" width="160">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round((row.dealProbability || 0) * 100)"
              :status="(row.dealProbability || 0) >= 0.8 ? 'success' : (row.dealProbability || 0) >= 0.6 ? '' : 'warning'"
            />
          </template>
        </el-table-column>
        <el-table-column prop="expectedAmount" label="预计成交金额" width="150" align="right">
          <template #default="{ row }">
            {{ formatAmountWithPrefix(row.expectedAmount) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { DataLine, CircleCheck, TrendCharts, Wallet } from '@element-plus/icons-vue'
import { getDealPrediction } from '@/api/report'
import { formatAmountWithPrefix, formatPercent } from '@/utils/format'

const stageChartRef = ref(null)
const ownerChartRef = ref(null)
const sourceChartRef = ref(null)
const trendChartRef = ref(null)

let stageChart = null
let ownerChart = null
let sourceChart = null
let trendChart = null

const kpi = reactive({
  totalLeads: 0,
  dealedLeads: 0,
  dealRate: 0,
  predictedAmount: 0
})

const highIntentLeads = ref([])
const chartData = reactive({
  stageData: [],
  ownerData: [],
  sourceData: [],
  trendMonths: [],
  trendAmounts: []
})

const initCharts = () => {
  if (stageChartRef.value) {
    stageChart = echarts.init(stageChartRef.value)
    const option = {
      tooltip: { trigger: 'item' },
      legend: { bottom: '5%', left: 'center' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' }
        },
        data: chartData.stageData
      }]
    }
    stageChart.setOption(option)
  }

  if (ownerChartRef.value) {
    ownerChart = echarts.init(ownerChartRef.value)
    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: chartData.ownerData.map(i => i.name),
        axisLabel: { interval: 0 }
      },
      yAxis: { type: 'value' },
      series: [{
        name: '成交金额',
        type: 'bar',
        barWidth: '40%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' }
          ])
        },
        data: chartData.ownerData.map(i => i.value)
      }]
    }
    ownerChart.setOption(option)
  }

  if (sourceChartRef.value) {
    sourceChart = echarts.init(sourceChartRef.value)
    const option = {
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' }
        },
        data: chartData.sourceData
      }]
    }
    sourceChart.setOption(option)
  }

  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    const option = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: chartData.trendMonths
      },
      yAxis: { type: 'value' },
      series: [{
        name: '成交金额',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, color: '#67c23a' },
        itemStyle: { color: '#67c23a' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103,194,58,0.3)' },
            { offset: 1, color: 'rgba(103,194,58,0.05)' }
          ])
        },
        data: chartData.trendAmounts
      }]
    }
    trendChart.setOption(option)
  }
}

const handleResize = () => {
  stageChart && stageChart.resize()
  ownerChart && ownerChart.resize()
  sourceChart && sourceChart.resize()
  trendChart && trendChart.resize()
}

const fetchData = async () => {
  try {
    const res = await getDealPrediction()
    if (res.data) {
      Object.assign(kpi, res.data.kpi || {})
      highIntentLeads.value = res.data.highIntentLeads || []
      Object.assign(chartData, res.data.charts || {})
      await nextTick()
      initCharts()
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  stageChart && stageChart.dispose()
  ownerChart && ownerChart.dispose()
  sourceChart && sourceChart.dispose()
  trendChart && trendChart.dispose()
})
</script>

<style lang="scss" scoped>
.prediction-report {
  .kpi-cards {
    margin-bottom: 16px;
  }

  .card-content {
    display: flex;
    align-items: center;
    gap: 16px;

    .card-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;

      &.blue {
        background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
      }

      &.green {
        background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
      }

      &.orange {
        background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
      }

      &.purple {
        background: linear-gradient(135deg, #a06cd5 0%, #c39bd3 100%);
      }
    }

    .card-info {
      flex: 1;

      .card-label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 6px;
      }

      .card-value {
        font-size: 22px;
        font-weight: 600;
        color: #303133;
      }
    }
  }

  .charts-row {
    margin-bottom: 16px;
  }

  .chart-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
  }

  .chart-container {
    height: 280px;
    width: 100%;
  }

  .table-section {
    margin-top: 16px;
  }
}
</style>
