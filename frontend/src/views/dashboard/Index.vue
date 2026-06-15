<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">
        <el-icon><DataAnalysis /></el-icon>数据复盘看板
        <span style="font-weight:normal;font-size:13px;color:#909399;margin-left:10px;">品牌短视频阅读转化数据汇总</span>
      </h2>
      <div>
        <el-radio-group v-model="quickRange" size="default" @change="onQuickRange">
          <el-radio-button value="7">近7天</el-radio-button>
          <el-radio-button value="30">近30天</el-radio-button>
          <el-radio-button value="90">近90天</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="margin-left:12px;"
          @change="onDateChange"
        />
      </div>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="4" v-for="s in statCards" :key="s.key">
        <div class="stat-card">
          <div class="flex-between">
            <div>
              <div class="stat-label">{{ s.label }}</div>
              <div class="stat-value" :style="{ color: s.color }">{{ s.formatter(s.value) }}</div>
            </div>
            <el-icon :size="34" :color="s.color"><component :is="s.icon" /></el-icon>
          </div>
          <div class="stat-trend" :class="s.trend >= 0 ? 'up' : 'down'">
            <el-icon><component :is="s.trend >= 0 ? 'Top' : 'Bottom'" /></el-icon>
            {{ Math.abs(s.trend) }}% 环比
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="16">
        <div class="content-card" style="height:380px;">
          <div class="flex-between mb-10">
            <h3 style="margin:0;">播放/点赞/转化趋势</h3>
            <el-tag type="success" size="small">日维度</el-tag>
          </div>
          <v-chart class="chart" :option="trendOption" autoresize />
        </div>
      </el-col>
      <el-col :span="8">
        <div class="content-card" style="height:380px;">
          <div class="flex-between mb-10">
            <h3 style="margin:0;">平台分布</h3>
            <el-tag type="warning" size="small">按播放量</el-tag>
          </div>
          <v-chart class="chart" :option="platformOption" autoresize />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="12">
        <div class="content-card" style="height:420px;">
          <div class="flex-between mb-10">
            <h3 style="margin:0;">创作者产能排行</h3>
            <el-tag type="primary" size="small">TOP 10</el-tag>
          </div>
          <v-chart class="chart" :option="creatorOption" autoresize />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="content-card" style="height:420px;">
          <div class="flex-between mb-10">
            <h3 style="margin:0;">选题表现分析</h3>
            <el-tag type="danger" size="small">按转化金额</el-tag>
          </div>
          <v-chart class="chart" :option="topicOption" autoresize />
        </div>
      </el-col>
    </el-row>

    <div class="content-card">
      <div class="flex-between mb-10">
        <h3 style="margin:0;">平台详细数据</h3>
        <el-button size="small" type="primary" plain>
          <el-icon><Download /></el-icon>导出报表
        </el-button>
      </div>
      <el-table :data="platformStats" border size="default">
        <el-table-column prop="name" label="平台" width="120" />
        <el-table-column prop="videoCount" label="视频数" width="100" align="center" />
        <el-table-column prop="totalViews" label="总播放量" align="right">
          <template #default="{ row }">{{ formatNumber(row.totalViews) }}</template>
        </el-table-column>
        <el-table-column prop="totalLikes" label="总点赞" align="right">
          <template #default="{ row }">{{ formatNumber(row.totalLikes) }}</template>
        </el-table-column>
        <el-table-column prop="totalConversions" label="转化数" align="right">
          <template #default="{ row }">{{ formatNumber(row.totalConversions) }}</template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="转化金额(元)" align="right">
          <template #default="{ row }">{{ formatAmount(row.totalAmount) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center">
          <template #default>
            <el-button type="primary" link size="small">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, h } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import dayjs from 'dayjs'
import { getDashboardStats } from '../../api/stats'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent
])

const dateRange = ref([])
const quickRange = ref('30')
const loading = ref(false)
const dashboard = reactive({
  totalVideos: 0,
  totalViews: 0,
  totalLikes: 0,
  totalComments: 0,
  totalShares: 0,
  totalConversions: 0,
  totalAmount: 0,
  avgConversionRate: 0,
  platformStats: [],
  creatorStats: [],
  dateStats: [],
  topicPerformance: []
})

const platformStats = computed(() => dashboard.platformStats)

function onQuickRange(days) {
  const end = dayjs().format('YYYY-MM-DD')
  const start = dayjs().subtract(Number(days) - 1, 'day').format('YYYY-MM-DD')
  dateRange.value = [start, end]
  fetchData()
}

function onDateChange() {
  fetchData()
}

function formatNumber(num) {
  if (!num) return '0'
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

function formatAmount(num) {
  if (!num) return '¥0'
  if (num >= 10000) return '¥' + (num / 10000).toFixed(2) + 'w'
  return '¥' + Number(num).toFixed(2)
}

const statCards = computed(() => [
  {
    key: 'views',
    label: '总播放量',
    value: dashboard.totalViews,
    color: '#409EFF',
    icon: 'VideoPlay',
    trend: 23.5,
    formatter: formatNumber
  },
  {
    key: 'likes',
    label: '总点赞',
    value: dashboard.totalLikes,
    color: '#F56C6C',
    icon: 'Star',
    trend: 18.2,
    formatter: formatNumber
  },
  {
    key: 'conversions',
    label: '总转化数',
    value: dashboard.totalConversions,
    color: '#67C23A',
    icon: 'Goods',
    trend: 31.8,
    formatter: formatNumber
  },
  {
    key: 'amount',
    label: '转化金额',
    value: dashboard.totalAmount,
    color: '#E6A23C',
    icon: 'Money',
    trend: 25.6,
    formatter: formatAmount
  },
  {
    key: 'videos',
    label: '发布视频',
    value: dashboard.totalVideos,
    color: '#909399',
    icon: 'Film',
    trend: 12.3,
    formatter: v => v + '条'
  },
  {
    key: 'shares',
    label: '总分享',
    value: dashboard.totalShares,
    color: '#8E44AD',
    icon: 'Share',
    trend: 15.9,
    formatter: formatNumber
  }
])

const trendOption = computed(() => {
  const dates = dashboard.dateStats.map(d => d.statDate)
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['播放量', '点赞数', '转化数'], top: 0 },
    grid: { left: 50, right: 30, top: 40, bottom: 50 },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { rotate: 45, fontSize: 11 }
    },
    yAxis: [
      { type: 'value', name: '播放/点赞', axisLabel: { formatter: v => formatNumber(v) } },
      { type: 'value', name: '转化数', axisLabel: { formatter: v => formatNumber(v) } }
    ],
    series: [
      {
        name: '播放量',
        type: 'line',
        smooth: true,
        data: dashboard.dateStats.map(d => d.totalViews),
        itemStyle: { color: '#409EFF' },
        areaStyle: { opacity: 0.15 }
      },
      {
        name: '点赞数',
        type: 'line',
        smooth: true,
        data: dashboard.dateStats.map(d => d.totalLikes),
        itemStyle: { color: '#F56C6C' },
        areaStyle: { opacity: 0.12 }
      },
      {
        name: '转化数',
        type: 'bar',
        yAxisIndex: 1,
        data: dashboard.dateStats.map(d => d.totalConversions),
        itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] },
        barWidth: 14
      }
    ]
  }
})

const platformOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}<br/>播放量: {c} ({d}%)' },
  legend: { bottom: 0 },
  series: [{
    type: 'pie',
    radius: ['45%', '70%'],
    center: ['50%', '45%'],
    avoidLabelOverlap: false,
    label: { formatter: '{b}\n{d}%' },
    data: dashboard.platformStats.map(p => ({
      name: p.name,
      value: p.totalViews
    })),
    color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#8E44AD']
  }]
}))

const creatorOption = computed(() => {
  const data = [...dashboard.creatorStats].sort((a, b) => a.totalViews - b.totalViews).slice(-10)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 80, right: 40, top: 20, bottom: 30 },
    xAxis: { type: 'value', axisLabel: { formatter: v => formatNumber(v) } },
    yAxis: {
      type: 'category',
      data: data.map(d => d.creatorName),
      axisLabel: { fontSize: 12 }
    },
    series: [{
      type: 'bar',
      data: data.map(d => d.totalViews),
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ]
        }
      },
      label: { show: true, position: 'right', formatter: p => formatNumber(p.value) }
    }]
  }
})

const topicOption = computed(() => {
  const data = dashboard.topicPerformance.slice(0, 10)
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: { data: ['播放量', '转化金额'], top: 0 },
    grid: { left: 50, right: 50, top: 40, bottom: 60 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.topicTitle?.length > 10 ? d.topicTitle.slice(0, 10) + '...' : d.topicTitle),
      axisLabel: { rotate: 30, fontSize: 11 }
    },
    yAxis: [
      { type: 'value', name: '播放量', axisLabel: { formatter: v => formatNumber(v) } },
      { type: 'value', name: '转化金额', axisLabel: { formatter: v => '¥' + formatNumber(v) } }
    ],
    series: [
      {
        name: '播放量',
        type: 'bar',
        data: data.map(d => d.totalViews),
        itemStyle: { color: '#5470c6', borderRadius: [4, 4, 0, 0] }
      },
      {
        name: '转化金额',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: data.map(d => d.totalAmount),
        itemStyle: { color: '#ee6666' },
        lineStyle: { width: 3 },
        symbolSize: 8
      }
    ]
  }
})

async function fetchData() {
  loading.value = true
  try {
    const params = {}
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getDashboardStats(params)
    if (res.data) {
      Object.assign(dashboard, res.data)
    }
  } catch (e) {
    console.error(e)
    applyMockData()
  } finally {
    loading.value = false
  }
}

function applyMockData() {
  const today = dayjs()
  const days = Number(quickRange.value) || 30
  const dateStats = []
  for (let i = days - 1; i >= 0; i--) {
    const d = today.subtract(i, 'day').format('YYYY-MM-DD')
    dateStats.push({
      statDate: d,
      videoCount: Math.floor(Math.random() * 5) + 1,
      totalViews: Math.floor(Math.random() * 500000) + 100000,
      totalLikes: Math.floor(Math.random() * 30000) + 5000,
      totalConversions: Math.floor(Math.random() * 500) + 100
    })
  }
  Object.assign(dashboard, {
    totalVideos: dateStats.reduce((s, d) => s + d.videoCount, 0),
    totalViews: dateStats.reduce((s, d) => s + d.totalViews, 0),
    totalLikes: dateStats.reduce((s, d) => s + d.totalLikes, 0),
    totalComments: 18900,
    totalShares: 58200,
    totalConversions: dateStats.reduce((s, d) => s + d.totalConversions, 0),
    totalAmount: 2270000,
    avgConversionRate: 7.52,
    platformStats: [
      { name: '抖音', videoCount: 5, totalViews: 2104700, totalLikes: 155900, totalConversions: 7330, totalAmount: 1468000 },
      { name: '快手', videoCount: 1, totalViews: 245800, totalLikes: 18200, totalConversions: 680, totalAmount: 136000 },
      { name: '视频号', videoCount: 2, totalViews: 515000, totalLikes: 41600, totalConversions: 2140, totalAmount: 428000 },
      { name: 'B站', videoCount: 1, totalViews: 125600, totalLikes: 12800, totalConversions: 480, totalAmount: 96000 },
      { name: '小红书', videoCount: 1, totalViews: 156800, totalLikes: 18900, totalConversions: 560, totalAmount: 112000 }
    ],
    creatorStats: [
      { creatorId: 1, creatorName: '张小明', videoCount: 6, totalViews: 2867100, totalLikes: 190900, totalConversions: 9870, totalAmount: 1898000 },
      { creatorId: 2, creatorName: '李小红', videoCount: 2, totalViews: 446400, totalLikes: 40700, totalConversions: 1380, totalAmount: 276000 },
      { creatorId: 3, creatorName: '王小刚', videoCount: 0, totalViews: 0, totalLikes: 0, totalConversions: 0, totalAmount: 0 }
    ],
    dateStats,
    topicPerformance: [
      { topicId: 1, topicTitle: '夏季新品防晒衣种草', videoCount: 5, totalViews: 1771700, totalLikes: 124300, totalConversions: 4790, totalAmount: 958000, avgConversionRate: 7.1 },
      { topicId: 2, topicTitle: '618大促爆款清单', videoCount: 2, totalViews: 1220800, totalLikes: 84400, totalConversions: 5180, totalAmount: 1036000, avgConversionRate: 8.54 },
      { topicId: 3, topicTitle: '职场新人穿搭指南', videoCount: 2, totalViews: 446400, totalLikes: 40700, totalConversions: 1380, totalAmount: 276000, avgConversionRate: 6.4 }
    ]
  })
}

onMounted(() => {
  onQuickRange('30')
})
</script>

<style scoped lang="scss">
.stat-card {
  .stat-trend {
    &.up { color: #67C23A; }
    &.down { color: #F56C6C; }
  }
}
.chart {
  width: 100%;
  height: calc(100% - 40px);
  min-height: 300px;
}
</style>
