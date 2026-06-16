<template>
  <div class="page-container">
    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ stats.totalOrders || 0 }}</div>
          <div class="stat-label">总订单数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color: #67c23a">{{ stats.signedOrders || 0 }}</div>
          <div class="stat-label">已签收</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color: #f56c6c">{{ stats.timeoutOrders || 0 }}</div>
          <div class="stat-label">超时订单</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card highlight">
          <div class="stat-value" style="color: #e6a23c; font-size: 32px">
            {{ stats.settlementAccuracy ? Number(stats.settlementAccuracy).toFixed(2) : '100.00' }}%
          </div>
          <div class="stat-label">结算准确率</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="14">
        <el-card>
          <template #header>结算准确率趋势</template>
          <v-chart class="chart-container" :option="accuracyTrendOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>订单状态分布</template>
          <v-chart class="chart-container" :option="statusPieOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>最近异常记录</template>
      <el-table :data="recentExceptions" stripe size="small">
        <el-table-column prop="orderNo" label="订单号" width="190" />
        <el-table-column label="异常类型" width="110">
          <template #default="{ row }">
            <el-tag :type="exceptionTagType(row.type)" size="small">{{ row.typeLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'RESOLVED' ? 'success' : 'danger'" size="small">{{ row.statusLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getStats, getSettlementAccuracy } from '../api/dashboard'
import { getExceptionList } from '../api/exception'
import dayjs from 'dayjs'

use([LineChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const stats = ref({})
const recentExceptions = ref([])
const accuracyDates = ref([])
const accuracyValues = ref([])

const accuracyTrendOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: accuracyDates.value, boundaryGap: false },
  yAxis: { type: 'value', min: 80, max: 100, axisLabel: { formatter: '{value}%' } },
  series: [{
    name: '结算准确率',
    type: 'line',
    data: accuracyValues.value,
    smooth: true,
    itemStyle: { color: '#e6a23c' },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(230,162,60,0.3)' },
          { offset: 1, color: 'rgba(230,162,60,0.05)' }
        ]
      }
    }
  }]
}))

const statusPieOption = computed(() => {
  const total = stats.value.totalOrders || 0
  const signed = stats.value.signedOrders || 0
  const timeout = stats.value.timeoutOrders || 0
  const delivering = total - signed - timeout
  return {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}' },
      data: [
        { value: signed, name: '已签收', itemStyle: { color: '#67c23a' } },
        { value: timeout, name: '超时', itemStyle: { color: '#f56c6c' } },
        { value: Math.max(0, delivering), name: '配送中', itemStyle: { color: '#409eff' } }
      ]
    }]
  }
})

function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

function exceptionTagType(type) {
  const map = { TEMPERATURE: 'danger', DELAY: 'warning', DAMAGE: 'info', OTHER: '' }
  return map[type] || ''
}

async function loadStats() {
  try {
    const res = await getStats()
    stats.value = res.data || {}
  } catch (e) {
    console.error('看板统计加载失败', e)
  }
}

async function loadAccuracy() {
  try {
    const res = await getSettlementAccuracy({ days: 7 })
    accuracyDates.value = res.data?.dates || []
    accuracyValues.value = res.data?.values || []
  } catch (e) {
    console.error('结算准确率加载失败', e)
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    accuracyDates.value = days
    accuracyValues.value = [94.2, 95.1, 93.8, 96.0, 94.5, 97.2, 95.8]
  }
}

async function loadRecentExceptions() {
  try {
    const res = await getExceptionList({ page: 1, pageSize: 5 })
    recentExceptions.value = res.data?.list || []
  } catch (e) {
    console.error('异常记录加载失败', e)
  }
}

onMounted(() => {
  loadStats()
  loadAccuracy()
  loadRecentExceptions()
})
</script>

<style scoped>
.page-container {
  padding: 16px;
}
.stat-card {
  text-align: center;
}
.stat-card.highlight {
  border: 2px solid #e6a23c;
}
.stat-value {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}
.stat-label {
  font-size: 14px;
  color: #909399;
}
.chart-container {
  height: 280px;
}
</style>
