<template>
  <div class="page-container">
    <div class="page-header flex items-center justify-between">
      <div>
        <h1 class="page-title">数据报表</h1>
        <p class="page-subtitle">超时原因聚合分析与报表导出</p>
      </div>
      <div class="flex items-center gap-3">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="default"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
        />
        <el-button :loading="loading" type="primary" @click="exportAllOrders">
          <span class="flex items-center gap-1">
            <Download class="w-4 h-4" />
            导出全量报表
          </span>
        </el-button>
        <el-button :loading="loading" @click="refreshData">
          <RefreshCw class="w-4 h-4 mr-1" />
          刷新
        </el-button>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4 mb-5">
      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-value text-[#165DFF]">{{ totalOrders }}</div>
            <div class="stat-label">订单总数</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-[#165DFF]/10 flex items-center justify-center">
            <ClipboardList class="w-5 h-5 text-[#165DFF]" />
          </div>
        </div>
      </div>
      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-value text-[#FF7D00]">{{ timeoutOrders }}</div>
            <div class="stat-label">超时订单</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-[#FF7D00]/10 flex items-center justify-center">
            <AlertTriangle class="w-5 h-5 text-[#FF7D00]" />
          </div>
        </div>
        <div class="stat-trend text-[#86909C]">
          超时率 {{ totalOrders > 0 ? ((timeoutOrders / totalOrders) * 100).toFixed(1) : 0 }}%
        </div>
      </div>
      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-value text-[#F53F3F]">{{ refundOrders }}</div>
            <div class="stat-label">退款订单</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-[#F53F3F]/10 flex items-center justify-center">
            <RotateCcw class="w-5 h-5 text-[#F53F3F]" />
          </div>
        </div>
        <div class="stat-trend text-[#86909C]">
          退款率 {{ totalOrders > 0 ? ((refundOrders / totalOrders) * 100).toFixed(1) : 0 }}%
        </div>
      </div>
      <div class="stat-card">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-value text-[#86909C]">{{ dataGapOrders }}</div>
            <div class="stat-label">数据缺口订单</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-[#86909C]/10 flex items-center justify-center">
            <AlertCircle class="w-5 h-5 text-[#86909C]" />
          </div>
        </div>
        <div class="stat-trend text-[#86909C]">
          不计入等待均值计算
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-5">
      <div class="col-span-6">
        <div class="card p-5">
          <h3 class="section-title">
            <PieChart class="w-5 h-5 text-[#165DFF]" />
            超时原因分布
          </h3>
          <BaseChart :option="reasonPieOption" height="350px" />
        </div>
      </div>

      <div class="col-span-6">
        <div class="card p-5">
          <h3 class="section-title">
            <BarChart3 class="w-5 h-5 text-[#165DFF]" />
            超时原因排行
          </h3>
          <BaseChart :option="reasonBarOption" height="350px" />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-5 mt-5">
      <div class="col-span-6">
        <div class="card p-5">
          <h3 class="section-title">
            <Cloud class="w-5 h-5 text-[#165DFF]" />
            天气对出餐的影响
          </h3>
          <BaseChart :option="weatherBarOption" height="300px" />
        </div>
      </div>

      <div class="col-span-6">
        <div class="card p-5">
          <h3 class="section-title">
            <Clock class="w-5 h-5 text-[#165DFF]" />
            时段出餐分布
          </h3>
          <BaseChart :option="periodBarOption" height="300px" />
        </div>
      </div>
    </div>

    <div class="card p-5 mt-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="section-title mb-0">
          <FileText class="w-5 h-5 text-[#165DFF]" />
          超时订单明细
        </h3>
        <div class="flex items-center gap-2">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索订单号/商户"
            size="small"
            style="width: 200px"
            :prefix-icon="Search"
          />
          <el-button size="small" @click="exportTimeoutOrders">
            <Download class="w-4 h-4 mr-1" />
            导出
          </el-button>
        </div>
      </div>
      <el-table :data="filteredTimeoutOrders" stripe style="width: 100%" max-height="400" v-loading="loading">
        <el-table-column prop="orderNo" label="订单号" width="160" />
        <el-table-column prop="merchantName" label="商户名称" min-width="180" />
        <el-table-column prop="prepDuration" label="备餐时长" width="100" align="center">
          <template #default="{ row }">
            <span :class="row.prepDuration > 15 ? 'text-[#FF7D00] font-medium' : 'text-[#00B42A]'">
              {{ row.prepDuration }} 分钟
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="waitDuration" label="等待时长" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.waitDuration !== undefined" :class="row.waitDuration > 10 ? 'text-[#FF7D00] font-medium' : 'text-[#00B42A]'">
              {{ row.waitDuration }} 分钟
            </span>
            <span v-else class="text-[#86909C]">不计入</span>
          </template>
        </el-table-column>
        <el-table-column prop="timeoutReason" label="超时原因" min-width="140" />
        <el-table-column prop="weather" label="天气" width="80" align="center">
          <template #default="{ row }">
            <span class="tag tag-info">{{ getWeatherLabel(row.weather) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="timePeriod" label="时段" width="100" align="center">
          <template #default="{ row }">
            <span class="tag tag-info">{{ getPeriodLabel(row.timePeriod) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="hasDataGap" label="数据缺口" width="90" align="center">
          <template #default="{ row }">
            <span v-if="row.hasDataGap" class="tag tag-warning">是</span>
            <span v-else class="tag tag-success">否</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goToMerchant(row.merchantId)">
              查看商户
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import { WEATHER_OPTIONS, TIME_PERIOD_OPTIONS } from '@/constants'
import { formatDateTime, exportToCSV, aggregateTimeoutReasons } from '@/utils/dataProcessor'
import { ClickHouseService } from '@/services/clickhouse'
import BaseChart from '@/components/BaseChart.vue'
import {
  Download,
  ClipboardList,
  AlertTriangle,
  RotateCcw,
  AlertCircle,
  PieChart,
  BarChart3,
  Cloud,
  Clock,
  FileText,
  Search,
  RefreshCw
} from 'lucide-vue-next'

const router = useRouter()
const store = useAppStore()

const dateRange = ref<[string, string]>([
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  new Date().toISOString().split('T')[0]
])
const searchKeyword = ref('')
const loading = ref(false)
const allOrders = ref<any[]>([])

onMounted(async () => {
  await loadData()
})

async function loadData() {
  loading.value = true
  try {
    await store.initialize()
    allOrders.value = await ClickHouseService.getAllOrdersWithMerchantInfo()
  } finally {
    loading.value = false
  }
}

async function refreshData() {
  await loadData()
}

const filteredOrders = computed(() => {
  let orders = allOrders.value
  if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
    const start = new Date(dateRange.value[0]).getTime()
    const end = new Date(dateRange.value[1])
    end.setHours(23, 59, 59, 999)
    orders = orders.filter(o => {
      const t = new Date(o.createTime).getTime()
      return t >= start && t <= end.getTime()
    })
  }
  return orders
})

const totalOrders = computed(() => filteredOrders.value.length)
const timeoutOrders = computed(() => filteredOrders.value.filter(o => o.isTimeout).length)
const refundOrders = computed(() => filteredOrders.value.filter(o => o.hasRefund).length)
const dataGapOrders = computed(() => filteredOrders.value.filter(o => o.hasDataGap).length)

const allTimeoutReasons = computed(() => {
  return aggregateTimeoutReasons(filteredOrders.value)
})

const timeoutOrdersList = computed(() => {
  return filteredOrders.value.filter(o => o.isTimeout || o.hasRefund)
})

const filteredTimeoutOrders = computed(() => {
  if (!searchKeyword.value) return timeoutOrdersList.value
  const kw = searchKeyword.value.toLowerCase()
  return timeoutOrdersList.value.filter(o =>
    o.orderNo.toLowerCase().includes(kw) ||
    o.merchantName.toLowerCase().includes(kw)
  )
})

const reasonPieOption = computed(() => {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { fontSize: 12, color: '#86909C' }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 13, fontWeight: 'bold' }
        },
        data: allTimeoutReasons.value.slice(0, 8).map((r, i) => ({
          value: r.count,
          name: r.reason,
          itemStyle: {
            color: ['#165DFF', '#FF7D00', '#00B42A', '#F53F3F', '#722ED1', '#14C9C9', '#FF9A2E', '#27C24C'][i]
          }
        }))
      }
    ]
  }
})

const reasonBarOption = computed(() => {
  const data = [...allTimeoutReasons.value].sort((a, b) => a.count - b.count).slice(0, 10)
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const p = params[0]
        return `${p.name}<br/>超时订单：${p.value} 单`
      }
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F2F3F5' } },
      axisLabel: { color: '#86909C', fontSize: 12 }
    },
    yAxis: {
      type: 'category',
      data: data.map(d => d.reason),
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisLabel: { color: '#4E5969', fontSize: 12 }
    },
    series: [
      {
        type: 'bar',
        data: data.map((d, i) => ({
          value: d.count,
          itemStyle: {
            color: ['#165DFF', '#FF7D00', '#00B42A', '#F53F3F', '#722ED1', '#14C9C9', '#FF9A2E', '#27C24C', '#86909C', '#E5E6EB'][i % 10],
            borderRadius: [0, 4, 4, 0]
          }
        })),
        barWidth: 16,
        label: {
          show: true,
          position: 'right',
          fontSize: 11,
          color: '#4E5969',
          formatter: '{c}单'
        }
      }
    ]
  }
})

const weatherBarOption = computed(() => {
  const weatherData: Record<string, { count: number; avgPrep: number; avgWait: number }> = {}
  filteredOrders.value.forEach(o => {
    if (!weatherData[o.weather]) {
      weatherData[o.weather] = { count: 0, avgPrep: 0, avgWait: 0 }
    }
    weatherData[o.weather].count++
    weatherData[o.weather].avgPrep += o.prepDuration
    if (o.waitDuration !== undefined) {
      weatherData[o.weather].avgWait += o.waitDuration
    }
  })
  Object.keys(weatherData).forEach(k => {
    const d = weatherData[k]
    d.avgPrep = d.count > 0 ? Math.round(d.avgPrep / d.count) : 0
    d.avgWait = d.count > 0 ? Math.round(d.avgWait / d.count) : 0
  })

  const weatherOrder = ['sunny', 'rainy', 'hot', 'foggy', 'windy', 'snowy']
  const sortedKeys = Object.keys(weatherData).sort((a, b) => weatherOrder.indexOf(a) - weatherOrder.indexOf(b))

  return {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['备餐时长', '等待时长'],
      top: 0,
      textStyle: { fontSize: 12, color: '#86909C' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: sortedKeys.map(k => getWeatherLabel(k)),
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisLabel: { color: '#86909C', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      name: '分钟',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F2F3F5' } },
      axisLabel: { color: '#86909C', fontSize: 12 }
    },
    series: [
      {
        name: '备餐时长',
        type: 'bar',
        data: sortedKeys.map(k => weatherData[k].avgPrep),
        itemStyle: { color: '#165DFF', borderRadius: [4, 4, 0, 0] },
        barWidth: 20
      },
      {
        name: '等待时长',
        type: 'bar',
        data: sortedKeys.map(k => weatherData[k].avgWait),
        itemStyle: { color: '#FF7D00', borderRadius: [4, 4, 0, 0] },
        barWidth: 20
      }
    ]
  }
})

const periodBarOption = computed(() => {
  const periodData: Record<string, { count: number; avgPrep: number; avgWait: number }> = {}
  filteredOrders.value.forEach(o => {
    if (!periodData[o.timePeriod]) {
      periodData[o.timePeriod] = { count: 0, avgPrep: 0, avgWait: 0 }
    }
    periodData[o.timePeriod].count++
    periodData[o.timePeriod].avgPrep += o.prepDuration
    if (o.waitDuration !== undefined) {
      periodData[o.timePeriod].avgWait += o.waitDuration
    }
  })
  Object.keys(periodData).forEach(k => {
    const d = periodData[k]
    d.avgPrep = d.count > 0 ? Math.round(d.avgPrep / d.count) : 0
    d.avgWait = d.count > 0 ? Math.round(d.avgWait / d.count) : 0
  })

  const periodOrder = ['breakfast', 'lunch', 'afternoon', 'dinner', 'night', 'other']
  const sortedKeys = Object.keys(periodData).sort((a, b) => periodOrder.indexOf(a) - periodOrder.indexOf(b))

  return {
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['订单量', '平均出餐时长'],
      top: 0,
      textStyle: { fontSize: 12, color: '#86909C' }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: sortedKeys.map(k => getPeriodLabel(k)),
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisLabel: { color: '#86909C', fontSize: 11 }
    },
    yAxis: [
      {
        type: 'value',
        name: '订单量',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5' } },
        axisLabel: { color: '#86909C', fontSize: 12 }
      },
      {
        type: 'value',
        name: '分钟',
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#86909C', fontSize: 12 }
      }
    ],
    series: [
      {
        name: '订单量',
        type: 'bar',
        data: sortedKeys.map(k => periodData[k].count),
        itemStyle: { color: '#E8F3FF', borderRadius: [4, 4, 0, 0] },
        barWidth: 24
      },
      {
        name: '平均出餐时长',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: sortedKeys.map(k => periodData[k].avgPrep + periodData[k].avgWait),
        lineStyle: { color: '#FF7D00', width: 2 },
        itemStyle: { color: '#FF7D00' }
      }
    ]
  }
})

function getWeatherLabel(value: string): string {
  return WEATHER_OPTIONS.find(w => w.value === value)?.label || value
}

function getPeriodLabel(value: string): string {
  return TIME_PERIOD_OPTIONS.find(p => p.value === value)?.label || value
}

function goToMerchant(id: string) {
  router.push(`/merchant/${id}`)
}

function exportAllOrders() {
  exportToCSV(filteredOrders.value, '全量订单报表.csv')
}

function exportTimeoutOrders() {
  exportToCSV(filteredTimeoutOrders.value, '超时订单明细.csv')
}

async function handleDateChange(val: [string, string] | null) {
  if (val && val[0] && val[1]) {
    await store.updateFilter({
      timeRange: { start: val[0], end: val[1] }
    })
  }
}
</script>
