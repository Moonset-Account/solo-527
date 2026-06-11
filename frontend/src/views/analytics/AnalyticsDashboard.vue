<template>
  <div class="analytics-dashboard">
    <el-card shadow="never" class="filter-card">
      <el-form :model="filterForm" :inline="true" label-width="90px">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item label="社区筛选">
          <el-select
            v-model="filterForm.communities"
            multiple
            collapse-tags
            collapse-tags-tooltip
            placeholder="全部社区"
            clearable
            filterable
            style="width: 260px"
          >
            <el-option v-for="c in communityOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleQuery">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20" class="stat-row">
      <el-col :xs="12" :sm="12" :lg="6">
        <div class="stat-card" style="border-top-color: #409EFF">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">订单总数</p>
              <p class="stat-value">{{ formatNumber(overallStats.totalOrders) }}</p>
              <p class="stat-trend" :class="overallStats.totalOrdersMom >= 0 ? 'up' : 'down'">
                <el-icon><CaretTop v-if="overallStats.totalOrdersMom >= 0" /><CaretBottom v-else /></el-icon>
                {{ Math.abs(overallStats.totalOrdersMom) }}% 环比
              </p>
            </div>
            <div class="stat-icon" style="background-color: #409EFF15; color: #409EFF">
              <el-icon :size="32"><ShoppingCart /></el-icon>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6">
        <div class="stat-card" style="border-top-color: #67C23A">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">准时率</p>
              <p class="stat-value">{{ formatPercent(overallStats.onTimeRate) }}</p>
              <p class="stat-trend" :class="overallStats.onTimeRateMom >= 0 ? 'up' : 'down'">
                <el-icon><CaretTop v-if="overallStats.onTimeRateMom >= 0" /><CaretBottom v-else /></el-icon>
                {{ Math.abs(overallStats.onTimeRateMom) }}% 环比
              </p>
            </div>
            <div class="stat-icon" style="background-color: #67C23A15; color: #67C23A">
              <el-icon :size="32"><CircleCheckFilled /></el-icon>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6">
        <div class="stat-card" style="border-top-color: #F56C6C">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">取消率</p>
              <p class="stat-value">{{ formatPercent(overallStats.cancelRate) }}</p>
              <p class="stat-trend" :class="overallStats.cancelRateMom <= 0 ? 'up' : 'down'">
                <el-icon><CaretTop v-if="overallStats.cancelRateMom <= 0" /><CaretBottom v-else /></el-icon>
                {{ Math.abs(overallStats.cancelRateMom) }}% 环比
              </p>
            </div>
            <div class="stat-icon" style="background-color: #F56C6C15; color: #F56C6C">
              <el-icon :size="32"><CircleCloseFilled /></el-icon>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6">
        <div class="stat-card" style="border-top-color: #E6A23C">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">平均评分</p>
              <p class="stat-value">{{ overallStats.avgRating.toFixed(1) }}</p>
              <p class="stat-trend" :class="overallStats.avgRatingMom >= 0 ? 'up' : 'down'">
                <el-icon><CaretTop v-if="overallStats.avgRatingMom >= 0" /><CaretBottom v-else /></el-icon>
                {{ Math.abs(overallStats.avgRatingMom) }}% 环比
              </p>
            </div>
            <div class="stat-icon" style="background-color: #E6A23C15; color: #E6A23C">
              <el-icon :size="32"><StarFilled /></el-icon>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="chart-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">履约准时率拆分</span>
          <el-radio-group v-model="dimension" size="small" @change="loadFulfillmentData">
            <el-radio-button label="community">按社区</el-radio-button>
            <el-radio-button label="date">按日期</el-radio-button>
            <el-radio-button label="reason">按供需原因</el-radio-button>
            <el-radio-button label="all">全部</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      <v-chart class="chart" :option="fulfillmentOption" autoresize />
      <el-table :data="fulfillmentTableData" stripe size="small" class="breakdown-table">
        <el-table-column prop="group" label="分组" min-width="140" />
        <el-table-column prop="totalOrders" label="总数" width="90" align="right" />
        <el-table-column prop="onTimeOrders" label="准时数" width="90" align="right" />
        <el-table-column prop="lateOrders" label="迟到数" width="90" align="right" />
        <el-table-column label="准时率%" width="100" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.onTimeRate >= 0.9 ? '#67C23A' : row.onTimeRate >= 0.7 ? '#E6A23C' : '#F56C6C' }">
              {{ formatPercent(row.onTimeRate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="三节点准时率拆分" min-width="240">
          <template #default="{ row }">
            <div class="three-node">
              <div class="node-item">
                <span class="node-label">预约</span>
                <div class="node-bar">
                  <div class="node-fill" :style="{ width: (row.scheduledOnTime / row.totalOrders * 100) + '%', background: '#409EFF' }"></div>
                </div>
                <span class="node-val">{{ formatPercent(row.scheduledOnTime / row.totalOrders) }}</span>
              </div>
              <div class="node-item">
                <span class="node-label">到场</span>
                <div class="node-bar">
                  <div class="node-fill" :style="{ width: (row.arrivedOnTime / row.totalOrders * 100) + '%', background: '#67C23A' }"></div>
                </div>
                <span class="node-val">{{ formatPercent(row.arrivedOnTime / row.totalOrders) }}</span>
              </div>
              <div class="node-item">
                <span class="node-label">完成</span>
                <div class="node-bar">
                  <div class="node-fill" :style="{ width: (row.completedOnTime / row.totalOrders * 100) + '%', background: '#E6A23C' }"></div>
                </div>
                <span class="node-val">{{ formatPercent(row.completedOnTime / row.totalOrders) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :lg="14">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="card-title">区域需求热力图</span>
          </template>
          <div class="heatmap-wrapper">
            <table class="heatmap-table">
              <thead>
                <tr>
                  <th class="heatmap-corner">社区 \ 分类</th>
                  <th v-for="cat in serviceCategories" :key="cat" class="heatmap-header">{{ cat }}</th>
                  <th class="heatmap-header gap-header">供需缺口</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="comm in communityOptions" :key="comm">
                  <td class="heatmap-row-header">{{ comm }}</td>
                  <td v-for="cat in serviceCategories" :key="cat" class="heatmap-cell" :style="getHeatmapCellStyle(comm, cat)">
                    {{ getHeatmapValue(comm, cat) || '-' }}
                  </td>
                  <td class="heatmap-cell gap-cell" :style="getGapCellStyle(comm)">
                    <span v-if="getGapValue(comm) !== null">
                      {{ getGapValue(comm)! > 0 ? '+' : '' }}{{ getGapValue(comm) }}
                    </span>
                    <span v-else>-</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="heatmap-legend">
              <div class="legend-item">
                <span class="legend-box low"></span>
                <span>低</span>
              </div>
              <div class="legend-item">
                <span class="legend-box mid"></span>
                <span>中</span>
              </div>
              <div class="legend-item">
                <span class="legend-box high"></span>
                <span>高</span>
              </div>
              <div class="legend-divider"></div>
              <div class="legend-item">
                <span class="legend-box shortage"></span>
                <span>不足</span>
              </div>
              <div class="legend-item">
                <span class="legend-box surplus"></span>
                <span>过剩</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span class="card-title">趋势分析</span>
          </template>
          <v-chart class="chart" :option="trendOption" autoresize />
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="chart-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">师傅绩效排行榜 Top 10</span>
          <div class="sort-tip">点击表头排序</div>
        </div>
      </template>
      <el-table :data="workerRankingData" stripe @sort-change="handleWorkerSort" :default-sort="{ prop: 'completedOrders', order: 'descending' }">
        <el-table-column prop="rank" label="排名" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.rank <= 3" :type="row.rank === 1 ? 'danger' : row.rank === 2 ? 'warning' : 'success'" effect="dark" size="small">
              {{ row.rank }}
            </el-tag>
            <span v-else>{{ row.rank }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="workerName" label="师傅姓名" min-width="120" />
        <el-table-column prop="completedOrders" label="完成单量" width="120" align="right" sortable="custom" />
        <el-table-column label="准时率" width="120" align="right" sortable="custom" prop="onTimeRate">
          <template #default="{ row }">
            <el-progress :percentage="Math.round(row.onTimeRate * 100)" :stroke-width="8" :color="row.onTimeRate >= 0.9 ? '#67C23A' : row.onTimeRate >= 0.7 ? '#E6A23C' : '#F56C6C'" />
          </template>
        </el-table-column>
        <el-table-column label="平均评分" width="140" align="center" sortable="custom" prop="avgRating">
          <template #default="{ row }">
            <el-rate v-model="row.avgRating" disabled :max="5" :size="14" />
            <span class="rating-text">{{ row.avgRating.toFixed(1) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="rescheduleCount" label="改单数" width="100" align="right" sortable="custom" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  ShoppingCart,
  CircleCheckFilled,
  CircleCloseFilled,
  StarFilled,
  CaretTop,
  CaretBottom
} from '@element-plus/icons-vue'
import {
  getOverallStats,
  getFulfillmentBreakdown,
  getHeatmapData,
  getTrendAnalysis,
  getWorkerRanking,
  type OverallStats,
  type FulfillmentBreakdownItem,
  type HeatmapItem,
  type TrendPoint,
  type WorkerRankItem,
  type QueryAnalyticsParams
} from '@/api/analytics'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const loading = ref(false)
const dimension = ref<'community' | 'date' | 'reason' | 'all'>('community')

const communityOptions = ref(['阳光花园', '中关村公寓', '万科城', '碧桂园', '恒大华府', '保利花园', '龙湖天街', '华润橡树湾'])
const serviceCategories = ['保洁服务', '家电服务', '维修服务', '上门安装', '管道疏通']

const filterForm = reactive({
  dateRange: [] as string[],
  communities: [] as string[]
})

const overallStats = ref<OverallStats>({
  totalOrders: 0,
  totalAmount: 0,
  avgOrderAmount: 0,
  onTimeRate: 0,
  avgRating: 0,
  activeWorkers: 0,
  newUsers: 0,
  cancelRate: 0,
  totalOrdersMom: 0,
  onTimeRateMom: 0,
  cancelRateMom: 0,
  avgRatingMom: 0
})

const fulfillmentData = ref<FulfillmentBreakdownItem[]>([])
const heatmapData = ref<HeatmapItem[]>([])
const trendData = ref<TrendPoint[]>([])
const workerRankingData = ref<WorkerRankItem[]>([])
const workerSortField = ref('completedOrders')
const workerSortOrder = ref<'ascending' | 'descending'>('descending')

const fulfillmentTableData = computed(() => fulfillmentData.value)

const fulfillmentOption = computed(() => {
  const data = fulfillmentData.value
  const groups = data.map(d => d.group)
  const totals = data.map(d => d.totalOrders)
  const lates = data.map(d => d.lateOrders)
  const onTimeRates = data.map(d => Number((d.onTimeRate * 100).toFixed(1)))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['订单总量', '迟到数量', '准时率%'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: groups,
      axisLabel: {
        rotate: groups.length > 6 ? 30 : 0,
        interval: 0
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '订单数',
        position: 'left',
        axisLabel: { formatter: '{value}' }
      },
      {
        type: 'value',
        name: '准时率%',
        position: 'right',
        min: 0,
        max: 100,
        axisLabel: { formatter: '{value}%' }
      }
    ],
    series: [
      {
        name: '订单总量',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#409EFF', borderRadius: [0, 0, 0, 0] },
        data: totals.map((t, i) => t - lates[i])
      },
      {
        name: '迟到数量',
        type: 'bar',
        stack: 'total',
        itemStyle: { color: '#F56C6C' },
        data: lates
      },
      {
        name: '准时率%',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        itemStyle: { color: '#67C23A' },
        lineStyle: { width: 3 },
        symbol: 'circle',
        symbolSize: 8,
        data: onTimeRates
      }
    ]
  }
})

const trendOption = computed(() => {
  const data = trendData.value
  const dates = data.map(d => d.date)
  const counts = data.map(d => d.orderCount)
  const rates = data.map(d => Number((d.onTimeRate * 100).toFixed(1)))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['订单量', '准时率%'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        rotate: dates.length > 10 ? 30 : 0
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '订单量',
        position: 'left'
      },
      {
        type: 'value',
        name: '准时率%',
        position: 'right',
        min: 0,
        max: 100,
        axisLabel: { formatter: '{value}%' }
      }
    ],
    series: [
      {
        name: '订单量',
        type: 'bar',
        itemStyle: {
          color: '#409EFF',
          borderRadius: [4, 4, 0, 0]
        },
        data: counts
      },
      {
        name: '准时率%',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        itemStyle: { color: '#67C23A' },
        lineStyle: { width: 3 },
        areaStyle: {
          opacity: 0.15,
          color: '#67C23A'
        },
        symbol: 'circle',
        symbolSize: 6,
        data: rates
      }
    ]
  }
})

function formatNumber(n: number) {
  return n.toLocaleString()
}

function formatPercent(n: number) {
  return (n * 100).toFixed(1) + '%'
}

function getHeatmapValue(community: string, category: string): number | null {
  const item = heatmapData.value.find(h => h.community === community && h.serviceCategory === category)
  return item ? item.orderCount : null
}

function getGapValue(community: string): number | null {
  const items = heatmapData.value.filter(h => h.community === community)
  if (items.length === 0) return null
  return items.reduce((sum, i) => sum + i.supplyGap, 0)
}

function getHeatmapCellStyle(community: string, category: string) {
  const val = getHeatmapValue(community, category)
  if (val === null) return { background: '#fafafa' }
  const max = Math.max(...heatmapData.value.map(h => h.orderCount), 1)
  const ratio = val / max
  if (ratio < 0.33) return { background: 'rgba(64, 158, 255, 0.15)', color: '#606266' }
  if (ratio < 0.66) return { background: 'rgba(64, 158, 255, 0.4)', color: '#fff' }
  return { background: 'rgba(64, 158, 255, 0.7)', color: '#fff' }
}

function getGapCellStyle(community: string) {
  const val = getGapValue(community)
  if (val === null) return { background: '#fafafa' }
  if (val > 0) return { background: 'rgba(245, 108, 108, 0.25)', color: '#F56C6C', fontWeight: 600 }
  if (val < 0) return { background: 'rgba(103, 194, 58, 0.25)', color: '#67C23A', fontWeight: 600 }
  return { background: '#f5f7fa' }
}

function buildQueryParams(): QueryAnalyticsParams {
  const params: QueryAnalyticsParams = {}
  if (filterForm.dateRange?.length === 2) {
    params.startTime = filterForm.dateRange[0]
    params.endTime = filterForm.dateRange[1]
  }
  if (filterForm.communities?.length) {
    params.communities = filterForm.communities
  }
  return params
}

function initDefaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 29)
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  filterForm.dateRange = [fmt(start), fmt(end)]
}

function generateMockOverallStats(): OverallStats {
  return {
    totalOrders: 2847,
    totalAmount: 428560,
    avgOrderAmount: 150.5,
    onTimeRate: 0.873,
    avgRating: 4.7,
    activeWorkers: 42,
    newUsers: 156,
    cancelRate: 0.052,
    totalOrdersMom: 8.5,
    onTimeRateMom: 2.1,
    cancelRateMom: -1.3,
    avgRatingMom: 0.8
  }
}

function generateMockFulfillmentData(dim: string): FulfillmentBreakdownItem[] {
  const map: Record<string, string[]> = {
    community: communityOptions.value,
    date: Array.from({ length: 10 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (9 - i))
      return `${d.getMonth() + 1}/${d.getDate()}`
    }),
    reason: ['无', '人手不足', '高峰时段', '地址偏远'],
    all: ['总计']
  }
  const groups = map[dim] || []
  return groups.map(g => {
    const total = Math.floor(Math.random() * 300) + 100
    const late = Math.floor(total * (Math.random() * 0.25 + 0.05))
    const onTime = total - late
    return {
      group: g,
      totalOrders: total,
      onTimeOrders: onTime,
      lateOrders: late,
      onTimeRate: onTime / total,
      scheduledOnTime: Math.floor(total * (Math.random() * 0.15 + 0.8)),
      arrivedOnTime: Math.floor(total * (Math.random() * 0.2 + 0.7)),
      completedOnTime: Math.floor(total * (Math.random() * 0.2 + 0.75))
    }
  })
}

function generateMockHeatmapData(): HeatmapItem[] {
  const list: HeatmapItem[] = []
  for (const comm of communityOptions.value) {
    for (const cat of serviceCategories) {
      list.push({
        community: comm,
        serviceCategory: cat,
        orderCount: Math.floor(Math.random() * 80) + 10,
        supplyGap: Math.floor(Math.random() * 20) - 10
      })
    }
  }
  return list
}

function generateMockTrendData(): TrendPoint[] {
  return Array.from({ length: 15 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (14 - i))
    return {
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      orderCount: Math.floor(Math.random() * 100) + 80,
      onTimeRate: 0.75 + Math.random() * 0.2
    }
  })
}

function generateMockWorkerRanking(): WorkerRankItem[] {
  const names = ['李师傅', '王师傅', '张师傅', '赵师傅', '钱师傅', '孙师傅', '周师傅', '吴师傅', '郑师傅', '冯师傅']
  return names.map((name, i) => ({
    rank: i + 1,
    workerId: `w_${i + 1}`,
    workerName: name,
    completedOrders: Math.floor(Math.random() * 150) + 50,
    onTimeRate: 0.8 + Math.random() * 0.18,
    avgRating: Number((4.2 + Math.random() * 0.8).toFixed(1)),
    rescheduleCount: Math.floor(Math.random() * 10)
  })).sort((a, b) => b.completedOrders - a.completedOrders).map((item, i) => ({ ...item, rank: i + 1 }))
}

async function loadOverallStats() {
  try {
    const res = await getOverallStats(buildQueryParams())
    const data = (res.data as any)?.data || res.data
    if (data && typeof data.totalOrders === 'number') {
      overallStats.value = data
    } else {
      overallStats.value = generateMockOverallStats()
    }
  } catch {
    overallStats.value = generateMockOverallStats()
  }
}

async function loadFulfillmentData() {
  try {
    const params = { ...buildQueryParams(), dimension: dimension.value }
    const res = await getFulfillmentBreakdown(params)
    const data = (res.data as any)?.data || res.data
    if (Array.isArray(data) && data.length) {
      fulfillmentData.value = data
    } else {
      fulfillmentData.value = generateMockFulfillmentData(dimension.value)
    }
  } catch {
    fulfillmentData.value = generateMockFulfillmentData(dimension.value)
  }
}

async function loadHeatmapData() {
  try {
    const res = await getHeatmapData(buildQueryParams())
    const data = (res.data as any)?.data || res.data
    if (Array.isArray(data) && data.length) {
      heatmapData.value = data
    } else {
      heatmapData.value = generateMockHeatmapData()
    }
  } catch {
    heatmapData.value = generateMockHeatmapData()
  }
}

async function loadTrendData() {
  try {
    const res = await getTrendAnalysis(buildQueryParams())
    const data = (res.data as any)?.data || res.data
    if (Array.isArray(data) && data.length) {
      trendData.value = data
    } else {
      trendData.value = generateMockTrendData()
    }
  } catch {
    trendData.value = generateMockTrendData()
  }
}

async function loadWorkerRanking() {
  try {
    const res = await getWorkerRanking(buildQueryParams())
    const data = (res.data as any)?.data || res.data
    if (Array.isArray(data) && data.length) {
      workerRankingData.value = data
    } else {
      workerRankingData.value = generateMockWorkerRanking()
    }
  } catch {
    workerRankingData.value = generateMockWorkerRanking()
  }
  sortWorkerRanking()
}

function sortWorkerRanking() {
  const field = workerSortField.value as keyof WorkerRankItem
  const order = workerSortOrder.value === 'ascending' ? 1 : -1
  workerRankingData.value = [...workerRankingData.value].sort((a, b) => {
    const av = a[field] as number
    const bv = b[field] as number
    return (av - bv) * order
  }).map((item, i) => ({ ...item, rank: i + 1 }))
}

function handleWorkerSort({ prop, order }: { prop: string; order: string | null }) {
  if (!order) return
  workerSortField.value = prop
  workerSortOrder.value = order as 'ascending' | 'descending'
  sortWorkerRanking()
}

async function handleQuery() {
  loading.value = true
  try {
    await Promise.all([
      loadOverallStats(),
      loadFulfillmentData(),
      loadHeatmapData(),
      loadTrendData(),
      loadWorkerRanking()
    ])
    ElMessage.success('查询完成')
  } finally {
    loading.value = false
  }
}

function handleReset() {
  initDefaultDateRange()
  filterForm.communities = []
  handleQuery()
}

onMounted(() => {
  initDefaultDateRange()
  handleQuery()
})
</script>

<style scoped>
.analytics-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.filter-card :deep(.el-form-item) {
  margin-bottom: 0;
}

.stat-row {
  margin: 0;
}

.stat-card {
  background: #fff;
  border-radius: 6px;
  padding: 20px;
  border-top: 3px solid #409EFF;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.stat-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.stat-trend.up {
  color: #67C23A;
}

.stat-trend.down {
  color: #F56C6C;
}

.stat-icon {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-card {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: 600;
  font-size: 15px;
}

.sort-tip {
  font-size: 12px;
  color: #909399;
}

.chart {
  width: 100%;
  height: 320px;
}

.chart-row {
  margin: 0;
}

.breakdown-table {
  margin-top: 16px;
}

.three-node {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-label {
  font-size: 12px;
  color: #909399;
  width: 36px;
  flex-shrink: 0;
}

.node-bar {
  flex: 1;
  height: 12px;
  background: #f0f2f5;
  border-radius: 6px;
  overflow: hidden;
}

.node-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.node-val {
  font-size: 12px;
  color: #606266;
  width: 44px;
  text-align: right;
  flex-shrink: 0;
}

.heatmap-wrapper {
  width: 100%;
  overflow-x: auto;
}

.heatmap-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.heatmap-table th,
.heatmap-table td {
  border: 1px solid #ebeef5;
  padding: 10px 8px;
  text-align: center;
  transition: all 0.2s;
}

.heatmap-corner {
  background: #fafafa;
  position: sticky;
  left: 0;
  z-index: 2;
  min-width: 100px;
}

.heatmap-header {
  background: #f5f7fa;
  font-weight: 600;
  color: #303133;
  min-width: 80px;
}

.gap-header {
  background: #fdf6ec;
  color: #e6a23c;
}

.heatmap-row-header {
  background: #fafafa;
  font-weight: 500;
  color: #303133;
  position: sticky;
  left: 0;
  z-index: 1;
  text-align: left;
  padding-left: 12px;
}

.heatmap-cell {
  min-width: 80px;
  font-weight: 500;
}

.heatmap-cell:hover {
  transform: scale(1.05);
  z-index: 1;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.gap-cell {
  font-weight: 600;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  font-size: 12px;
  color: #606266;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-box {
  width: 20px;
  height: 14px;
  border-radius: 3px;
}

.legend-box.low {
  background: rgba(64, 158, 255, 0.15);
}

.legend-box.mid {
  background: rgba(64, 158, 255, 0.4);
}

.legend-box.high {
  background: rgba(64, 158, 255, 0.7);
}

.legend-box.shortage {
  background: rgba(245, 108, 108, 0.25);
}

.legend-box.surplus {
  background: rgba(103, 194, 58, 0.25);
}

.legend-divider {
  width: 1px;
  height: 16px;
  background: #dcdfe6;
  margin: 0 4px;
}

.rating-text {
  margin-left: 8px;
  font-size: 13px;
  color: #606266;
  vertical-align: middle;
}
</style>
