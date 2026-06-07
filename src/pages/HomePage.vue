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
        />
        <el-select v-model="selectedWeather" multiple placeholder="天气筛选" size="default" style="width: 160px">
          <el-option v-for="w in WEATHER_OPTIONS" :key="w.value" :label="w.label" :value="w.value" />
        </el-select>
        <el-select v-model="selectedPeriod" multiple placeholder="时段筛选" size="default" style="width: 180px">
          <el-option v-for="p in TIME_PERIOD_OPTIONS" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-4 mb-5">
      <div class="stat-card animate-fade-in-up animate-stagger-1">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-value text-[#165DFF]">{{ store.overallMetrics.avgPrepTime }}</div>
            <div class="stat-label">平均备餐时长 (分钟)</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-[#165DFF]/10 flex items-center justify-center">
            <ChefHat class="w-5 h-5 text-[#165DFF]" />
          </div>
        </div>
        <div class="stat-trend">
          <span class="trend-down">↓ 2.3%</span>
          <span class="text-[#86909C] ml-1">较上周</span>
        </div>
      </div>

      <div class="stat-card animate-fade-in-up animate-stagger-2">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-value text-[#FF7D00]">{{ store.overallMetrics.avgWaitTime }}</div>
            <div class="stat-label">平均骑手等待 (分钟)</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-[#FF7D00]/10 flex items-center justify-center">
            <Timer class="w-5 h-5 text-[#FF7D00]" />
          </div>
        </div>
        <div class="stat-trend">
          <span class="trend-up">↑ 1.5%</span>
          <span class="text-[#86909C] ml-1">较上周</span>
        </div>
      </div>

      <div class="stat-card animate-fade-in-up animate-stagger-3">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-value text-[#00B42A]">{{ store.overallMetrics.orderCount }}</div>
            <div class="stat-label">订单总量</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-[#00B42A]/10 flex items-center justify-center">
            <ClipboardList class="w-5 h-5 text-[#00B42A]" />
          </div>
        </div>
        <div class="stat-trend">
          <span class="trend-down">↑ 8.2%</span>
          <span class="text-[#86909C] ml-1">较上周</span>
        </div>
      </div>

      <div class="stat-card animate-fade-in-up animate-stagger-4">
        <div class="flex items-start justify-between">
          <div>
            <div class="stat-value text-[#F53F3F]">{{ store.overallMetrics.refundRate }}%</div>
            <div class="stat-label">退款率</div>
          </div>
          <div class="w-10 h-10 rounded-lg bg-[#F53F3F]/10 flex items-center justify-center">
            <RotateCcw class="w-5 h-5 text-[#F53F3F]" />
          </div>
        </div>
        <div class="stat-trend">
          <span class="trend-down">↓ 0.8%</span>
          <span class="text-[#86909C] ml-1">较上周</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-5">
      <div class="col-span-8">
        <div class="card p-5">
          <h3 class="section-title">
            <Map class="w-5 h-5 text-[#165DFF]" />
            商圈出餐热力分布
          </h3>
          <BaseChart :option="heatMapOption" height="480px" @click="handleMapClick" />
        </div>

        <div class="card p-5 mt-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="section-title mb-0">
              <AlertTriangle class="w-5 h-5 text-[#FF7D00]" />
              数据缺口提示
            </h3>
            <span class="text-sm text-[#86909C]">共 {{ totalDataGapCount }} 条订单缺少骑手到店时间，不计入等待均值</span>
          </div>
          <div class="flex items-center gap-4 p-4 bg-[#FFF7E8] rounded-lg border border-[#FF7D00]/20">
            <AlertCircle class="w-6 h-6 text-[#FF7D00] flex-shrink-0" />
            <div class="flex-1">
              <p class="text-sm text-[#FF7D00] font-medium">骑手到店时间数据不完整</p>
              <p class="text-xs text-[#4E5969] mt-1">部分订单缺少骑手到店时间戳，等待时长统计已自动排除这些订单。建议检查骑手端GPS或扫码系统是否正常。</p>
            </div>
            <el-button type="warning" size="small" plain>查看详情</el-button>
          </div>
        </div>
      </div>

      <div class="col-span-4">
        <div class="card p-5 sticky top-20">
          <h3 class="section-title">
            <Trophy class="w-5 h-5 text-[#FF7D00]" />
            商户出餐时长排行
          </h3>
          <div class="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            <div
              v-for="(merchant, index) in store.sortedMerchants"
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
                  <div class="text-sm font-semibold" :class="getDurationColor(merchant.avgPrepTime + merchant.avgWaitTime)">
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
                    :style="{ width: `${Math.min((merchant.avgPrepTime + merchant.avgWaitTime) / 40 * 100, 100)}%` }"
                  ></div>
                </div>
                <span class="text-xs text-[#86909C] w-16 text-right">{{ merchant.orderCount }} 单</span>
              </div>
              <div class="mt-2 flex items-center gap-2" v-if="merchant.dataGapCount > 0">
                <AlertCircle class="w-3 h-3 text-[#FF7D00]" />
                <span class="text-xs text-[#FF7D00]">{{ merchant.dataGapCount }} 条数据缺口</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import { WEATHER_OPTIONS, TIME_PERIOD_OPTIONS, THRESHOLDS } from '@/constants'
import BaseChart from '@/components/BaseChart.vue'
import {
  ChefHat,
  Timer,
  ClipboardList,
  RotateCcw,
  Map,
  Trophy,
  AlertTriangle,
  AlertCircle
} from 'lucide-vue-next'

const router = useRouter()
const store = useAppStore()

const dateRange = ref<[string, string]>([
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  new Date().toISOString().split('T')[0]
])
const selectedWeather = ref<string[]>([])
const selectedPeriod = ref<string[]>([])

const totalDataGapCount = computed(() => {
  return store.merchants.reduce((sum, m) => sum + m.dataGapCount, 0)
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
        return `<div class="font-medium">${params.name}</div>
                <div>平均出餐时长：${params.value[1]} 分钟</div>
                <div>订单量：${Math.round(params.value[1] * 30)} 单</div>`
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
      left: 'left',
      top: 'bottom',
      text: ['高', '低'],
      calculable: true,
      orient: 'horizontal',
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
        symbolSize: (val: number[]) => val[1] * 3,
        label: {
          show: true,
          formatter: (params: any) => `${params.value[1]}分钟`,
          position: 'top',
          fontSize: 11,
          color: '#4E5969'
        },
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
  router.push(`/merchant/${id}`)
}

function handleMapClick(params: any) {
  console.log('Map clicked:', params)
}
</script>
