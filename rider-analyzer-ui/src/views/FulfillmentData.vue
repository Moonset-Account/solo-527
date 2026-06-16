<template>
  <div class="page-container">
    <div class="filter-bar">
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 280px" />
      <el-select v-model="stationId" placeholder="选择站点" clearable style="width: 160px">
        <el-option v-for="s in stations" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
      <el-button type="primary" @click="loadData">
        <el-icon><Search /></el-icon>查询
      </el-button>
    </div>

    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>每日履约率趋势</template>
          <v-chart class="chart-container" :option="lineOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>各站点平均配送时长</template>
          <v-chart class="chart-container" :option="barOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>数据明细</template>
      <el-table :data="detailList" stripe size="small">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="stationName" label="站点" width="120" />
        <el-table-column prop="totalOrders" label="总单数" width="90" align="center" />
        <el-table-column prop="fulfilledOrders" label="履约单数" width="90" align="center" />
        <el-table-column prop="fulfillmentRate" label="履约率" width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.fulfillmentRate >= 90 ? '#67c23a' : row.fulfillmentRate >= 80 ? '#e6a23c' : '#f56c6c', fontWeight: 600 }">{{ row.fulfillmentRate }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="avgDuration" label="平均时长(分钟)" width="120" align="center" />
      </el-table>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadData"
        @size-change="loadData"
      />
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
import { getFulfillmentData } from '../api/timeliness'
import { getStations } from '../api/station'
import dayjs from 'dayjs'

use([LineChart, BarChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const dateRange = ref([dayjs().subtract(7, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')])
const stationId = ref('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const stations = ref([])

const lineData = ref({ dates: [], values: [] })
const barData = ref({ stations: [], values: [] })
const detailList = ref([])

const lineOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: lineData.value.dates, boundaryGap: false },
  yAxis: { type: 'value', min: 70, max: 100, axisLabel: { formatter: '{value}%' } },
  series: [{
    name: '履约率',
    type: 'line',
    data: lineData.value.values,
    smooth: true,
    itemStyle: { color: '#67c23a' },
    areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(103,194,58,0.3)' }, { offset: 1, color: 'rgba(103,194,58,0.05)' }] } },
    markLine: { data: [{ yAxis: 90, name: '目标线', lineStyle: { color: '#f56c6c', type: 'dashed' } }] }
  }]
}))

const barOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: barData.value.stations },
  yAxis: { type: 'value', name: '分钟' },
  series: [{
    type: 'bar',
    data: barData.value.values,
    itemStyle: {
      color: params => params.value > 60 ? '#f56c6c' : params.value > 45 ? '#e6a23c' : '#67c23a',
      borderRadius: [4, 4, 0, 0]
    },
    barWidth: '40%'
  }]
}))

async function loadFilters() {
  try {
    const res = await getStations()
    stations.value = res.data?.list || []
  } catch {
    stations.value = [
      { id: 1, name: '望京站' },
      { id: 2, name: '中关村站' },
      { id: 3, name: '国贸站' }
    ]
  }
}

async function loadData() {
  const params = {
    startDate: dateRange.value?.[0],
    endDate: dateRange.value?.[1],
    stationId: stationId.value,
    page: page.value,
    pageSize: pageSize.value
  }
  try {
    const res = await getFulfillmentData(params)
    const data = res.data
    lineData.value = { dates: data?.lineDates || [], values: data?.lineValues || [] }
    barData.value = { stations: data?.barStations || [], values: data?.barValues || [] }
    detailList.value = data?.list || []
    total.value = data?.total || 0
  } catch {
    lineData.value = {
      dates: ['06-10', '06-11', '06-12', '06-13', '06-14', '06-15', '06-16'],
      values: [88.5, 90.2, 87.3, 92.1, 91.5, 93.8, 89.6]
    }
    barData.value = {
      stations: ['望京站', '中关村站', '国贸站'],
      values: [42, 55, 38]
    }
    detailList.value = [
      { date: '2026-06-16', stationName: '望京站', totalOrders: 120, fulfilledOrders: 108, fulfillmentRate: 90.0, avgDuration: 42 },
      { date: '2026-06-16', stationName: '中关村站', totalOrders: 95, fulfilledOrders: 82, fulfillmentRate: 86.3, avgDuration: 55 },
      { date: '2026-06-16', stationName: '国贸站', totalOrders: 110, fulfilledOrders: 103, fulfillmentRate: 93.6, avgDuration: 38 },
      { date: '2026-06-15', stationName: '望京站', totalOrders: 115, fulfilledOrders: 106, fulfillmentRate: 92.2, avgDuration: 40 },
      { date: '2026-06-15', stationName: '中关村站', totalOrders: 88, fulfilledOrders: 78, fulfillmentRate: 88.6, avgDuration: 52 }
    ]
    total.value = 5
  }
}

onMounted(() => {
  loadFilters()
  loadData()
})
</script>
