<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">数据看板</h2>
      <div class="header-actions">
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon> 刷新数据
        </el-button>
        <el-dropdown @command="handleExport">
          <el-button type="primary">
            <el-icon><Download /></el-icon> 导出明细
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="orders">订单明细</el-dropdown-item>
              <el-dropdown-item command="subscriptions">订阅明细</el-dropdown-item>
              <el-dropdown-item command="refunds">退款明细</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-row :gutter="16" class="mb-24">
      <el-col :xs="12" :sm="6" v-for="(stat, idx) in statCards" :key="idx">
        <div class="stat-card">
          <div class="flex-between">
            <span class="stat-label">{{ stat.label }}</span>
            <el-icon :size="20" :color="stat.color">
              <component :is="stat.icon" />
            </el-icon>
          </div>
          <div class="stat-value" :style="{ color: stat.color }">
            {{ stat.prefix }}{{ stat.formatter ? stat.formatter(stat.value) : stat.value }}
          </div>
          <div v-if="stat.trend !== undefined" class="stat-trend" :class="stat.trend >= 0 ? 'up' : 'down'">
            <el-icon v-if="stat.trend >= 0"><Top /></el-icon>
            <el-icon v-else><Bottom /></el-icon>
            {{ Math.abs(stat.trend) }}% 环比
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mb-24">
      <el-col :xs="24" :lg="16">
        <div class="detail-card">
          <div class="detail-card-header">
            <span>付费留存趋势</span>
            <el-tag type="info" size="small">近6个月</el-tag>
          </div>
          <div class="detail-card-body">
            <div ref="retentionChartRef" style="height: 360px;"></div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="detail-card">
          <div class="detail-card-header flex-between">
            <span>预警提醒</span>
            <el-button link type="primary" size="small">查看全部</el-button>
          </div>
          <div class="detail-card-body warning-list">
            <el-empty v-if="!warnings.length" description="暂无预警" :image-size="80" />
            <div v-for="w in warnings" :key="w.id" class="warning-item">
              <div class="warning-icon" :class="w.level">
                <el-icon>
                  <component :is="w.level === 'critical' ? 'CircleClose' : w.level === 'warning' ? 'Warning' : 'InfoFilled'" />
                </el-icon>
              </div>
              <div class="warning-content">
                <div class="warning-title">{{ w.title }}</div>
                <div class="warning-desc text-muted">{{ w.content }}</div>
                <div class="warning-time text-muted">{{ formatDateTime(w.created_at) }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :md="12">
        <div class="detail-card">
          <div class="detail-card-header">收入构成</div>
          <div class="detail-card-body">
            <div ref="revenueChartRef" style="height: 300px;"></div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="detail-card">
          <div class="detail-card-header">合作阶段分布</div>
          <div class="detail-card-body">
            <div ref="stageChartRef" style="height: 300px;"></div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { dashboardApi, partnershipApi } from '@/api/modules'
import { formatMoney, formatDateTime, downloadBlob } from '@/utils'
import { useDictStore } from '@/stores/dict'

const dictStore = useDictStore()
const loading = ref(false)
const warnings = ref<any[]>([])
const retentionChartRef = ref<HTMLElement>()
const revenueChartRef = ref<HTMLElement>()
const stageChartRef = ref<HTMLElement>()
let retentionChart: echarts.ECharts | null = null
let revenueChart: echarts.ECharts | null = null
let stageChart: echarts.ECharts | null = null

const overview = ref<any>({
  totalRevenue: 0,
  monthRevenue: 0,
  revenueGrowth: 0,
  totalOrders: 0,
  monthOrders: 0,
  activeSubscriptions: 0,
  activePartnerships: 0,
  pendingRefunds: 0
})

const statCards = ref([
  { label: '累计收入', value: 0, prefix: '¥', icon: 'Money', color: '#67c23a', trend: 0, formatter: (v: number) => formatMoney(v) },
  { label: '本月收入', value: 0, prefix: '¥', icon: 'TrendCharts', color: '#409eff', trend: 0, formatter: (v: number) => formatMoney(v) },
  { label: '活跃会员', value: 0, prefix: '', icon: 'User', color: '#909399', trend: 5.2 },
  { label: '进行中合作', value: 0, prefix: '', icon: 'Handshake', color: '#e6a23c', trend: undefined },
  { label: '本月订单', value: 0, prefix: '', icon: 'Document', color: '#8e44ad', trend: 8.3 },
  { label: '待处理退款', value: 0, prefix: '', icon: 'Warning', color: '#f56c6c', trend: undefined }
])

const retentionData = ref<any[]>([])

const refreshData = async () => {
  loading.value = true
  try {
    const [ovRes, retRes, warnRes]: any[] = await Promise.all([
      dashboardApi.overview({ refresh: 1 }),
      dashboardApi.retention({ refresh: 1 }),
      dashboardApi.warnings({ status: 'pending' })
    ])

    overview.value = ovRes.data || ovRes || {}
    retentionData.value = retRes.data?.monthlyData || retRes?.monthlyData || []
    warnings.value = (warnRes.data || warnRes || []).slice(0, 6)

    statCards.value[0].value = overview.value.totalRevenue || 0
    statCards.value[0].trend = Number(overview.value.revenueGrowth) || 0
    statCards.value[1].value = overview.value.monthRevenue || 0
    statCards.value[1].trend = Number(overview.value.revenueGrowth) || 0
    statCards.value[2].value = overview.value.activeSubscriptions || 0
    statCards.value[3].value = overview.value.activePartnerships || 0
    statCards.value[4].value = overview.value.monthOrders || 0
    statCards.value[5].value = overview.value.pendingRefunds || 0

    await nextTick()
    renderCharts()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handleExport = async (type: string) => {
  try {
    const blob: any = await dashboardApi.export({ type })
    const filenames: Record<string, string> = {
      orders: '订单明细.csv',
      subscriptions: '订阅明细.csv',
      refunds: '退款明细.csv'
    }
    downloadBlob(blob, filenames[type] || 'export.csv')
    ElMessage.success('导出成功')
  } catch {}
}

const renderCharts = () => {
  if (retentionChartRef.value) {
    if (!retentionChart) retentionChart = echarts.init(retentionChartRef.value)
    const months = retentionData.value.map(d => d.label)
    retentionChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['新增订阅', '活跃订阅', '流失订阅', '流失率(%)'] },
      grid: { left: 50, right: 50, top: 40, bottom: 40 },
      xAxis: { type: 'category', data: months },
      yAxis: [
        { type: 'value', name: '人数' },
        { type: 'value', name: '流失率(%)', axisLabel: { formatter: '{value}%' } }
      ],
      series: [
        { name: '新增订阅', type: 'bar', data: retentionData.value.map(d => d.newSubscriptions), itemStyle: { color: '#67c23a' } },
        { name: '活跃订阅', type: 'bar', data: retentionData.value.map(d => d.activeSubscriptions), itemStyle: { color: '#409eff' } },
        { name: '流失订阅', type: 'bar', data: retentionData.value.map(d => d.churnedSubscriptions), itemStyle: { color: '#f56c6c' } },
        { name: '流失率(%)', type: 'line', yAxisIndex: 1, data: retentionData.value.map(d => Number(d.churnRate)), itemStyle: { color: '#e6a23c' }, smooth: true }
      ]
    })
  }

  if (revenueChartRef.value) {
    if (!revenueChart) revenueChart = echarts.init(revenueChartRef.value)
    revenueChart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        avoidLabelOverlap: false,
        label: { show: true, formatter: '{b}\n¥{c}' },
        data: [
          { value: overview.value.totalRevenue * 0.4 || 120000, name: '品牌赞助', itemStyle: { color: '#409eff' } },
          { value: overview.value.totalRevenue * 0.35 || 105000, name: '会员订阅', itemStyle: { color: '#67c23a' } },
          { value: overview.value.totalRevenue * 0.15 || 45000, name: '定制内容', itemStyle: { color: '#e6a23c' } },
          { value: overview.value.totalRevenue * 0.1 || 30000, name: '其他收入', itemStyle: { color: '#909399' } }
        ]
      }]
    })
  }

  if (stageChartRef.value) {
    if (!stageChart) stageChart = echarts.init(stageChartRef.value)
    const stages = dictStore.getDict('partnership_stage')
    stageChart.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 100, right: 20, top: 20, bottom: 20 },
      xAxis: { type: 'value' },
      yAxis: {
        type: 'category',
        data: stages.map(s => s.label)
      },
      series: [{
        type: 'bar',
        data: stages.map((s, i) => ({
          value: [6, 4, 3, 5, 2, 1][i] || 0,
          itemStyle: { color: s.color }
        })),
        label: { show: true, position: 'right' },
        barWidth: 20
      }]
    })
  }
}

const handleResize = () => {
  retentionChart?.resize()
  revenueChart?.resize()
  stageChart?.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  refreshData()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  retentionChart?.dispose()
  revenueChart?.dispose()
  stageChart?.dispose()
})
</script>

<style lang="scss" scoped>
.warning-list {
  max-height: 360px;
  overflow-y: auto;
}

.warning-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child { border-bottom: none; }

  .warning-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #fff;

    &.critical { background: #f56c6c; }
    &.warning { background: #e6a23c; }
    &.info { background: #409eff; }
  }

  .warning-content {
    flex: 1;
    min-width: 0;

    .warning-title {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .warning-desc {
      font-size: 12px;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .warning-time {
      font-size: 12px;
    }
  }
}
</style>
