<template>
  <div class="page-container">
    <div class="page-header flex items-center justify-between">
      <div>
        <h1 class="page-title">商圈出餐监控</h1>
        <p class="page-subtitle">实时监控商圈内商户备餐与骑手等待时长</p>
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
        <el-select
          v-model="selectedWeather"
          multiple
          placeholder="天气筛选"
          size="default"
          style="width: 160px"
          @change="handleFilterChange"
        >
          <el-option v-for="w in WEATHER_OPTIONS" :key="w.value" :label="w.label" :value="w.value" />
        </el-select>
        <el-select
          v-model="selectedPeriod"
          multiple
          placeholder="时段筛选"
          size="default"
          style="width: 180px"
          @change="handleFilterChange"
        >
          <el-option v-for="p in TIME_PERIOD_OPTIONS" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>
        <el-button :loading="store.isLoading" @click="refreshData" size="default">
          <RefreshCw class="w-4 h-4 mr-1" />
          刷新
        </el-button>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4 mb-5">
      <div class="stat-card animate-fade-in-up animate-stagger-1">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-value text-[#165DFF]">{{ store.overallMetrics.avgPrepTime || 0 }}</div>
            <div class="stat-label">平均备餐时长 (分钟)</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-[#165DFF]/10 flex items-center justify-center">
            <ChefHat class="w-5 h-5 text-[#165DFF]" />
          </div>
        </div>
        <div class="stat-trend">
          <span class="text-[#86909C]">
            基于 {{ store.merchants.reduce((s, m) => s + m.orderCount, 0) }} 条有效订单
          </span>
        </div>
      </div>

      <div class="stat-card animate-fade-in-up animate-stagger-2">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-value text-[#FF7D00]">{{ store.overallMetrics.avgWaitTime || 0 }}</div>
            <div class="stat-label">平均骑手等待 (分钟)</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-[#FF7D00]/10 flex items-center justify-center">
            <Timer class="w-5 h-5 text-[#FF7D00]" />
          </div>
        </div>
        <div class="stat-trend">
          <span class="text-[#86909C]">已排除 {{ totalDataGapCount }} 条数据缺口订单</span>
        </div>
      </div>

      <div class="stat-card animate-fade-in-up animate-stagger-3">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-value text-[#00B42A]">
              {{ store.merchants.reduce((s, m) => s + m.orderCount, 0) }}
            </div>
            <div class="stat-label">订单总量</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-[#00B42A]/10 flex items-center justify-center">
            <ClipboardList class="w-5 h-5 text-[#00B42A]" />
          </div>
        </div>
        <div class="stat-trend">
          <span class="text-[#86909C]">覆盖 {{ store.merchants.length }} 家商户</span>
        </div>
      </div>

      <div class="stat-card animate-fade-in-up animate-stagger-4">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-value text-[#F53F3F]">{{ store.overallMetrics.refundRate || 0 }}%</div>
            <div class="stat-label">退款率</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-[#F53F3F]/10 flex items-center justify-center">
            <RotateCcw class="w-5 h-5 text-[#F53F3F]" />
          </div>
        </div>
        <div class="stat-trend">
          <span class="text-[#86909C]">超时率 {{ store.overallMetrics.timeoutRate || 0 }}%</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-5">
      <div class="col-span-8">
        <div class="card p-5">
          <h3 class="section-title">
            <Map class="w-5 h-5 text-[#165DFF]" />
            商圈出餐热力分布
            <span class="ml-2 text-xs text-[#86909C] font-normal">（点击商圈查看商户列表）</span>
          </h3>
          <BaseChart :option="heatMapOption" height="480px" @click="handleMapClick" />
        </div>

        <div class="card p-5 mt-5" v-if="totalDataGapCount > 0">
          <div class="flex items-center justify-between mb-4">
            <h3 class="section-title mb-0">
              <AlertTriangle class="w-5 h-5 text-[#FF7D00]" />
              数据缺口提示
            </h3>
            <span class="text-sm text-[#86909C]">
              共 {{ totalDataGapCount }} 条订单缺少骑手到店时间，不计入等待均值
            </span>
          </div>
          <div class="flex items-center gap-4 p-4 bg-[#FFF7E8] rounded-lg border border-[#FF7D00]/20">
            <AlertCircle class="w-6 h-6 text-[#FF7D00] flex-shrink-0" />
            <div class="flex-1">
              <p class="text-sm text-[#FF7D00] font-medium">骑手到店时间数据不完整</p>
              <p class="text-xs text-[#4E5969] mt-1">
                部分订单缺少骑手到店时间戳，<strong>等待时长统计已自动排除这些订单</strong>，
                但<strong>备餐时长、超时原因、退款统计仍包含</strong>。
                建议检查骑手端GPS或扫码系统是否正常。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-4">
        <div class="card p-5 sticky top-20">
          <div class="flex items-center justify-between mb-4">
            <h3 class="section-title mb-0">
              <Trophy class="w-5 h-5 text-[#FF7D00]" />
              商户出餐时长排行
            </h3>
            <el-dropdown @command="handleSortChange">
              <el-button size="small" plain>
                排序 <ArrowDown class="w-3 h-3 ml-1" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="total">总出餐时长</el-dropdown-item>
                  <el-dropdown-item command="prep">备餐时长</el-dropdown-item>
                  <el-dropdown-item command="wait">等待时长</el-dropdown-item>
                  <el-dropdown-item command="orders">订单量</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            <div
              v-for="(merchant, index) in sortedMerchantsByType"
              :key="merchant.id"
              class="p-3 rounded-lg border border-[#E5E6EB] hover:border-[#165DFF] hover:bg-[#165DFF]/5 cursor-pointer transition-all group"
              @click="goToMerchant(merchant.id)"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                  :class="index < 3 ? 'bg-[#FF7D00] text-white' : 'bg-[#F2F3F5] text-[#86909C]'"
                >
                  {{ index + 1 }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-[#1D2129] truncate group-hover:text-[#165DFF]">
                    {{ merchant.name }}
                  </div>
                  <div class="text-xs text-[#86909C] mt-0.5">{{ merchant.businessDistrict }}</div>
                </div>
                <div class="text-right flex-shrink-0">
                  <div
                    class="text-sm font-semibold"
                    :class="getDurationColor(merchant.avgPrepTime + merchant.avgWaitTime)"
                  >
                    {{ merchant.avgPrepTime + merchant.avgWaitTime }} 分钟
                  </div>
                  <div class="text-xs text-[#86909C]">
                    备餐 {{ merchant.avgPrepTime }} · 等待 {{ merchant.avgWaitTime }}
                  </div>
                </div>
              </div>
              <div class="mt-2 flex items-center gap-2">
                <div class="flex-1 h-1.5 bg-[#F2F3F5] rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all"
                    :class="getProgressColor(merchant.avgPrepTime + merchant.avgWaitTime)"
                    :style="{ width: `${Math.min(((merchant.avgPrepTime + merchant.avgWaitTime) / 40) * 100, 100)}%` }"
                  ></div>
                </div>
                <span class="text-xs text-[#86909C] w-16 text-right">{{ merchant.orderCount }} 单</span>
              </div>
              <div class="mt-2 flex items-center gap-2" v-if="merchant.dataGapCount > 0">
                <AlertCircle class="w-3 h-3 text-[#FF7D00]" />
                <span class="text-xs text-[#FF7D00]">{{ merchant.dataGapCount }} 条数据缺口</span>
              </div>
            </div>
            <div v-if="store.merchants.length === 0" class="text-center py-12 text-[#86909C]">
              <Loader2 class="w-8 h-8 animate-spin mx-auto mb-2" />
              加载中...
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showDistrictMerchants" title="商圈商户列表" width="600px">
      <h4 class="text-sm font-medium text-[#1D2129] mb-3">{{ selectedDistrict }} - 商户列表</h4>
      <el-table :data="districtMerchants" stripe max-height="400">
        <el-table-column prop="name" label="商户名称" min-width="180" />
        <el-table-column label="总出餐时长" width="100" align="center">
          <template #default="{ row }">
            <span :class="getDurationColor(row.avgPrepTime + row.avgWaitTime)" class="font-medium">
              {{ row.avgPrepTime + row.avgWaitTime }} 分钟
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="orderCount" label="订单量" width="80" align="center" />
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goToMerchant(row.id)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import { WEATHER_OPTIONS, TIME_PERIOD_OPTIONS } from '@/constants'
import BaseChart from '@/components/BaseChart.vue'
import {
  ChefHat,
  Timer,
  ClipboardList,
  RotateCcw,
  Map,
  Trophy,
  AlertTriangle,
  AlertCircle,
  ArrowDown,
  RefreshCw,
  Loader2
} from 'lucide-vue-next'

const router = useRouter()
const store = useAppStore()

const dateRange = ref<[string, string]>([
  new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  new Date().toISOString().split('T')[0]
])
const selectedWeather = ref<string[]>([])
const selectedPeriod = ref<string[]>([])
const sortType = ref<'total' | 'prep' | 'wait' | 'orders'>('total')
const showDistrictMerchants = ref(false)
const selectedDistrict = ref('')

onMounted(async () => {
  await store.initialize()
})

const totalDataGapCount = computed(() => {
  return store.merchants.reduce((sum, m) => sum + (m.dataGapCount || 0), 0)
})

const sortedMerchantsByType = computed(() => {
  const list = [...store.merchants]
  switch (sortType.value) {
    case 'prep':
      return list.sort((a, b) => b.avgPrepTime - a.avgPrepTime)
    case 'wait':
      return list.sort((a, b) => b.avgWaitTime - a.avgWaitTime)
    case 'orders':
      return list.sort((a, b) => b.orderCount - a.orderCount)
    case 'total':
    default:
      return list.sort((a, b) => b.avgPrepTime + b.avgWaitTime - (a.avgPrepTime + a.avgWaitTime))
  }
})

const districtMerchants = computed(() => {
  if (!selectedDistrict.value) return []
  return store.merchants.filter(m => m.businessDistrict === selectedDistrict.value)
})

const heatMapOption = computed(() => {
  const data = store.districtHeatData.map((d, index) => ({
    name: d.name,
    value: [index, d.value, d.value]
  }))

  const xAxisData = store.districtHeatData.map(d => d.name)

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const districtMerchantsList = store.merchants.filter(
          m => m.businessDistrict === params.name
        )
        return `
          <div class="font-medium text-sm">${params.name}</div>
          <div class="mt-1">平均出餐时长：<strong>${params.value[1].toFixed(1)} 分钟</strong></div>
          <div>商户数量：${districtMerchantsList.length} 家</div>
          <div>订单总量：${districtMerchantsList.reduce((s, m) => s + m.orderCount, 0)} 单</div>
          <div class="text-xs text-[#86909C] mt-1">点击查看商圈商户</div>
        `
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisLabel: {
        color: '#86909C',
        fontSize: 11,
        interval: 0,
        rotate: 15
      }
    },
    yAxis: {
      type: 'value',
      name: '平均出餐时长(分钟)',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F2F3F5' } },
      axisLabel: { color: '#86909C', fontSize: 12 }
    },
    visualMap: {
      min: 10,
      max: 35,
      left: 'center',
      top: 'bottom',
      text: ['高', '低'],
      calculable: true,
      orient: 'horizontal',
      itemWidth: 12,
      itemHeight: 120,
      inRange: {
        color: ['#00B42A', '#FF7D00', '#F53F3F']
      },
      textStyle: {
        color: '#86909C',
        fontSize: 12
      }
    },
    series: [
      {
        name: '出餐时长',
        type: 'scatter',
        data: data.map(d => ({
          name: d.name,
          value: d.value,
          itemStyle: {
            color: d.value[1] <= 15 ? '#00B42A' : d.value[1] <= 25 ? '#FF7D00' : '#F53F3F'
          }
        })),
        symbolSize: (val: number[]) => Math.max(val[1] * 2.5, 15),
        label: {
          show: true,
          formatter: (params: any) => `${params.value[1].toFixed(0)}分钟`,
          position: 'top',
          fontSize: 11,
          color: '#4E5969'
        },
        cursor: 'pointer',
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowColor: 'rgba(22, 93, 255, 0.4)',
            borderColor: '#165DFF',
            borderWidth: 2
          }
        }
      }
    ]
  }
})

function getDurationColor(duration: number): string {
  if (duration <= 15) return 'text-[#00B42A]'
  if (duration <= 25) return 'text-[#FF7D00]'
  return 'text-[#F53F3F]'
}

function getProgressColor(duration: number): string {
  if (duration <= 15) return 'bg-[#00B42A]'
  if (duration <= 25) return 'bg-[#FF7D00]'
  return 'bg-[#F53F3F]'
}

function goToMerchant(id: string) {
  showDistrictMerchants.value = false
  router.push(`/merchant/${id}`)
}

function handleMapClick(params: any) {
  if (params.name) {
    selectedDistrict.value = params.name
    showDistrictMerchants.value = true
  }
}

async function handleDateChange(val: [string, string] | null) {
  if (val && val[0] && val[1]) {
    await store.updateFilter({
      timeRange: { start: val[0], end: val[1] }
    })
  }
}

async function handleFilterChange() {
  await store.updateFilter({
    weather: selectedWeather.value,
    timePeriod: selectedPeriod.value
  })
}

function handleSortChange(type: string) {
  sortType.value = type as any
}

async function refreshData() {
  await store.refreshData()
}
</script>
