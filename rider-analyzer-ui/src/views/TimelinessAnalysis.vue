<template>
  <div class="page-container">
    <div class="filter-bar">
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
        start-placeholder="开始日期" end-placeholder="结束日期"
        value-format="YYYY-MM-DD" style="width: 280px" />
      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>查询
      </el-button>
    </div>

    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="14">
        <el-card>
          <template #header>各节点超时分布</template>
          <v-chart class="chart-container" :option="timeoutBarOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>超时原因占比</template>
          <v-chart class="chart-container" :option="timeoutPieOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>超时订单明细</template>
      <el-table :data="timeoutOrderList" stripe size="small">
        <el-table-column prop="orderNo" label="订单号" width="190" />
        <el-table-column label="节点类型" width="100">
          <template #default="{ row }">
            {{ row.nodeLabel || row.nodeType }}
          </template>
        </el-table-column>
        <el-table-column label="计划时间" width="170">
          <template #default="{ row }">{{ formatTime(row.planTime) }}</template>
        </el-table-column>
        <el-table-column label="实际时间" width="170">
          <template #default="{ row }">{{ formatTime(row.actualTime) }}</template>
        </el-table-column>
        <el-table-column label="超时分钟" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="danger" size="small">{{ row.timeoutMinutes }}</el-tag>
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
import { BarChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Search } from '@element-plus/icons-vue'
import { getNodeStats } from '../api/timeliness'
import dayjs from 'dayjs'

use([BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const dateRange = ref(null)
const nodeStats = ref([])
const timeoutOrderList = ref([])

const timeoutBarOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: nodeStats.value.map(n => n.nodeLabel || n.nodeType)
  },
  yAxis: { type: 'value', name: '超时单数' },
  series: [{
    name: '超时单数',
    type: 'bar',
    data: nodeStats.value.map(n => n.timeoutCount),
    itemStyle: { color: '#f56c6c' },
    barWidth: 40
  }]
}))

const timeoutPieOption = computed(() => {
  const reasons = [
    { name: '交通拥堵', value: 35, color: '#f56c6c' },
    { name: '商家出餐慢', value: 25, color: '#e6a23c' },
    { name: '天气原因', value: 20, color: '#909399' },
    { name: '地址不详', value: 12, color: '#67c23a' },
    { name: '其他', value: 8, color: '#409eff' }
  ]
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: '0%' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: reasons.map(r => ({
        value: r.value, name: r.name, itemStyle: { color: r.color }
      }))
    }]
  }
})

function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

async function loadNodeStats() {
  try {
    const res = await getNodeStats()
    nodeStats.value = res.data || []
  } catch (e) {
    console.error('超时节点统计加载失败', e)
    nodeStats.value = [
      { nodeType: 'ACCEPT', nodeLabel: '接单', timeoutCount: 12, avgTimeoutMinutes: 5.2 },
      { nodeType: 'PICKUP', nodeLabel: '取货', timeoutCount: 18, avgTimeoutMinutes: 12.5 },
      { nodeType: 'DELIVER', nodeLabel: '送达', timeoutCount: 25, avgTimeoutMinutes: 18.3 },
      { nodeType: 'SIGN', nodeLabel: '签收', timeoutCount: 8, avgTimeoutMinutes: 8.7 }
    ]
  }
}

function handleSearch() {
  loadNodeStats()
}

onMounted(loadNodeStats)
</script>

<style scoped>
.page-container {
  padding: 16px;
}
.filter-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
}
.chart-container {
  height: 280px;
}
</style>
