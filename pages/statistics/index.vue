<template>
  <div class="p-6 space-y-6">
    <PageHeader title="运营统计" description="查看运营数据及统计报表" />

    <div class="flex gap-2 border-b border-gray-200 pb-px">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="[
          'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
          activeTab === tab.key
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        ]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab === 'revenue'">
      <div class="card mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-600">开始日期</label>
            <input v-model="revenueFilters.dateFrom" type="date" class="input !w-auto" />
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-600">结束日期</label>
            <input v-model="revenueFilters.dateTo" type="date" class="input !w-auto" />
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-600">周期</label>
            <select v-model="revenueFilters.period" class="select !w-auto min-w-[100px]">
              <option value="day">按天</option>
              <option value="week">按周</option>
              <option value="month">按月</option>
            </select>
          </div>
          <button class="btn-primary" @click="fetchRevenue">查询</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="总收入" :value="`¥${revenueSummary.total.toFixed(2)}`" :icon="DollarSign" color="success" />
        <StatCard title="日均收入" :value="`¥${revenueSummary.avgDaily.toFixed(2)}`" :icon="TrendingUp" color="primary" />
        <StatCard title="最高日收入" :value="`¥${revenueSummary.highest.toFixed(2)}`" :icon="BarChart3" color="warning" />
      </div>

      <div class="card">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">收入趋势</h3>
        <div style="height: 320px;">
          <Line v-if="revenueChartData" :data="revenueChartData" :options="lineChartOptions" />
          <EmptyState v-else title="暂无数据" description="请选择日期范围查询" />
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'traffic'">
      <div class="card mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-600">开始日期</label>
            <input v-model="trafficFilters.dateFrom" type="date" class="input !w-auto" />
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-600">结束日期</label>
            <input v-model="trafficFilters.dateTo" type="date" class="input !w-auto" />
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-600">周期</label>
            <select v-model="trafficFilters.period" class="select !w-auto min-w-[100px]">
              <option value="day">按天</option>
              <option value="week">按周</option>
              <option value="month">按月</option>
            </select>
          </div>
          <button class="btn-primary" @click="fetchTraffic">查询</button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard title="总客流" :value="String(trafficSummary.total)" :icon="Users" color="primary" />
        <StatCard title="新客占比" :value="`${trafficSummary.newRatio.toFixed(1)}%`" :icon="UserPlus" color="success" />
      </div>

      <div class="card">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">客流量统计</h3>
        <div style="height: 320px;">
          <Bar v-if="trafficChartData" :data="trafficChartData" :options="barChartOptions" />
          <EmptyState v-else title="暂无数据" description="请选择日期范围查询" />
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'conversion'">
      <div class="card mb-6">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-600">开始日期</label>
            <input v-model="conversionFilters.dateFrom" type="date" class="input !w-auto" />
          </div>
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-gray-600">结束日期</label>
            <input v-model="conversionFilters.dateTo" type="date" class="input !w-auto" />
          </div>
          <button class="btn-primary" @click="fetchConversion">查询</button>
        </div>
      </div>

      <div class="card mb-6">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">到店转化率趋势</h3>
        <div style="height: 320px;">
          <Line v-if="conversionChartData" :data="conversionChartData" :options="conversionChartOptions" />
          <EmptyState v-else title="暂无数据" description="请选择日期范围查询" />
        </div>
      </div>

      <div class="card">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">活跃预警</h3>
        <div v-if="alerts.length" class="space-y-3">
          <div
            v-for="alert in alerts"
            :key="alert.id"
            class="flex items-center gap-3 p-3 rounded-lg border"
            :class="alert.alertLevel === 'HIGH' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'"
          >
            <AlertTriangle :class="['w-5 h-5 shrink-0', alert.alertLevel === 'HIGH' ? 'text-red-500' : 'text-amber-500']" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900">{{ alert.message || `转化率 ${Number(alert.conversionRate).toFixed(1)}% 低于阈值 ${Number(alert.threshold).toFixed(0)}%` }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ alert.store?.name ?? '' }} · {{ formatDateTime(alert.createdAt) }}</p>
            </div>
            <span :class="['badge text-xs', alert.alertLevel === 'HIGH' ? 'badge-refunded' : 'badge-pending']">
              {{ alert.alertLevel === 'HIGH' ? '高危' : '警告' }}
            </span>
          </div>
        </div>
        <EmptyState v-else title="暂无预警" description="当前没有转化率预警" />
      </div>
    </div>

    <div v-if="activeTab === 'parts'">
      <div class="card overflow-hidden !p-0">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left px-4 py-3 font-medium text-gray-500">配件名称</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">配件编码</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">库存数量</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">使用数量</th>
              <th class="text-left px-4 py-3 font-medium text-gray-500">周转率</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="part in partsData" :key="part.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-900">{{ part.partName }}</td>
              <td class="px-4 py-3 text-gray-700 font-mono text-xs">{{ part.partCode }}</td>
              <td class="px-4 py-3 text-gray-700">{{ part.stockQuantity }}</td>
              <td class="px-4 py-3 text-gray-700">{{ part.usedQuantity }}</td>
              <td class="px-4 py-3">
                <span :class="turnoverClass(Number(part.turnoverRate))">
                  {{ Number(part.turnoverRate).toFixed(1) }}%
                </span>
              </td>
            </tr>
            <tr v-if="!partsData.length">
              <td colspan="5">
                <EmptyState title="暂无数据" description="没有配件周转数据" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DollarSign, TrendingUp, BarChart3, Users, UserPlus, AlertTriangle } from 'lucide-vue-next'
import { Line, Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const tabs = [
  { key: 'revenue', label: '收入统计' },
  { key: 'traffic', label: '客流统计' },
  { key: 'conversion', label: '到店转化预警' },
  { key: 'parts', label: '配件周转报表' },
]

const activeTab = ref('revenue')

const formatDateTime = (dateStr: string) =>
  new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, ticks: { callback: (v: any) => `¥${v}` } },
  },
}

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' as const } },
  scales: {
    x: { stacked: true, grid: { display: false } },
    y: { stacked: true, beginAtZero: true },
  },
}

const revenueFilters = ref({ dateFrom: '', dateTo: '', period: 'day' })
const revenueItems = ref<{ date: string; revenue: number }[]>([])

const revenueChartData = computed(() => {
  if (!revenueItems.value.length) return null
  return {
    labels: revenueItems.value.map((i) => i.date),
    datasets: [{
      label: '收入',
      data: revenueItems.value.map((i) => i.revenue),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
    }],
  }
})

const revenueSummary = computed(() => {
  const items = revenueItems.value
  const total = items.reduce((s, i) => s + i.revenue, 0)
  const avgDaily = items.length ? total / items.length : 0
  const highest = items.length ? Math.max(...items.map((i) => i.revenue)) : 0
  return { total, avgDaily, highest }
})

async function fetchRevenue() {
  const query: Record<string, string> = {}
  if (revenueFilters.value.dateFrom) query.dateFrom = revenueFilters.value.dateFrom
  if (revenueFilters.value.dateTo) query.dateTo = revenueFilters.value.dateTo
  if (revenueFilters.value.period) query.period = revenueFilters.value.period

  const res = await useFetch('/api/statistics/revenue', { query })
  if (res.data.value?.success) {
    revenueItems.value = res.data.value.data.items
  }
}

const trafficFilters = ref({ dateFrom: '', dateTo: '', period: 'day' })
const trafficItems = ref<{ date: string; total: number; newCustomers: number; returningCustomers: number }[]>([])

const trafficChartData = computed(() => {
  if (!trafficItems.value.length) return null
  return {
    labels: trafficItems.value.map((i) => i.date),
    datasets: [
      {
        label: '新客户',
        data: trafficItems.value.map((i) => i.newCustomers),
        backgroundColor: '#6366f1',
      },
      {
        label: '回访客户',
        data: trafficItems.value.map((i) => i.returningCustomers),
        backgroundColor: '#22c55e',
      },
    ],
  }
})

const trafficSummary = computed(() => {
  const items = trafficItems.value
  const total = items.reduce((s, i) => s + i.total, 0)
  const newTotal = items.reduce((s, i) => s + i.newCustomers, 0)
  const newRatio = total > 0 ? (newTotal / total) * 100 : 0
  return { total, newRatio }
})

async function fetchTraffic() {
  const query: Record<string, string> = {}
  if (trafficFilters.value.dateFrom) query.dateFrom = trafficFilters.value.dateFrom
  if (trafficFilters.value.dateTo) query.dateTo = trafficFilters.value.dateTo
  if (trafficFilters.value.period) query.period = trafficFilters.value.period

  const res = await useFetch('/api/statistics/traffic', { query })
  if (res.data.value?.success) {
    trafficItems.value = res.data.value.data.items
  }
}

const conversionFilters = ref({ dateFrom: '', dateTo: '' })
const conversionItems = ref<{ date: string; total: number; completed: number; conversionRate: number }[]>([])
const conversionThreshold = ref(60)
const alerts = ref<any[]>([])

const conversionChartData = computed(() => {
  if (!conversionItems.value.length) return null
  return {
    labels: conversionItems.value.map((i) => i.date),
    datasets: [
      {
        label: '转化率 (%)',
        data: conversionItems.value.map((i) => i.conversionRate),
        borderColor: '#6366f1',
        backgroundColor: conversionItems.value.map((i) =>
          i.conversionRate < conversionThreshold.value ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.1)'
        ),
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: conversionItems.value.map((i) =>
          i.conversionRate < conversionThreshold.value ? '#ef4444' : '#6366f1'
        ),
      },
      {
        label: '阈值 (60%)',
        data: conversionItems.value.map(() => conversionThreshold.value),
        borderColor: '#ef4444',
        borderDash: [6, 4],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      },
    ],
  }
})

const conversionChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' as const } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, max: 100, ticks: { callback: (v: any) => `${v}%` } },
  },
}

async function fetchConversion() {
  const query: Record<string, string> = {}
  if (conversionFilters.value.dateFrom) query.dateFrom = conversionFilters.value.dateFrom
  if (conversionFilters.value.dateTo) query.dateTo = conversionFilters.value.dateTo

  const res = await useFetch('/api/statistics/conversion', { query })
  if (res.data.value?.success) {
    conversionItems.value = res.data.value.data.items
    conversionThreshold.value = res.data.value.data.threshold ?? 60
  }
}

const partsData = ref<any[]>([])

function turnoverClass(rate: number) {
  if (rate >= 60) return 'text-green-600 font-semibold'
  if (rate >= 30) return 'text-amber-600 font-semibold'
  return 'text-red-600 font-semibold'
}

async function fetchParts() {
  const res = await useFetch('/api/statistics/parts-turnover')
  if (res.data.value?.success) {
    partsData.value = res.data.value.data
  }
}

async function fetchAlerts() {
  const res = await useFetch('/api/conversion-alerts')
  if (res.data.value?.success) {
    alerts.value = res.data.value.data
  }
}

onMounted(async () => {
  await fetchRevenue()
  await fetchParts()
  await fetchAlerts()
})
</script>
