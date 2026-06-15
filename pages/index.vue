<template>
  <div class="space-y-6 animate-fade-in">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">经营总览</h1>
        <p class="text-slate-500 mt-1">{{ greeting }}，张总监。今日经营数据一目了然。</p>
      </div>
      <TimeRangeSelector v-model="timeRange" @change="fetchData" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <MetricCard
        title="销售额"
        :value="metrics.salesAmount"
        unit="万元"
        :yoy="metrics.salesAmountYoY"
        :mom="metrics.salesAmountMoM"
        :icon="DollarSign"
        icon-bg-class="bg-primary-50"
        icon-color-class="text-primary-500"
        :trend-data="salesTrend.current"
        :decimals="2"
        class="animate-slide-up animate-stagger-1"
      />
      <MetricCard
        title="订单量"
        :value="metrics.orderCount"
        unit="单"
        :yoy="metrics.orderCountYoY"
        :mom="metrics.orderCountMoM"
        :icon="ShoppingCart"
        icon-bg-class="bg-accent-50"
        icon-color-class="text-accent-500"
        :trend-data="ordersTrend.current"
        :decimals="0"
        class="animate-slide-up animate-stagger-2"
      />
      <MetricCard
        title="客单价"
        :value="metrics.avgOrderValue"
        unit="元"
        :yoy="metrics.avgOrderValueYoY"
        :mom="metrics.avgOrderValueMoM"
        :icon="Tag"
        icon-bg-class="bg-success-50"
        icon-color-class="text-success-600"
        :trend-data="aovTrend.current"
        :decimals="2"
        class="animate-slide-up animate-stagger-3"
      />
      <MetricCard
        title="毛利率"
        :value="metrics.grossMargin"
        unit="%"
        :yoy="metrics.grossMarginYoY"
        :mom="metrics.grossMarginMoM"
        :icon="TrendingUp"
        icon-bg-class="bg-warning-50"
        icon-color-class="text-warning-600"
        :trend-data="marginTrend.current"
        :decimals="1"
        class="animate-slide-up animate-stagger-4"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2">
        <TrendChart
          title="销售趋势分析"
          :data="salesTrend.current"
          :compare-data="salesTrend.previous"
          unit="万元"
          color="#0F3460"
          class="animate-slide-up animate-stagger-5"
        />
      </div>

      <div class="space-y-6">
        <AlertOverview
          title="异常监控"
          :items="fluctuations"
          :pending-count="alertOverview.pendingCount"
          :today-new-count="alertOverview.todayNewCount"
          :high-priority-count="alertOverview.highPriorityCount"
          :avg-processing-hours="alertOverview.avgProcessingHours"
          @select="handleAlertSelect"
          class="animate-slide-up animate-stagger-5"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card p-5 animate-slide-up animate-stagger-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-slate-800">待办事项</h3>
          <span class="text-xs text-slate-500">按负责人分组</span>
        </div>
        <div class="space-y-4">
          <div v-for="group in todoGroups" :key="group.assigneeId" class="border border-slate-100 rounded-xl p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-medium">
                  {{ group.assigneeName.charAt(0) }}
                </div>
                <span class="text-sm font-medium text-slate-700">{{ group.assigneeName }}</span>
              </div>
              <span class="badge badge-warning">{{ group.count }} 项待办</span>
            </div>
            <div class="space-y-2">
              <div
                v-for="item in group.items.slice(0, 3)"
                :key="item.id"
                class="flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <div
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  :class="{
                    'bg-danger-500': item.priority === 'high',
                    'bg-warning-500': item.priority === 'medium',
                    'bg-success-500': item.priority === 'low'
                  }"
                ></div>
                <span class="flex-1 text-slate-600 truncate">{{ item.title }}</span>
                <span class="text-xs text-slate-400 flex-shrink-0">{{ formatTodoDeadline(item.deadline) }}</span>
              </div>
            </div>
            <button v-if="group.items.length > 3" class="w-full mt-2 text-xs text-primary-500 hover:text-primary-600 font-medium">
              查看全部 {{ group.count }} 项
            </button>
          </div>
        </div>
      </div>

      <div class="card p-5 animate-slide-up animate-stagger-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-slate-800">权限申请待审批</h3>
          <button class="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1">
            管理
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
        <div class="space-y-3">
          <div
            v-for="app in pendingApprovals"
            :key="app.id"
            class="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer"
          >
            <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
              <User class="w-5 h-5 text-slate-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-700">{{ app.applicantName }}</p>
              <p class="text-xs text-slate-500 truncate">申请：{{ app.datasetName || app.permissionType }}</p>
            </div>
            <div class="flex gap-2">
              <button class="px-3 py-1.5 text-xs font-medium text-white bg-danger-500 hover:bg-danger-600 rounded-lg transition-colors">
                驳回
              </button>
              <button class="px-3 py-1.5 text-xs font-medium text-white bg-success-500 hover:bg-success-600 rounded-lg transition-colors">
                通过
              </button>
            </div>
          </div>
        </div>
        <div v-if="pendingApprovals.length === 0" class="text-center py-8">
          <CheckCircle class="w-12 h-12 text-success-400 mx-auto mb-2" />
          <p class="text-sm text-slate-500">暂无待审批申请</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  DollarSign, ShoppingCart, Tag, TrendingUp,
  ChevronRight, User, CheckCircle
} from 'lucide-vue-next'
import dayjs from 'dayjs'
import TimeRangeSelector from '~/components/TimeRangeSelector.vue'
import MetricCard from '~/components/MetricCard.vue'
import TrendChart from '~/components/TrendChart.vue'
import AlertOverview from '~/components/AlertOverview.vue'
import type { TimeRange, MetricsOverview, MetricsTrend, Fluctuation, AlertOverview as AlertOverviewType, TodoGroup, PermissionApplication } from '~/types'

const router = useRouter()

const timeRange = ref<TimeRange>('month')
const metrics = reactive<MetricsOverview>({
  salesAmount: 0,
  orderCount: 0,
  avgOrderValue: 0,
  grossMargin: 0,
  salesAmountYoY: 0,
  orderCountYoY: 0,
  avgOrderValueYoY: 0,
  grossMarginYoY: 0,
  salesAmountMoM: 0,
  orderCountMoM: 0,
  avgOrderValueMoM: 0,
  grossMarginMoM: 0
})

const salesTrend = ref<MetricsTrend>({ current: [], previous: [], unit: '万元' })
const ordersTrend = ref<MetricsTrend>({ current: [], unit: '单' })
const aovTrend = ref<MetricsTrend>({ current: [], unit: '元' })
const marginTrend = ref<MetricsTrend>({ current: [], unit: '%' })

const alertOverview = ref<AlertOverviewType>({
  pendingCount: 0,
  todayNewCount: 0,
  highPriorityCount: 0,
  avgProcessingHours: 0
})

const fluctuations = ref<Fluctuation[]>([])
const todoGroups = ref<TodoGroup[]>([])
const pendingApprovals = ref<PermissionApplication[]>([])

const greeting = computed(() => {
  const hour = dayjs().hour()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const fetchData = async () => {
  try {
    const [overviewData, alertData, fluctuationsData, todosData, approvalsData] = await Promise.all([
      $fetch('/api/metrics/overview', { params: { timeRange: timeRange.value } }),
      $fetch('/api/alerts/overview'),
      $fetch('/api/alerts/fluctuations', { params: { status: 'pending' } }),
      $fetch('/api/todos'),
      $fetch('/api/permissions/applications', { params: { status: 'pending' } })
    ])

    Object.assign(metrics, overviewData)
    alertOverview.value = alertData as AlertOverviewType
    fluctuations.value = (fluctuationsData as any).items || []
    todoGroups.value = todosData as TodoGroup[]
    pendingApprovals.value = (approvalsData as any).items || []
  } catch (e) {
    console.error('Failed to fetch data:', e)
  }
}

const fetchTrendData = async () => {
  try {
    const [sales, orders, aov, margin] = await Promise.all([
      $fetch('/api/metrics/trend', { params: { metric: 'sales_amount', timeRange: timeRange.value } }),
      $fetch('/api/metrics/trend', { params: { metric: 'order_count', timeRange: timeRange.value } }),
      $fetch('/api/metrics/trend', { params: { metric: 'avg_order_value', timeRange: timeRange.value } }),
      $fetch('/api/metrics/trend', { params: { metric: 'gross_margin', timeRange: timeRange.value } })
    ])

    salesTrend.value = sales as MetricsTrend
    ordersTrend.value = orders as MetricsTrend
    aovTrend.value = aov as MetricsTrend
    marginTrend.value = margin as MetricsTrend
  } catch (e) {
    console.error('Failed to fetch trend data:', e)
  }
}

const handleAlertSelect = (item: Fluctuation) => {
  router.push(`/alerts/fluctuations/${item.id}`)
}

const formatTodoDeadline = (deadline?: string): string => {
  if (!deadline) return '-'
  const d = dayjs(deadline)
  if (d.isSame(dayjs(), 'day')) return '今天'
  if (d.isSame(dayjs().add(1, 'day'), 'day')) return '明天'
  return d.format('MM-DD')
}

onMounted(() => {
  fetchData()
  fetchTrendData()
})

definePageMeta({
  layout: 'default'
})
</script>
