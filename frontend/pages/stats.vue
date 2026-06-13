<template>
  <div class="stats-page">
    <n-spin :show="loading">
      <div class="overview-section">
        <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen">
          <n-grid-item>
            <n-card class="stat-card stat-total" hoverable>
              <div class="stat-content">
                <div class="stat-icon">📋</div>
                <div class="stat-info">
                  <div class="stat-label">总工单数</div>
                  <div class="stat-value">{{ overview.total_tickets }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>

          <n-grid-item>
            <n-card class="stat-card stat-pending" hoverable>
              <div class="stat-content">
                <div class="stat-icon">⏳</div>
                <div class="stat-info">
                  <div class="stat-label">待处理</div>
                  <div class="stat-value">{{ overview.pending_tickets }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>

          <n-grid-item>
            <n-card class="stat-card stat-processing" hoverable>
              <div class="stat-content">
                <div class="stat-icon">🔄</div>
                <div class="stat-info">
                  <div class="stat-label">处理中</div>
                  <div class="stat-value">{{ overview.processing_tickets }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>

          <n-grid-item>
            <n-card class="stat-card stat-resolved" hoverable>
              <div class="stat-content">
                <div class="stat-icon">✅</div>
                <div class="stat-info">
                  <div class="stat-label">已解决</div>
                  <div class="stat-value">{{ overview.resolved_tickets }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>

          <n-grid-item>
            <n-card class="stat-card stat-response" hoverable>
              <div class="stat-content">
                <div class="stat-icon">⚡</div>
                <div class="stat-info">
                  <div class="stat-label">平均响应时间</div>
                  <div class="stat-value">{{ formatSeconds(overview.avg_response_time) }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>

          <n-grid-item>
            <n-card class="stat-card stat-overdue" hoverable>
              <div class="stat-content">
                <div class="stat-icon">⚠️</div>
                <div class="stat-info">
                  <div class="stat-label">超时风险数</div>
                  <div class="stat-value">{{ overview.overdue_count }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>

          <n-grid-item>
            <n-card class="stat-card stat-duplicate" hoverable>
              <div class="stat-content">
                <div class="stat-icon">📑</div>
                <div class="stat-info">
                  <div class="stat-label">重复工单数</div>
                  <div class="stat-value">{{ overview.duplicate_count }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>

          <n-grid-item>
            <n-card class="stat-card stat-rating" hoverable>
              <div class="stat-content">
                <div class="stat-icon">⭐</div>
                <div class="stat-info">
                  <div class="stat-label">平均满意度</div>
                  <div class="stat-value">{{ formatRating(overview.avg_feedback_rating) }}</div>
                </div>
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </div>

      <n-card class="chart-card" title="响应时长趋势（近30天）" :bordered="false">
        <v-chart class="chart" :option="responseTimeOption" autoresize />
      </n-card>

      <n-grid :cols="2" :x-gap="16" :y-gap="16" responsive="screen" class="charts-grid">
        <n-grid-item>
          <n-card class="chart-card" title="工单优先级分布" :bordered="false">
            <v-chart class="chart" :option="priorityOption" autoresize />
          </n-card>
        </n-grid-item>

        <n-grid-item>
          <n-card class="chart-card" title="风险分布" :bordered="false">
            <v-chart class="chart" :option="riskOption" autoresize />
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-card class="chart-card" title="工单分类分布" :bordered="false">
        <v-chart class="chart" :option="categoryOption" autoresize />
      </n-card>

      <n-card class="chart-card" title="客服人员绩效" :bordered="false">
        <n-data-table
          :columns="agentColumns"
          :data="agentPerformance"
          :pagination="false"
          :bordered="false"
          :row-key="(row) => row.user_id"
        />
        <n-empty v-if="agentPerformance.length === 0" description="暂无绩效数据" />
      </n-card>

      <n-grid :cols="3" :x-gap="16" :y-gap="16" responsive="screen" class="duplicate-section">
        <n-grid-item>
          <n-card class="stat-card stat-duplicate-card" hoverable>
            <div class="stat-content">
              <div class="stat-icon">📊</div>
              <div class="stat-info">
                <div class="stat-label">总工单数</div>
                <div class="stat-value">{{ duplicateStats.total_tickets }}</div>
              </div>
            </div>
          </n-card>
        </n-grid-item>

        <n-grid-item>
          <n-card class="stat-card stat-duplicate-card" hoverable>
            <div class="stat-content">
              <div class="stat-icon">📑</div>
              <div class="stat-info">
                <div class="stat-label">重复工单数</div>
                <div class="stat-value">{{ duplicateStats.duplicate_count }}</div>
              </div>
            </div>
          </n-card>
        </n-grid-item>

        <n-grid-item>
          <n-card class="stat-card stat-rate-card" hoverable>
            <div class="stat-content">
              <div class="stat-icon">📈</div>
              <div class="stat-info">
                <div class="stat-label">重复率</div>
                <div class="stat-value">{{ duplicateStats.duplicate_rate }}%</div>
              </div>
            </div>
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-card class="chart-card" title="高频重复原始工单 Top 10" :bordered="false">
        <n-data-table
          :columns="duplicateColumns"
          :data="duplicateStats.top_duplicate_originals"
          :pagination="false"
          :bordered="false"
          :row-key="(row) => row.original_ticket_id"
        />
        <n-empty v-if="duplicateStats.top_duplicate_originals.length === 0" description="暂无重复工单" />
      </n-card>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, h } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { DataTableColumns } from 'naive-ui'
import dayjs from 'dayjs'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent
])

definePageMeta({
  layout: 'default'
})

interface OverviewData {
  total_tickets: number
  pending_tickets: number
  processing_tickets: number
  resolved_tickets: number
  avg_response_time: number | null
  avg_resolution_time: number | null
  overdue_count: number
  duplicate_count: number
  avg_feedback_rating: number | null
  high_risk_count: number
}

interface ResponseTimeItem {
  date: string
  avg_response_seconds: number | null
  avg_resolution_seconds: number | null
  ticket_count: number
}

interface PriorityItem {
  priority: string
  count: number
}

interface CategoryItem {
  category: string
  count: number
}

interface AgentItem {
  user_id: number
  username: string
  full_name: string | null
  total_assigned: number
  avg_response_seconds: number | null
  avg_resolution_seconds: number | null
}

interface RiskItem {
  risk_level: string
  count: number
}

interface DuplicateOriginal {
  original_ticket_id: number
  original_title: string | null
  duplicate_count: number
}

interface DuplicateStatsData {
  total_tickets: number
  duplicate_count: number
  duplicate_rate: number
  top_duplicate_originals: DuplicateOriginal[]
}

const { get } = useApi()
const auth = useAuthStore()
const message = useMessage()
const router = useRouter()

const loading = ref(false)

const overview = reactive<OverviewData>({
  total_tickets: 0,
  pending_tickets: 0,
  processing_tickets: 0,
  resolved_tickets: 0,
  avg_response_time: null,
  avg_resolution_time: null,
  overdue_count: 0,
  duplicate_count: 0,
  avg_feedback_rating: null,
  high_risk_count: 0
})

const responseTimeData = ref<ResponseTimeItem[]>([])
const priorityData = ref<PriorityItem[]>([])
const categoryData = ref<CategoryItem[]>([])
const agentPerformance = ref<AgentItem[]>([])
const riskData = ref<RiskItem[]>([])

const duplicateStats = reactive<DuplicateStatsData>({
  total_tickets: 0,
  duplicate_count: 0,
  duplicate_rate: 0,
  top_duplicate_originals: []
})

const priorityLabelMap: Record<string, string> = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低'
}

const priorityColorMap: Record<string, string> = {
  urgent: '#f0a020',
  high: '#d03050',
  medium: '#2080f0',
  low: '#86909c'
}

const riskLabelMap: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '严重风险'
}

const riskColorMap: Record<string, string> = {
  low: '#18a058',
  medium: '#2080f0',
  high: '#f0a020',
  critical: '#d03050'
}

const responseTimeOption = computed(() => {
  const dates = responseTimeData.value.map(item => dayjs(item.date).format('MM-DD'))
  const responseHours = responseTimeData.value.map(item =>
    item.avg_response_seconds ? +(item.avg_response_seconds / 3600).toFixed(2) : null
  )
  const resolutionHours = responseTimeData.value.map(item =>
    item.avg_resolution_seconds ? +(item.avg_resolution_seconds / 3600).toFixed(2) : null
  )

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any[]) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((param: any) => {
          if (param.value !== null && param.value !== undefined) {
            result += `${param.marker}${param.seriesName}: ${param.value} 小时<br/>`
          }
        })
        return result
      }
    },
    legend: {
      data: ['平均响应时长', '平均解决时长'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '40px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        rotate: 45,
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      name: '小时',
      axisLabel: {
        formatter: '{value} h'
      }
    },
    series: [
      {
        name: '平均响应时长',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#2080f0'
        },
        lineStyle: {
          width: 3
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(32, 128, 240, 0.3)' },
              { offset: 1, color: 'rgba(32, 128, 240, 0.02)' }
            ]
          }
        },
        data: responseHours
      },
      {
        name: '平均解决时长',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: {
          color: '#18a058'
        },
        lineStyle: {
          width: 3
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 160, 88, 0.3)' },
              { offset: 1, color: 'rgba(24, 160, 88, 0.02)' }
            ]
          }
        },
        data: resolutionHours
      }
    ]
  }
})

const priorityOption = computed(() => {
  const data = priorityData.value.map(item => ({
    name: priorityLabelMap[item.priority] || item.priority,
    value: item.count,
    itemStyle: {
      color: priorityColorMap[item.priority] || '#86909c'
    }
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center'
    },
    series: [
      {
        name: '优先级',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{c}张 ({d}%)'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: true
        },
        data
      }
    ]
  }
})

const riskOption = computed(() => {
  const data = riskData.value.map(item => ({
    name: riskLabelMap[item.risk_level] || item.risk_level,
    value: item.count,
    itemStyle: {
      color: riskColorMap[item.risk_level] || '#86909c'
    }
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center'
    },
    series: [
      {
        name: '风险等级',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{c}个 ({d}%)'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: true
        },
        data
      }
    ]
  }
})

const categoryOption = computed(() => {
  const categories = categoryData.value.map(item => item.category)
  const counts = categoryData.value.map(item => item.count)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}: {c} 张'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        rotate: 30,
        fontSize: 11,
        interval: 0
      }
    },
    yAxis: {
      type: 'value',
      name: '工单数'
    },
    series: [
      {
        name: '工单数',
        type: 'bar',
        barWidth: '50%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#2080f0' },
              { offset: 1, color: '#6fb1ff' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          fontSize: 12,
          color: '#4e5969'
        },
        data: counts
      }
    ]
  }
})

const agentColumns: DataTableColumns<AgentItem> = [
  {
    title: '排名',
    key: 'rank',
    width: 80,
    render: (_row, index) => {
      const rank = index + 1
      let color = '#4e5969'
      let bg = 'transparent'
      if (rank === 1) { color = '#fff'; bg = '#f0a020' }
      else if (rank === 2) { color = '#fff'; bg = '#86909c' }
      else if (rank === 3) { color = '#fff'; bg = '#c97c5d' }
      return h(
        'div',
        {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: bg,
            color,
            fontWeight: 600,
            fontSize: rank <= 3 ? '14px' : '12px'
          }
        },
        rank
      )
    }
  },
  {
    title: '姓名',
    key: 'name',
    render: (row) => h(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
      [
        h(
          'div',
          {
            style: {
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2080f0, #6fb1ff)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 600
            }
          },
          (row.full_name || row.username).charAt(0).toUpperCase()
        ),
        h(
          'span',
          { style: { fontWeight: 500 } },
          row.full_name || row.username
        )
      ]
    )
  },
  {
    title: '分配工单数',
    key: 'total_assigned',
    width: 140,
    render: (row) => h(
      'n-tag',
      { type: row.total_assigned > 0 ? 'info' : 'default', size: 'small' },
      () => `${row.total_assigned} 张`
    )
  },
  {
    title: '平均响应时长',
    key: 'avg_response',
    width: 160,
    render: (row) => h(
      'span',
      { style: { color: '#2080f0', fontWeight: 500 } },
      formatSeconds(row.avg_response_seconds)
    )
  },
  {
    title: '平均解决时长',
    key: 'avg_resolution',
    width: 160,
    render: (row) => h(
      'span',
      { style: { color: '#18a058', fontWeight: 500 } },
      formatSeconds(row.avg_resolution_seconds)
    )
  }
]

const duplicateColumns: DataTableColumns<DuplicateOriginal> = [
  {
    title: '排名',
    key: 'rank',
    width: 80,
    render: (_row, index) => {
      const rank = index + 1
      let color = '#4e5969'
      let bg = 'transparent'
      if (rank === 1) { color = '#fff'; bg = '#d03050' }
      else if (rank === 2) { color = '#fff'; bg = '#f0a020' }
      else if (rank === 3) { color = '#fff'; bg = '#2080f0' }
      return h(
        'div',
        {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: bg,
            color,
            fontWeight: 600,
            fontSize: rank <= 3 ? '14px' : '12px'
          }
        },
        rank
      )
    }
  },
  {
    title: '原始工单',
    key: 'ticket',
    render: (row) => h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
      [
        h(
          'a',
          {
            style: {
              color: '#2080f0',
              cursor: 'pointer',
              fontWeight: 500,
              textDecoration: 'none'
            },
            onClick: () => router.push(`/tickets/${row.original_ticket_id}`)
          },
          `#${row.original_ticket_id} ${row.original_title || '(无标题)'}`
        ),
        h(
          'span',
          { style: { fontSize: '12px', color: '#86909c' } },
          `被重复引用 ${row.duplicate_count} 次`
        )
      ]
    )
  },
  {
    title: '重复次数',
    key: 'duplicate_count',
    width: 140,
    render: (row) => h(
      'n-tag',
      {
        type: row.duplicate_count >= 5 ? 'error' : row.duplicate_count >= 3 ? 'warning' : 'info',
        size: 'small',
        round: ''
      },
      () => `${row.duplicate_count} 次`
    )
  }
]

const formatSeconds = (seconds: number | null) => {
  if (!seconds || seconds <= 0) return '--'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}小时${minutes}分`
  }
  return `${minutes}分钟`
}

const formatRating = (rating: number | null) => {
  if (!rating) return '--'
  return `${rating.toFixed(1)} 分`
}

const fetchOverview = async () => {
  try {
    const res = await get<OverviewData>('/stats/overview')
    Object.assign(overview, res)
  } catch (e: any) {
    if (e.message !== 'Unauthorized') {
      message.error(e.message || '获取总览统计失败')
    }
  }
}

const fetchResponseTimeTrend = async () => {
  try {
    const res = await get<{ data: ResponseTimeItem[]; days: number }>('/stats/response-time-trend?days=30')
    responseTimeData.value = res.data || []
  } catch (e: any) {
    if (e.message !== 'Unauthorized') {
      message.error(e.message || '获取响应时长趋势失败')
    }
  }
}

const fetchPriorityDistribution = async () => {
  try {
    const res = await get<{ data: PriorityItem[] }>('/stats/priority-distribution')
    priorityData.value = res.data || []
  } catch (e: any) {
    if (e.message !== 'Unauthorized') {
      message.error(e.message || '获取优先级分布失败')
    }
  }
}

const fetchCategoryDistribution = async () => {
  try {
    const res = await get<{ data: CategoryItem[] }>('/stats/category-distribution')
    categoryData.value = res.data || []
  } catch (e: any) {
    if (e.message !== 'Unauthorized') {
      message.error(e.message || '获取分类分布失败')
    }
  }
}

const fetchAgentPerformance = async () => {
  try {
    const res = await get<{ data: AgentItem[] }>('/stats/agent-performance')
    agentPerformance.value = (res.data || []).sort((a, b) => b.total_assigned - a.total_assigned)
  } catch (e: any) {
    if (e.message !== 'Unauthorized') {
      message.error(e.message || '获取客服绩效失败')
    }
  }
}

const fetchRiskDistribution = async () => {
  try {
    const res = await get<{ data: RiskItem[] }>('/stats/risk-distribution')
    riskData.value = res.data || []
  } catch (e: any) {
    if (e.message !== 'Unauthorized') {
      message.error(e.message || '获取风险分布失败')
    }
  }
}

const fetchDuplicateTickets = async () => {
  try {
    const res = await get<DuplicateStatsData>('/stats/duplicate-tickets')
    Object.assign(duplicateStats, res)
  } catch (e: any) {
    if (e.message !== 'Unauthorized') {
      message.error(e.message || '获取重复工单统计失败')
    }
  }
}

const loadAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchOverview(),
      fetchResponseTimeTrend(),
      fetchPriorityDistribution(),
      fetchCategoryDistribution(),
      fetchAgentPerformance(),
      fetchRiskDistribution(),
      fetchDuplicateTickets()
    ])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  auth.restoreAuth()
  if (!auth.canViewStats) {
    router.push('/')
    return
  }
  loadAllData()
})
</script>

<style scoped lang="scss">
.stats-page {
  padding: 20px;
}

.overview-section {
  margin-bottom: 16px;
}

.stat-card {
  :deep(.n-card__content) {
    padding: 16px;
  }

  .stat-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    background: #f2f3f5;
    flex-shrink: 0;
  }

  .stat-info {
    flex: 1;
    min-width: 0;
  }

  .stat-label {
    font-size: 13px;
    color: #86909c;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #1d2129;
    line-height: 1.2;
  }
}

.stat-total .stat-icon {
  background: #e8f3ff;
}

.stat-pending .stat-icon {
  background: #fff7e8;
}

.stat-processing .stat-icon {
  background: #e8fffb;
}

.stat-resolved .stat-icon {
  background: #e8ffea;
}

.stat-response .stat-icon {
  background: #fff0f0;
}

.stat-overdue .stat-icon {
  background: #fff3e8;
}

.stat-duplicate .stat-icon {
  background: #f3e8ff;
}

.stat-rating .stat-icon {
  background: #fffbe8;
}

.stat-duplicate-card .stat-icon {
  background: #fff0f6;
}

.stat-rate-card .stat-icon {
  background: #e6fffb;
}

.chart-card {
  margin-bottom: 16px;

  :deep(.n-card__content) {
    padding-top: 12px;
  }
}

.chart {
  width: 100%;
  height: 360px;
}

.charts-grid {
  margin-bottom: 0;
}

.duplicate-section {
  margin-bottom: 16px;
}

:deep(.n-data-table) {
  font-size: 13px;
}
</style>
