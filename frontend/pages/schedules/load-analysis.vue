<template>
  <div class="load-analysis-page space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">负荷分析</h1>
        <p class="text-sm text-gray-500 mt-1">监控员工排班负荷，识别潜在风险</p>
      </div>
      <div class="flex items-center gap-2">
        <n-button size="small" type="primary" ghost @click="refreshData">
          <template #icon>
            <n-icon><RefreshSharp /></n-icon>
          </template>
          刷新数据
        </n-button>
        <n-button size="small">
          <template #icon>
            <n-icon><DownloadSharp /></n-icon>
          </template>
          导出报告
        </n-button>
      </div>
    </div>

    <n-card class="!rounded-2xl !border-0" content-style="padding: 16px 20px 20px;">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <div class="text-xs text-gray-500 mb-1.5">日期范围</div>
          <n-date-picker v-model:value="dateRange" type="daterange" clearable size="small" style="width: 280px;" />
        </div>
        <div>
          <div class="text-xs text-gray-500 mb-1.5">员工筛选</div>
          <n-select
            v-model:value="selectedStaff"
            :options="staffOptions"
            multiple
            clearable
            placeholder="全部员工"
            size="small"
            style="width: 220px;"
          />
        </div>
        <n-button size="small" type="primary" @click="applyFilter">
          <template #icon>
            <n-icon><SearchSharp /></n-icon>
          </template>
          筛选
        </n-button>
        <n-button size="small" quaternary @click="resetFilter">重置</n-button>
      </div>
    </n-card>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      <div v-for="stat in summaryStats" :key="stat.label" class="group">
        <n-card class="!rounded-2xl !border-0 hover:!shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden" content-style="padding: 0;">
          <div :class="['p-5 bg-gradient-to-br', stat.bgGradient]">
            <div class="flex items-start justify-between">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center" :style="{ backgroundColor: stat.color + '20' }">
                <n-icon :size="22" :color="stat.color">
                  <component :is="stat.icon" />
                </n-icon>
              </div>
              <n-tag :type="stat.tagType" size="small" round>{{ stat.trend }}</n-tag>
            </div>
            <div class="mt-4">
              <div class="text-2xl font-bold" :style="{ color: stat.color }">{{ stat.value }}</div>
              <div class="text-sm text-gray-600 mt-1">{{ stat.label }}</div>
            </div>
          </div>
        </n-card>
      </div>
    </div>

    <n-card class="!rounded-2xl !border-0" title="人员负荷分析" content-style="padding: 16px 20px 20px;">
      <template #header-extra>
        <div class="flex items-center gap-4 text-xs text-gray-500">
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm" style="background: #10B981;"></span>正常</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm" style="background: #F97316;"></span>偏高</span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm" style="background: #EF4444;"></span>过载</span>
        </div>
      </template>
      <div ref="staffLoadChartRef" style="width: 100%; height: 340px;"></div>
    </n-card>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <n-card class="!rounded-2xl !border-0" title="日期负荷趋势" content-style="padding: 16px 20px 20px;">
        <template #header-extra>
          <n-tag size="small" type="info" round>近7天</n-tag>
        </template>
        <div ref="dateLoadChartRef" style="width: 100%; height: 340px;"></div>
      </n-card>

      <n-card class="!rounded-2xl !border-0" title="寄养风险原因分布" content-style="padding: 16px 20px 20px;">
        <template #header-extra>
          <n-tag size="small" type="warning" round>共 {{ totalRiskCount }} 项</n-tag>
        </template>
        <div ref="riskChartRef" style="width: 100%; height: 340px;"></div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, h } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import type { StaffLoad } from '~/stores/schedules'
import {
  RefreshSharp,
  DownloadSharp,
  SearchSharp,
  PeopleSharp,
  CalendarSharp,
  AlertCircleSharp,
  TrendingUpSharp,
} from '@vicons/ionicons5'

const schedulesStore = useSchedulesStore()
const message = useMessage()

const dateRange = ref<[number, number] | null>([
  dayjs().subtract(6, 'day').valueOf(),
  dayjs().valueOf(),
])
const selectedStaff = ref<string[]>([])

const staffOptions = computed(() =>
  schedulesStore.staffs.map((s) => ({ label: s.name, value: s.id }))
)

const staffLoadChartRef = ref<HTMLElement | null>(null)
const dateLoadChartRef = ref<HTMLElement | null>(null)
const riskChartRef = ref<HTMLElement | null>(null)
let staffLoadChart: echarts.ECharts | null = null
let dateLoadChart: echarts.ECharts | null = null
let riskChart: echarts.ECharts | null = null

const filteredStaffLoads = computed<StaffLoad[]>(() => {
  let start: string | undefined
  let end: string | undefined
  if (dateRange.value) {
    start = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
    end = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
  }
  let loads = schedulesStore.getStaffLoads(start, end)
  if (selectedStaff.value && selectedStaff.value.length > 0) {
    loads = loads.filter((l) => selectedStaff.value.includes(l.staffId))
  }
  return loads
})

const filteredDateLoads = computed(() => {
  let start: string | undefined
  let end: string | undefined
  if (dateRange.value) {
    start = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
    end = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
  }
  return schedulesStore.getDateLoads(start, end)
})

const riskReasons = computed(() => schedulesStore.getRiskReasons())

const totalRiskCount = computed(() => riskReasons.value.reduce((s, r) => s + r.count, 0))

const summaryStats = computed(() => {
  const loads = filteredStaffLoads.value
  const avgLoad = loads.length
    ? Math.round(loads.reduce((s, l) => s + l.loadPercent, 0) / loads.length)
    : 0
  const overloadCount = loads.filter((l) => l.loadPercent >= 85).length
  const totalShifts = loads.reduce((s, l) => s + l.totalShifts, 0)
  const totalTasks = loads.reduce((s, l) => s + l.totalTasks, 0)
  return [
    {
      label: '平均负荷率',
      value: avgLoad + '%',
      trend: avgLoad >= 70 ? '偏高' : '正常',
      tagType: (avgLoad >= 70 ? 'warning' : 'success') as const,
      color: '#1A8A7D',
      bgGradient: 'from-teal-50 to-teal-100',
      icon: TrendingUpSharp,
    },
    {
      label: '过载人员数',
      value: overloadCount + '人',
      trend: overloadCount > 0 ? '需关注' : '无风险',
      tagType: (overloadCount > 0 ? 'error' : 'success') as const,
      color: '#EF4444',
      bgGradient: 'from-rose-50 to-rose-100',
      icon: AlertCircleSharp,
    },
    {
      label: '总排班天数',
      value: totalShifts + '天',
      trend: '较上周 +12%',
      tagType: 'info' as const,
      color: '#6366F1',
      bgGradient: 'from-indigo-50 to-indigo-100',
      icon: CalendarSharp,
    },
    {
      label: '总任务数',
      value: totalTasks + '个',
      trend: '较上周 +8%',
      tagType: 'primary' as const,
      color: '#FF8C42',
      bgGradient: 'from-orange-50 to-orange-100',
      icon: PeopleSharp,
    },
  ]
})

function applyFilter() {
  message.success('筛选已应用')
  nextTick(() => {
    renderAllCharts()
  })
}

function resetFilter() {
  dateRange.value = [
    dayjs().subtract(6, 'day').valueOf(),
    dayjs().valueOf(),
  ]
  selectedStaff.value = []
  nextTick(() => {
    renderAllCharts()
  })
}

function refreshData() {
  message.success('数据已刷新')
  nextTick(() => {
    renderAllCharts()
  })
}

function getLoadColor(percent: number) {
  if (percent >= 85) return '#EF4444'
  if (percent >= 65) return '#F97316'
  return '#10B981'
}

function initStaffLoadChart() {
  if (!staffLoadChartRef.value) return
  staffLoadChart = echarts.init(staffLoadChartRef.value)
  renderStaffLoadChart()
}

function renderStaffLoadChart() {
  if (!staffLoadChart) return
  const loads = filteredStaffLoads.value
  const option: echarts.EChartsOption = {
    grid: { left: 20, right: 30, top: 30, bottom: 40, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151' },
      formatter: (params: any) => {
        const d = params[0]
        const load = loads[d.dataIndex]
        return `<div style="padding:4px 8px;">
          <div style="font-weight:500;margin-bottom:6px;">${load.staffName}</div>
          <div style="font-size:12px;color:#6B7280;">岗位：${load.role}</div>
          <div style="font-size:12px;color:#6B7280;">排班天数：${load.totalShifts}天</div>
          <div style="font-size:12px;color:#6B7280;">任务总数：${load.totalTasks}个</div>
          <div style="font-size:12px;margin-top:4px;">
            负荷率：<b style="color:${getLoadColor(load.loadPercent)};">${load.loadPercent}%</b>
          </div>
        </div>`
      },
    },
    xAxis: {
      type: 'category',
      data: loads.map((l) => l.staffName),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#6B7280', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9CA3AF', fontSize: 12, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        data: loads.map((l) => ({
          value: l.loadPercent,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: getLoadColor(l.loadPercent) },
              { offset: 1, color: getLoadColor(l.loadPercent) + '80' },
            ]),
            borderRadius: [6, 6, 0, 0],
          },
        })),
        barWidth: 28,
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          color: '#374151',
          fontSize: 11,
          fontWeight: 500,
        },
      },
      {
        type: 'line',
        data: loads.map((l) => l.totalTasks),
        yAxisIndex: 0,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#6366F1', width: 2 },
        itemStyle: { color: '#6366F1', borderColor: '#fff', borderWidth: 2 },
      },
    ],
  }
  staffLoadChart.setOption(option)
}

function initDateLoadChart() {
  if (!dateLoadChartRef.value) return
  dateLoadChart = echarts.init(dateLoadChartRef.value)
  renderDateLoadChart()
}

function renderDateLoadChart() {
  if (!dateLoadChart) return
  const loads = filteredDateLoads.value
  const option: echarts.EChartsOption = {
    grid: { left: 20, right: 30, top: 30, bottom: 40, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151' },
      formatter: (params: any) => {
        const p1 = params[0]
        const p2 = params[1]
        const d = loads[p1.dataIndex]
        return `<div style="padding:4px 8px;">
          <div style="font-weight:500;margin-bottom:6px;">${dayjs(d.date).format('MM月DD日')}</div>
          <div style="font-size:12px;color:#6B7280;">在岗人员：${d.staffCount}人</div>
          <div style="font-size:12px;color:#6B7280;">任务总数：${d.taskCount}个</div>
          <div style="font-size:12px;margin-top:4px;">
            整体负荷：<b style="color:#1A8A7D;">${d.loadPercent}%</b>
          </div>
        </div>`
      },
    },
    xAxis: {
      type: 'category',
      data: loads.map((l) => dayjs(l.date).format('MM/DD')),
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#6B7280', fontSize: 12 },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9CA3AF', fontSize: 12, formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
    },
    series: [
      {
        name: '负荷率',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: loads.map((l) => l.loadPercent),
        lineStyle: { width: 3, color: '#1A8A7D' },
        itemStyle: { color: '#1A8A7D', borderColor: '#fff', borderWidth: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(26, 138, 125, 0.35)' },
            { offset: 0.5, color: 'rgba(26, 138, 125, 0.12)' },
            { offset: 1, color: 'rgba(26, 138, 125, 0.02)' },
          ]),
        },
      },
      {
        name: '任务数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: loads.map((l) => l.taskCount),
        lineStyle: { width: 2, color: '#F97316' },
        itemStyle: { color: '#F97316', borderColor: '#fff', borderWidth: 2 },
      },
    ],
  }
  dateLoadChart.setOption(option)
}

function initRiskChart() {
  if (!riskChartRef.value) return
  riskChart = echarts.init(riskChartRef.value)
  renderRiskChart()
}

function renderRiskChart() {
  if (!riskChart) return
  const reasons = riskReasons.value
  const option: echarts.EChartsOption = {
    grid: { left: 20, right: 30, top: 30, bottom: 40, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151' },
      formatter: (params: any) => {
        const d = params[0]
        return `<div style="padding:4px 8px;">
          <div style="font-weight:500;margin-bottom:4px;">${d.name}</div>
          <div>数量：<b style="color:${d.color};">${d.value}</b> 项</div>
        </div>`
      },
    },
    xAxis: {
      type: 'category',
      data: reasons.map((r) => r.reason),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#6B7280', fontSize: 11, interval: 0 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#9CA3AF', fontSize: 12 },
      splitLine: { lineStyle: { color: '#F3F4F6', type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        stack: 'risk',
        data: reasons.map((r) => ({
          value: r.count,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: r.color },
              { offset: 1, color: r.color + '90' },
            ]),
            borderRadius: [6, 6, 6, 6],
          },
        })),
        barWidth: 32,
        label: {
          show: true,
          position: 'top',
          color: '#374151',
          fontSize: 11,
          fontWeight: 500,
        },
      },
    ],
  }
  riskChart.setOption(option)
}

function renderAllCharts() {
  renderStaffLoadChart()
  renderDateLoadChart()
  renderRiskChart()
}

function handleResize() {
  staffLoadChart?.resize()
  dateLoadChart?.resize()
  riskChart?.resize()
}

onMounted(() => {
  nextTick(() => {
    initStaffLoadChart()
    initDateLoadChart()
    initRiskChart()
    window.addEventListener('resize', handleResize)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  staffLoadChart?.dispose()
  dateLoadChart?.dispose()
  riskChart?.dispose()
})

watch(
  () => [filteredStaffLoads.value, filteredDateLoads.value, riskReasons.value],
  () => {
    nextTick(() => renderAllCharts())
  },
  { deep: true }
)
</script>

<style scoped>
.load-analysis-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
