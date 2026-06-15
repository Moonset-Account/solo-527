<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button class="p-2 rounded-lg hover:bg-slate-100 text-slate-500" @click="goBack">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-slate-800">{{ fluctuation?.title || '异常详情' }}</h1>
            <span class="badge" :class="'badge-' + getPriorityBadge(fluctuation?.priority || 'medium')">
              {{ getPriorityText(fluctuation?.priority || 'medium') }}优先级
            </span>
            <span class="badge" :class="'badge-' + getStatusBadge(fluctuation?.status || 'pending')">
              {{ getStatusText(fluctuation?.status || 'pending') }}
            </span>
          </div>
          <p class="text-slate-500 mt-1">
            发现于 {{ formatDateTime(fluctuation?.detectedAt || '') }}
            <span v-if="fluctuation?.source"> · 来源：{{ getSourceText(fluctuation.source) }}</span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button v-if="fluctuation?.status === 'pending'" class="btn-primary" @click="startProcess">
          开始处理
        </button>
        <button v-if="fluctuation?.status === 'processing'" class="btn-success" @click="showCloseModal = true">
          关闭异常
        </button>
        <button class="btn-secondary flex items-center gap-1.5">
          <Share2 class="w-4 h-4" />
          转发
        </button>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">异常描述</h2>
          <p class="text-slate-600 mb-4">{{ fluctuation?.description }}</p>
          
          <div class="p-4 bg-warning-50 rounded-xl border border-warning-100">
            <div class="flex items-start gap-3">
              <AlertTriangle class="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-warning-800 mb-1">可读原因</p>
                <p class="text-sm text-warning-700">{{ fluctuation?.readableReason }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">数据指标</h2>
          <div class="grid grid-cols-3 gap-4">
            <div class="p-4 bg-slate-50 rounded-lg">
              <p class="text-xs text-slate-500 mb-1">当前值</p>
              <p class="text-xl font-bold text-slate-800 font-mono">
                {{ fluctuation?.currentValue !== undefined ? formatNumber(fluctuation.currentValue) : '-' }}
              </p>
            </div>
            <div class="p-4 bg-slate-50 rounded-lg">
              <p class="text-xs text-slate-500 mb-1">预期值</p>
              <p class="text-xl font-bold text-slate-600 font-mono">
                {{ fluctuation?.expectedValue !== undefined ? formatNumber(fluctuation.expectedValue) : '-' }}
              </p>
            </div>
            <div class="p-4 rounded-lg" :class="(fluctuation?.deviation || 0) < 0 ? 'bg-danger-50' : 'bg-success-50'">
              <p class="text-xs text-slate-500 mb-1">偏差</p>
              <p class="text-xl font-bold font-mono" :class="(fluctuation?.deviation || 0) < 0 ? 'text-danger-600' : 'text-success-600'">
                {{ fluctuation?.deviation !== undefined ? (fluctuation.deviation > 0 ? '+' : '') + fluctuation.deviation + '%' : '-' }}
              </p>
            </div>
          </div>

          <div v-if="fluctuation?.metric" class="mt-6">
            <h3 class="text-sm font-medium text-slate-700 mb-3">趋势图</h3>
            <div ref="trendChartRef" class="h-48"></div>
          </div>
        </div>

        <div class="card p-6">
          <h2 class="text-lg font-semibold text-slate-800 mb-4">处理记录</h2>
          <div class="relative">
            <div class="absolute left-4 top-0 bottom-0 w-px bg-slate-200"></div>
            <div class="space-y-6">
              <div v-for="log in fluctuationLogs" :key="log.id" class="relative pl-10">
                <div 
                  class="absolute left-2 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
                  :class="getLogDotClass(log.action)"
                >
                  <component :is="getLogIcon(log.action)" class="w-2.5 h-2.5 text-white" />
                </div>
                <div class="bg-slate-50 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-medium text-slate-800">{{ getLogActionText(log.action) }}</span>
                      <span class="text-xs text-slate-500">{{ log.operatorName || '系统' }}</span>
                    </div>
                    <span class="text-xs text-slate-400">{{ formatDateTime(log.createdAt) }}</span>
                  </div>
                  <p v-if="log.remark" class="text-sm text-slate-600">{{ log.remark }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="fluctuation?.status !== 'closed'" class="mt-6 pt-4 border-t border-slate-100">
            <div class="flex gap-3">
              <input
                v-model="newRemark"
                type="text"
                placeholder="添加备注..."
                class="input flex-1"
                @keyup.enter="addRemark"
              />
              <button class="btn-primary" @click="addRemark">提交</button>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card p-5">
          <h3 class="text-base font-semibold text-slate-800 mb-4">处理信息</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between py-2 border-b border-slate-100">
              <span class="text-sm text-slate-500">负责人</span>
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs">
                  {{ fluctuation?.assigneeName?.charAt(0) || '?' }}
                </div>
                <span class="text-sm font-medium text-slate-700">{{ fluctuation?.assigneeName || '未分配' }}</span>
              </div>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-slate-100">
              <span class="text-sm text-slate-500">截止时间</span>
              <span class="text-sm font-medium" :class="isOverdue ? 'text-danger-600' : 'text-slate-700'">
                {{ formatDeadline(fluctuation?.deadline) }}
                <span v-if="isOverdue" class="ml-1 text-xs">(已逾期)</span>
              </span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-slate-100">
              <span class="text-sm text-slate-500">已处理时长</span>
              <span class="text-sm text-slate-700 font-mono">{{ processingDuration }}</span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-slate-500">关联待办</span>
              <span class="text-sm text-primary-500 cursor-pointer hover:underline">查看待办</span>
            </div>
          </div>
        </div>

        <div v-if="fluctuation?.status === 'closed' && fluctuation.resolution" class="card p-5">
          <div class="flex items-center gap-2 mb-3">
            <CheckCircle class="w-5 h-5 text-success-500" />
            <h3 class="text-base font-semibold text-success-700">已关闭</h3>
          </div>
          <p class="text-sm text-slate-600">{{ fluctuation.resolution }}</p>
          <p class="text-xs text-slate-400 mt-3">
            关闭时间：{{ formatDateTime(fluctuation.closedAt || '') }}
          </p>
        </div>

        <div class="card p-5">
          <h3 class="text-base font-semibold text-slate-800 mb-4">同步信息</h3>
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-success-50 flex items-center justify-center">
                <FileBarChart class="w-4 h-4 text-success-600" />
              </div>
              <div>
                <p class="text-sm text-slate-700">月度复盘报表</p>
                <p class="text-xs text-slate-500">已同步，月底自动汇总</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                <Todo class="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p class="text-sm text-slate-700">负责人待办</p>
                <p class="text-xs text-slate-500">已同步至个人待办列表</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-warning-50 flex items-center justify-center">
                <Bell class="w-4 h-4 text-warning-600" />
              </div>
              <div>
                <p class="text-sm text-slate-700">消息通知</p>
                <p class="text-xs text-slate-500">站内信 + 邮件已发送</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="fluctuation?.source === 'api_error'" class="card p-5 border-l-4 border-l-danger-500">
          <h3 class="text-base font-semibold text-danger-700 mb-3">接口错误信息</h3>
          <div class="space-y-2 text-sm">
            <p class="text-slate-600">
              <span class="text-slate-500">错误类型：</span>
              <span class="font-medium">供应链接口超时</span>
            </p>
            <p class="text-slate-600">
              <span class="text-slate-500">影响范围：</span>
              <span>库存查询、订单同步</span>
            </p>
            <p class="text-slate-600">
              <span class="text-slate-500">通知对象：</span>
              <span>赵供应（供应链经理）</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCloseModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showCloseModal = false">
      <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-card-lg animate-slide-up">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">关闭异常</h3>
        <p class="text-sm text-slate-600 mb-4">请输入关闭原因，关闭后将同步至月度复盘报表。</p>
        <textarea
          v-model="closeReason"
          class="input h-24 resize-none"
          placeholder="请描述异常原因和处理结果..."
        ></textarea>
        <div class="flex justify-end gap-3 mt-6">
          <button class="btn-secondary" @click="showCloseModal = false">取消</button>
          <button class="btn-primary" @click="confirmClose">确认关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as echarts from 'echarts'
import {
  ArrowLeft, Share2, AlertTriangle, CheckCircle, FileBarChart, Bell,
  Clock, User, Activity, MessageSquare
} from 'lucide-vue-next'
import dayjs from 'dayjs'
import type { Fluctuation, FluctuationLog } from '~/types'
import { formatNumber } from '~/utils/format'

const router = useRouter()
const route = useRoute()

const fluctuation = ref<Fluctuation | null>(null)
const fluctuationLogs = ref<FluctuationLog[]>([])
const showCloseModal = ref(false)
const closeReason = ref('')
const newRemark = ref('')
const trendChartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const isOverdue = computed(() => {
  if (!fluctuation.value?.deadline || fluctuation.value.status === 'closed') return false
  return dayjs(fluctuation.value.deadline).isBefore(dayjs())
})

const processingDuration = computed(() => {
  if (!fluctuation.value?.detectedAt) return '-'
  const start = dayjs(fluctuation.value.detectedAt)
  const end = fluctuation.value.closedAt ? dayjs(fluctuation.value.closedAt) : dayjs()
  const hours = end.diff(start, 'hour')
  if (hours < 24) return `${hours} 小时`
  return `${Math.floor(hours / 24)} 天 ${hours % 24} 小时`
})

const goBack = () => {
  router.push('/alerts')
}

const getPriorityBadge = (priority: string): string => {
  switch (priority) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'success'
    default: return 'secondary'
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

const getSourceText = (source: string): string => {
  switch (source) {
    case 'metric_monitor': return '指标监控'
    case 'api_error': return '接口错误'
    case 'manual': return '手动录入'
    default: return source
  }
}

const getLogDotClass = (action: string): string => {
  switch (action) {
    case 'detected': return 'bg-warning-500'
    case 'assigned': return 'bg-primary-500'
    case 'processing': return 'bg-primary-500'
    case 'comment': return 'bg-slate-400'
    case 'closed': return 'bg-success-500'
    default: return 'bg-slate-400'
  }
}

const getLogIcon = (action: string) => {
  switch (action) {
    case 'detected': return AlertTriangle
    case 'assigned': return User
    case 'processing': return Activity
    case 'comment': return MessageSquare
    case 'closed': return CheckCircle
    default: return MessageSquare
  }
}

const getLogActionText = (action: string): string => {
  switch (action) {
    case 'detected': return '检测到异常'
    case 'assigned': return '指派负责人'
    case 'processing': return '开始处理'
    case 'comment': return '添加备注'
    case 'closed': return '关闭异常'
    default: return action
  }
}

const formatDateTime = (date: string): string => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const formatDeadline = (deadline?: string): string => {
  if (!deadline) return '-'
  return dayjs(deadline).format('YYYY-MM-DD HH:mm')
}

const startProcess = async () => {
  if (!fluctuation.value) return
  try {
    await $fetch(`/api/alerts/fluctuations/${fluctuation.value.id}`, {
      method: 'PATCH',
      body: { status: 'processing' }
    })
    fluctuation.value.status = 'processing'
    fluctuationLogs.value.unshift({
      id: 'log_' + Date.now(),
      fluctuationId: fluctuation.value.id,
      action: 'processing',
      operatorName: '当前用户',
      remark: '开始处理此异常',
      createdAt: new Date().toISOString()
    })
  } catch (e) {
    console.error('Failed to start processing:', e)
  }
}

const confirmClose = async () => {
  if (!fluctuation.value || !closeReason.value) return
  try {
    await $fetch(`/api/alerts/fluctuations/${fluctuation.value.id}/close`, {
      method: 'POST',
      body: { resolution: closeReason.value }
    })
    fluctuation.value.status = 'closed'
    fluctuation.value.closedAt = new Date().toISOString()
    fluctuation.value.resolution = closeReason.value
    showCloseModal.value = false
    closeReason.value = ''
    
    fluctuationLogs.value.unshift({
      id: 'log_' + Date.now(),
      fluctuationId: fluctuation.value.id,
      action: 'closed',
      operatorName: '当前用户',
      remark: closeReason.value,
      createdAt: new Date().toISOString()
    })
  } catch (e) {
    console.error('Failed to close fluctuation:', e)
  }
}

const addRemark = () => {
  if (!newRemark.value || !fluctuation.value) return
  fluctuationLogs.value.push({
    id: 'log_' + Date.now(),
    fluctuationId: fluctuation.value.id,
    action: 'comment',
    operatorName: '当前用户',
    remark: newRemark.value,
    createdAt: new Date().toISOString()
  })
  newRemark.value = ''
}

const initTrendChart = () => {
  if (!trendChartRef.value || !fluctuation.value?.metric) return

  chartInstance = echarts.init(trendChartRef.value)
  
  const days = 30
  const baseValue = fluctuation.value.expectedValue || 100
  const data = []
  
  for (let i = days - 1; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('MM-DD')
    let value = baseValue + (Math.random() - 0.5) * baseValue * 0.1
    if (i < 7) {
      value = value * (fluctuation.value?.deviation ? (1 + fluctuation.value.deviation / 100 * (7 - i) / 7) : 1)
    }
    data.push({ date, value: Math.round(value * 100) / 100 })
  }

  chartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 10, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
      axisLabel: { color: '#94a3b8', fontSize: 10 }
    },
    series: [{
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      showSymbol: false,
      data: data.map(d => d.value),
      lineStyle: { color: '#0F3460', width: 2 },
      itemStyle: { color: '#0F3460' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#0F346030' },
          { offset: 1, color: '#0F346005' }
        ])
      },
      markPoint: {
        data: [{ type: 'min', name: '最低' }]
      }
    }]
  })
}

const fetchData = async () => {
  const id = route.params.id as string
  try {
    const data = await $fetch(`/api/alerts/fluctuations/${id}`)
    const d = data as any
    fluctuation.value = d
    fluctuationLogs.value = d.logs || []
    
    nextTick(() => {
      initTrendChart()
    })
  } catch (e) {
    console.error('Failed to fetch fluctuation detail:', e)
  }
}

onMounted(() => {
  fetchData()
  
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})

definePageMeta({
  layout: 'default'
})
</script>
