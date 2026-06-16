<template>
  <div class="page-container">
    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ stats.totalOrders }}</div>
          <div class="stat-label">总订单数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color: #67c23a">{{ stats.signedOrders }}</div>
          <div class="stat-label">已签收</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color: #f56c6c">{{ stats.timeoutOrders }}</div>
          <div class="stat-label">超时订单</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color: #e6a23c; font-size: 32px">{{ stats.settlementAccuracy }}%</div>
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
        <el-table-column prop="orderNo" label="订单号" width="160" />
        <el-table-column prop="type" label="异常类型" width="120">
          <template #default="{ row }">
            <el-tag :type="exceptionTagType(row.type)" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已处理' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useDashboardStore } from '../stores/index'
import { getExceptionList } from '../api/exception'
import { getSettlementAccuracy } from '../api/dashboard'

use([LineChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const dashboardStore = useDashboardStore()
const stats = computed(() => dashboardStore.stats)
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
    areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(230,162,60,0.3)' }, { offset: 1, color: 'rgba(230,162,60,0.05)' }] } }
  }]
}))

const statusPieOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: '0%' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    label: { show: true, formatter: '{b}: {c}' },
    data: [
      { value: stats.value.signedOrders, name: '已签收', itemStyle: { color: '#67c23a' } },
      { value: stats.value.timeoutOrders, name: '超时', itemStyle: { color: '#f56c6c' } },
      { value: stats.value.totalOrders - stats.value.signedOrders - stats.value.timeoutOrders, name: '配送中', itemStyle: { color: '#409eff' } }
    ]
  }]
}))

function exceptionTagType(type) {
  const map = { '温度异常': 'danger', '超时': 'warning', '破损': 'info', '其他': '' }
  return map[type] || ''
}

async function loadData() {
  await dashboardStore.fetchStats()
  try {
    const res = await getSettlementAccuracy({ days: 7 })
    accuracyDates.value = res.data?.dates || []
    accuracyValues.value = res.data?.values || []
  } catch {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    accuracyDates.value = days
    accuracyValues.value = [94.2, 95.1, 93.8, 96.0, 94.5, 97.2, 95.8]
  }
  try {
    const res = await getExceptionList({ page: 1, pageSize: 5 })
    recentExceptions.value = res.data?.list || []
  } catch {
    recentExceptions.value = [
      { orderNo: 'ORD-20260615001', type: '温度异常', description: '冷链配送温度超标', status: '待处理', createdAt: '2026-06-15 14:30:00' },
      { orderNo: 'ORD-20260615002', type: '超时', description: '配送延迟30分钟', status: '已处理', createdAt: '2026-06-15 12:15:00' },
      { orderNo: 'ORD-20260614003', type: '破损', description: '商品外包装破损', status: '已处理', createdAt: '2026-06-14 16:45:00' }
    ]
  }
}

onMounted(loadData)
</script>
