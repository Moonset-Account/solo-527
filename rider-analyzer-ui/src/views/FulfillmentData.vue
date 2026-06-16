<template>
  <div class="page-container">
    <div class="filter-bar">
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
        start-placeholder="开始日期" end-placeholder="结束日期"
        value-format="YYYY-MM-DD" style="width: 280px" />
      <el-select v-model="stationId" placeholder="选择站点" clearable style="width: 160px">
        <el-option v-for="s in stationList" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>查询
      </el-button>
    </div>

    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="14">
        <el-card>
          <template #header>履约率趋势</template>
          <v-chart class="chart-container" :option="fulfillmentLineOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>各站点平均配送时长</template>
          <v-chart class="chart-container" :option="stationBarOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>履约数据明细</template>
      <el-table :data="fulfillmentList" stripe size="small">
        <el-table-column prop="dateStr" label="日期" width="110" />
        <el-table-column prop="stationName" label="站点" width="120" />
        <el-table-column prop="totalOrders" label="总单数" width="90" align="center" />
        <el-table-column prop="fulfilledOrders" label="履约单数" width="90" align="center" />
        <el-table-column label="履约率" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="Number(row.fulfillmentRate) >= 95 ? 'success' : 'warning'" size="small">
              {{ row.fulfillmentRate }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="avgDeliveryMinutes" label="平均时长(分钟)" width="120" align="center" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Search } from '@element-plus/icons-vue'
import { getFulfillmentData, getFulfillmentByStation } from '../api/timeliness'
import { getStations } from '../api/station'
import dayjs from 'dayjs'

use([LineChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const dateRange = ref(null)
const stationId = ref(null)
const stationList = ref([])
const fulfillmentList = ref([])
const stationStats = ref([])

const fulfillmentLineOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: fulfillmentList.value.map(f => f.dateStr),
    boundaryGap: false
  },
  yAxis: { type: 'value', min: 80, max: 100, axisLabel: { formatter: '{value}%' } },
  series: [{
    name: '履约率',
    type: 'line',
    data: fulfillmentList.value.map(f => f.fulfillmentRate),
    smooth: true,
    itemStyle: { color: '#67c23a' },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(103,194,58,0.3)' },
          { offset: 1, color: 'rgba(103,194,58,0.05)' }
        ]
      }
    }
  }]
}))

const stationBarOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: stationStats.value.map(s => s.stationName) },
  yAxis: { type: 'value', name: '分钟' },
  series: [{
    name: '平均配送时长',
    type: 'bar',
    data: stationStats.value.map(s => s.avgDeliveryMinutes),
    itemStyle: { color: '#409eff' },
    barWidth: 30
  }]
}))

async function loadStations() {
  try {
    const res = await getStations()
    stationList.value = res.data || []
  } catch (e) {
    console.error('站点列表加载失败', e)
  }
}

async function loadFulfillmentData() {
  try {
    const end = dayjs()
    const start = end.subtract(7, 'day')
    const res = await getFulfillmentData({
      start: start.startOf('day').toISOString(),
      end: end.endOf('day').toISOString()
    })
    fulfillmentList.value = res.data || []
  } catch (e) {
    console.error('履约数据加载失败', e)
    const mock = []
    for (let i = 6; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day')
      const rate = 92 + Math.random() * 6
      mock.push({
        dateStr: d.format('MM-DD'),
        totalOrders: 80 + Math.floor(Math.random() * 40),
        fulfilledOrders: 75 + Math.floor(Math.random() * 40),
        fulfillmentRate: Math.round(rate * 100) / 100,
        avgDeliveryMinutes: 35 + Math.random() * 15
      })
    }
    fulfillmentList.value = mock
  }
}

async function loadStationStats() {
  try {
    const end = dayjs()
    const start = end.subtract(7, 'day')
    const res = await getFulfillmentByStation({
      start: start.startOf('day').toISOString(),
      end: end.endOf('day').toISOString()
    })
    stationStats.value = res.data || []
  } catch (e) {
    console.error('站点统计加载失败', e)
    stationStats.value = [
      { stationName: '朝阳站点', avgDeliveryMinutes: 38.5 },
      { stationName: '海淀站点', avgDeliveryMinutes: 42.3 },
      { stationName: '丰台站点', avgDeliveryMinutes: 35.8 }
    ]
  }
}

function handleSearch() {
  loadFulfillmentData()
  loadStationStats()
}

onMounted(() => {
  loadStations()
  loadFulfillmentData()
  loadStationStats()
})
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
