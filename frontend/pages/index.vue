<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h2 class="page-title">仪表盘概览</h2>
        <div style="color: #86909c; font-size: 13px; margin-top: 4px">
          {{ today }} | 欢迎回来，{{ auth.user?.full_name }}
        </div>
      </div>
      <n-space>
        <n-button @click="loadData" :loading="loading">刷新数据</n-button>
      </n-space>
    </div>

    <div class="dashboard-grid">
      <div class="stat-card" @click="navigateTo('/medicines')" style="cursor: pointer">
        <div style="display: flex; justify-content: space-between; align-items: start">
          <div>
            <div class="stat-value">{{ stats.total_medicines || 0 }}</div>
            <div class="stat-label">药品品规数</div>
          </div>
          <n-tag type="info" round>SKU</n-tag>
        </div>
      </div>
      <div class="stat-card" @click="navigateTo('/batches')" style="cursor: pointer">
        <div style="display: flex; justify-content: space-between; align-items: start">
          <div>
            <div class="stat-value">{{ stats.total_batches || 0 }}</div>
            <div class="stat-label">在库批次数</div>
          </div>
          <n-tag type="success" round>库存中</n-tag>
        </div>
      </div>
      <div class="stat-card">
        <div style="display: flex; justify-content: space-between; align-items: start">
          <div>
            <div class="stat-value">¥{{ formatMoney(stats.total_stock_value || 0) }}</div>
            <div class="stat-label">库存总金额</div>
          </div>
          <n-tag type="warning" round>资产</n-tag>
        </div>
      </div>
      <div class="stat-card critical" @click="navigateTo('/reminders')" style="cursor: pointer">
        <div style="display: flex; justify-content: space-between; align-items: start">
          <div>
            <div class="stat-value">{{ stats.near_expiry_count || 0 }}</div>
            <div class="stat-label">近效期批次(90天内)</div>
          </div>
          <n-tag type="error" round>需关注</n-tag>
        </div>
      </div>
      <div class="stat-card high" @click="navigateTo('/risks')" style="cursor: pointer">
        <div style="display: flex; justify-content: space-between; align-items: start">
          <div>
            <div class="stat-value">{{ stats.low_stock_count || 0 }}</div>
            <div class="stat-label">低库存药品数</div>
          </div>
          <n-tag type="warning" round>请补货</n-tag>
        </div>
      </div>
      <div class="stat-card" @click="navigateTo('/reminders')" style="cursor: pointer">
        <div style="display: flex; justify-content: space-between; align-items: start">
          <div>
            <div class="stat-value">{{ stats.pending_reminders || 0 }}</div>
            <div class="stat-label">待处理效期提醒</div>
          </div>
          <n-tag type="info" round>待办</n-tag>
        </div>
      </div>
      <div class="stat-card" @click="navigateTo('/risks')" style="cursor: pointer">
        <div style="display: flex; justify-content: space-between; align-items: start">
          <div>
            <div class="stat-value">{{ stats.pending_risk || 0 }}</div>
            <div class="stat-label">待处理缺货风险</div>
          </div>
          <n-tag type="warning" round>待办</n-tag>
        </div>
      </div>
      <div class="stat-card critical" @click="navigateTo('/abnormal')" style="cursor: pointer">
        <div style="display: flex; justify-content: space-between; align-items: start">
          <div>
            <div class="stat-value">{{ stats.abnormal_count || 0 }}</div>
            <div class="stat-label">进行中异常记录</div>
          </div>
          <n-tag type="error" round>紧急</n-tag>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">7天出入库趋势</div>
        <div ref="trendChartRef" style="height: 300px"></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">近期待办事项</div>
        <n-list bordered>
          <n-list-item v-for="reminder in recentReminders" :key="reminder.id">
            <n-space justify="space-between" style="width: 100%">
              <n-space>
                <n-tag :type="levelTagType(reminder.reminder_level)" size="small">
                  {{ levelText(reminder.reminder_level) }}
                </n-tag>
                <span style="font-size: 14px">
                  批次号: {{ reminder.batch?.batch_no }} | 
                  {{ reminder.batch?.medicine?.name }}
                </span>
              </n-space>
              <n-button text type="primary" size="small" @click="navigateTo('/reminders')">
                效期还剩{{ reminder.days_to_expiry }}天
              </n-button>
            </n-space>
          </n-list-item>
          <n-list-item v-if="recentReminders.length === 0">
            <span style="color: #86909c">暂无待办事项</span>
          </n-list-item>
        </n-list>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">紧急补货建议</div>
        <n-data-table
          :columns="replenishColumns"
          :data="urgentReplenish"
          :pagination="false"
          size="small"
          striped
        />
      </div>
      <div class="chart-card">
        <div class="chart-title">近期异常记录</div>
        <n-data-table
          :columns="abnormalColumns"
          :data="recentAbnormal"
          :pagination="false"
          size="small"
          striped
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  NSpace,
  NButton,
  NTag,
  NList,
  NListItem,
  NDataTable,
  useMessage
} from 'naive-ui'
import dayjs from 'dayjs'
import { useAuthStore } from '~/stores/auth'
import { apiClient } from '~/utils/api'

const message = useMessage()
const auth = useAuthStore()
const loading = ref(false)
const stats = ref<any>({})
const trends = ref<any>({ dates: [], inbound: [], outbound: [] })
const recentReminders = ref<any[]>([])
const urgentReplenish = ref<any[]>([])
const recentAbnormal = ref<any[]>([])

const today = computed(() => dayjs().format('YYYY年MM月DD日 dddd'))

const replenishColumns = [
  { title: '药品名称', key: 'medicine_name' },
  { title: '当前库存', key: 'current_stock' },
  { title: '建议补货', key: 'suggested_quantity' },
  { title: '优先级', key: 'priority', render: (row: any) => h(NTag, { type: levelTagType(row.priority) }, () => levelText(row.priority)) }
]

const abnormalColumns = [
  { title: '异常类型', key: 'abnormal_type' },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  { title: '状态', key: 'status' },
  { title: '时长(分)', key: 'handle_duration_minutes' }
]

function levelTagType(level: string) {
  const m: Record<string, any> = { critical: 'error', high: 'warning', medium: 'info', low: 'success' }
  return m[level] || 'default'
}
function levelText(level: string) {
  const m: Record<string, string> = { critical: '紧急', high: '高', medium: '中', low: '低' }
  return m[level] || level
}
function formatMoney(v: number) {
  return (v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function loadData() {
  loading.value = true
  try {
    const [s, t, r, rep, ab] = await Promise.all([
      apiClient.get<any>('/dashboard'),
      apiClient.get<any>('/dashboard/trends'),
      apiClient.get<any>('/reminders', { page: 1, page_size: 5, status: 'pending' }),
      apiClient.get<any>('/replenish', { page: 1, page_size: 5, status: 'pending' }),
      apiClient.get<any>('/abnormal', { page: 1, page_size: 5 })
    ])
    stats.value = s
    trends.value = t
    recentReminders.value = r?.items || []
    urgentReplenish.value = (rep?.items || []).map((x: any) => ({
      id: x.id,
      medicine_name: x.medicine?.name || '',
      current_stock: x.current_stock,
      suggested_quantity: x.suggested_quantity,
      priority: x.priority
    }))
    recentAbnormal.value = (ab?.items || []).map((x: any) => ({
      id: x.id,
      abnormal_type: x.abnormal_type,
      description: x.description,
      status: x.status,
      handle_duration_minutes: x.handle_duration_minutes || '-'
    }))
    setTimeout(renderChart, 100)
  } catch (e: any) {
    message.error(e?.detail || '加载失败')
  } finally {
    loading.value = false
  }
}

const trendChartRef = ref<HTMLElement | null>(null)
function renderChart() {
  if (!trendChartRef.value) return
  import('echarts').then(({ default: echarts }) => {
    const chart = echarts.init(trendChartRef.value!)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['入库量', '出库量'] },
      grid: { left: 40, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: trends.value.dates || [] },
      yAxis: { type: 'value' },
      series: [
        { name: '入库量', type: 'bar', data: trends.value.inbound || [], itemStyle: { color: '#18a058' } },
        { name: '出库量', type: 'bar', data: trends.value.outbound || [], itemStyle: { color: '#2080f0' } }
      ]
    })
    window.addEventListener('resize', () => chart.resize())
  })
}

import { h } from 'vue'
onMounted(async () => {
  auth.init()
  if (!auth.isLoggedIn) return navigateTo('/login')
  await loadData()
})
definePageMeta({ layout: 'default' })
</script>
