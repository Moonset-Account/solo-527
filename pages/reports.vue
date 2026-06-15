<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">复盘报表</h1>
        <p class="text-slate-500 mt-1">月度经营分析与异常复盘</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <Calendar class="w-4 h-4 text-slate-400" />
          <select v-model="selectedMonth" class="select w-40" @change="fetchData">
            <option value="2024-06">2024年6月</option>
            <option value="2024-05">2024年5月</option>
            <option value="2024-04">2024年4月</option>
            <option value="2024-03">2024年3月</option>
          </select>
        </div>
        <button class="btn-secondary flex items-center gap-1.5">
          <Download class="w-4 h-4" />
          导出报表
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="card p-5 bg-gradient-to-br from-primary-50 to-white">
        <p class="text-sm text-slate-500 mb-1">总销售额</p>
        <p class="text-2xl font-bold text-slate-800 font-mono">{{ formatNumber(report.totalSales) }} 万元</p>
        <p class="text-xs text-success-600 mt-2 flex items-center gap-1">
          <TrendingUp class="w-3.5 h-3.5" />
          同比 +12.5%
        </p>
      </div>
      <div class="card p-5 bg-gradient-to-br from-accent-50 to-white">
        <p class="text-sm text-slate-500 mb-1">总订单量</p>
        <p class="text-2xl font-bold text-slate-800 font-mono">{{ formatNumber(report.totalOrders) }} 单</p>
        <p class="text-xs text-success-600 mt-2 flex items-center gap-1">
          <TrendingUp class="w-3.5 h-3.5" />
          同比 +8.3%
        </p>
      </div>
      <div class="card p-5 bg-gradient-to-br from-success-50 to-white">
        <p class="text-sm text-slate-500 mb-1">平均毛利率</p>
        <p class="text-2xl font-bold text-slate-800 font-mono">{{ report.avgMargin }}%</p>
        <p class="text-xs text-success-600 mt-2 flex items-center gap-1">
          <TrendingUp class="w-3.5 h-3.5" />
          同比 +2.1%
        </p>
      </div>
      <div class="card p-5 bg-gradient-to-br from-warning-50 to-white">
        <p class="text-sm text-slate-500 mb-1">异常波动数</p>
        <p class="text-2xl font-bold text-slate-800 font-mono">{{ report.fluctuationCount }} 次</p>
        <p class="text-xs text-danger-600 mt-2 flex items-center gap-1">
          <TrendingDown class="w-3.5 h-3.5" />
          较上月 -5 次
        </p>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <div class="card p-5">
        <h3 class="text-base font-semibold text-slate-800 mb-4">异常分类统计</h3>
        <div ref="categoryChartRef" class="h-64"></div>
      </div>

      <div class="card p-5">
        <h3 class="text-base font-semibold text-slate-800 mb-4">处理时效分布</h3>
        <div ref="timingChartRef" class="h-64"></div>
      </div>
    </div>

    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-slate-800">本月异常明细</h3>
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-500">共 {{ fluctuations.length }} 条记录</span>
          <select class="select text-sm py-1.5 w-32">
            <option>全部状态</option>
            <option>已关闭</option>
            <option>处理中</option>
            <option>待处理</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50">
              <th class="table-header">异常标题</th>
              <th class="table-header">来源</th>
              <th class="table-header">优先级</th>
              <th class="table-header">负责人</th>
              <th class="table-header">发现时间</th>
              <th class="table-header">处理时长</th>
              <th class="table-header">状态</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in fluctuations" :key="item.id" class="hover:bg-slate-50/50 transition-colors cursor-pointer" @click="viewDetail(item)">
              <td class="table-cell">
                <span class="font-medium text-slate-700">{{ item.title }}</span>
              </td>
              <td class="table-cell">
                <span class="badge" :class="'badge-' + getSourceBadge(item.source)">
                  {{ getSourceText(item.source) }}
                </span>
              </td>
              <td class="table-cell">
                <span class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full" :class="getPriorityDot(item.priority)"></span>
                  <span class="text-sm text-slate-600">{{ getPriorityText(item.priority) }}</span>
                </span>
              </td>
              <td class="table-cell">
                <span class="text-slate-600">{{ item.assigneeName || '-' }}</span>
              </td>
              <td class="table-cell">
                <span class="text-slate-500 text-sm">{{ formatDate(item.detectedAt) }}</span>
              </td>
              <td class="table-cell">
                <span class="text-slate-600 text-sm">{{ calculateDuration(item) }}</span>
              </td>
              <td class="table-cell">
                <span class="badge" :class="'badge-' + getStatusBadge(item.status)">
                  {{ getStatusText(item.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card p-5">
      <h3 class="text-base font-semibold text-slate-800 mb-4">月度总结</h3>
      <div class="prose prose-sm max-w-none text-slate-600">
        <p>
          <strong class="text-slate-800">总体情况：</strong>
          本月销售额 {{ formatNumber(report.totalSales) }} 万元，同比增长 12.5%，订单量 {{ formatNumber(report.totalOrders) }} 单，同比增长 8.3%。
          毛利率维持在 {{ report.avgMargin }}%，较上月提升 0.8 个百分点。
        </p>
        <p class="mt-3">
          <strong class="text-slate-800">异常分析：</strong>
          本月共发生 {{ report.fluctuationCount }} 次异常波动，其中已关闭 {{ report.closedFluctuations }} 次，关闭率 {{ (report.closedFluctuations / report.fluctuationCount * 100).toFixed(1) }}%。
          平均处理时长 {{ report.avgProcessingHours }} 小时，较上月缩短 3.2 小时。
        </p>
        <p class="mt-3">
          <strong class="text-slate-800">主要问题：</strong>
        </p>
        <ul class="mt-1">
          <li>销售额波动主要集中在华东和华南区域，与经销商库存调整周期相关</li>
          <li>接口错误类异常共 5 次，其中供应链系统占 3 次，需加强系统稳定性</li>
          <li>高优先级异常平均响应时间为 4.5 小时，仍有优化空间</li>
        </ul>
        <p class="mt-3">
          <strong class="text-slate-800">改进建议：</strong>
        </p>
        <ul class="mt-1">
          <li>建立与主要经销商的库存联动机制，提前预判销售波动</li>
          <li>加强供应链系统监控，增加降级和重试机制</li>
          <li>优化告警分级，确保高优先级异常及时响应</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar, Download, TrendingUp, TrendingDown } from 'lucide-vue-next'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import type { MonthlyReport, Fluctuation } from '~/types'
import { formatNumber } from '~/utils/format'

const router = useRouter()

const selectedMonth = ref('2024-06')
const report = ref<MonthlyReport>({
  month: '2024-06',
  totalSales: 0,
  totalOrders: 0,
  avgMargin: 0,
  fluctuationCount: 0,
  closedFluctuations: 0,
  avgProcessingHours: 0,
  fluctuationByCategory: [],
  processingTimeDistribution: []
})
const fluctuations = ref<Fluctuation[]>([])

const categoryChartRef = ref<HTMLElement | null>(null)
const timingChartRef = ref<HTMLElement | null>(null)
let categoryChart: echarts.ECharts | null = null
let timingChart: echarts.ECharts | null = null

const getSourceText = (source: string): string => {
  switch (source) {
    case 'metric_monitor': return '指标监控'
    case 'api_error': return '接口错误'
    case 'manual': return '手动录入'
    default: return source
  }
}

const getSourceBadge = (source: string): string => {
  switch (source) {
    case 'metric_monitor': return 'primary'
    case 'api_error': return 'danger'
    case 'manual': return 'secondary'
    default: return 'secondary'
  }
}

const getPriorityDot = (priority: string): string => {
  switch (priority) {
    case 'high': return 'bg-danger-500'
    case 'medium': return 'bg-warning-500'
    case 'low': return 'bg-success-500'
    default: return 'bg-slate-400'
  }
}

const getPriorityText = (priority: string): string => {
  switch (priority) {
    case 'high': return '高'
    case 'medium': return '中'
    case 'low': return '低'
    default: return priority
  }
}

const getStatusBadge = (status: string): string => {
  switch (status) {
    case 'pending': return 'warning'
    case 'processing': return 'primary'
    case 'closed': return 'success'
    default: return 'secondary'
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending': return '待处理'
    case 'processing': return '处理中'
    case 'closed': return '已关闭'
    default: return status
  }
}

const formatDate = (date: string): string => {
  return dayjs(date).format('MM-DD HH:mm')
}

const calculateDuration = (item: Fluctuation): string => {
  if (item.status === 'pending') return '处理中'
  if (!item.closedAt || !item.detectedAt) return '-'
  
  const start = dayjs(item.detectedAt)
  const end = dayjs(item.closedAt)
  const hours = end.diff(start, 'hour')
  
  if (hours < 24) return `${hours} 小时`
  return `${Math.floor(hours / 24)} 天 ${hours % 24} 小时`
}

const viewDetail = (item: Fluctuation) => {
  router.push(`/alerts/fluctuations/${item.id}`)
}

const initCharts = () => {
  if (categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value)
    categoryChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
      legend: { orient: 'vertical', right: 10, top: 'center', itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 12, color: '#64748b' } },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: report.value.fluctuationByCategory.map((item, idx) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: ['#0F3460', '#FF6B35', '#2ECC71', '#F39C12', '#E74C3C'][idx % 5] }
        }))
      }]
    })
  }

  if (timingChartRef.value) {
    timingChart = echarts.init(timingChartRef.value)
    timingChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 50, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: report.value.processingTimeDistribution.map(d => d.name),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 }
      },
      series: [{
        type: 'bar',
        data: report.value.processingTimeDistribution.map(d => d.value),
        barWidth: 24,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#0F3460' },
            { offset: 1, color: '#0F346050' }
          ])
        }
      }]
    })
  }
}

const fetchData = async () => {
  try {
    const [reportData, fluctuationsRes] = await Promise.all([
      $fetch('/api/reports/monthly', { params: { month: selectedMonth.value } }),
      $fetch('/api/alerts/fluctuations')
    ])

    report.value = reportData as MonthlyReport
    fluctuations.value = (fluctuationsRes as any).items || []

    nextTick(() => {
      initCharts()
    })
  } catch (e) {
    console.error('Failed to fetch report data:', e)
  }
}

onMounted(() => {
  fetchData()

  window.addEventListener('resize', () => {
    categoryChart?.resize()
    timingChart?.resize()
  })
})

definePageMeta({
  layout: 'default'
})
</script>
