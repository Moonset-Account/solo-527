<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEnergyStore } from '@/stores/energy'
import { mockTimeOfUsePrices } from '@/mock'
import PeakValleyPie from '@/components/charts/PeakValleyPie.vue'
import HourlyBarChart from '@/components/charts/HourlyBarChart.vue'
import { formatNumber, aggregateByHour, getTimeRangeText } from '@/utils'
import { Edit3, Save, DollarSign, Clock } from 'lucide-vue-next'
import type { TimeOfUsePrice, TimeRange } from '@/types'
import { ElMessage } from 'element-plus'

const energyStore = useEnergyStore()

const isEditing = ref(false)
const touPrices = ref<TimeOfUsePrice[]>([...mockTimeOfUsePrices])

const timeRanges = [
  { value: 'day', label: '今日' },
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'quarter', label: '本季度' },
  { value: 'year', label: '本年' }
]

function selectTimeRange(range: TimeRange) {
  energyStore.selectedTimeRange = range
  ElMessage.info(`已切换至${timeRanges.find(r => r.value === range)?.label}数据`)
}

const pieData = computed(() => {
  const stats = energyStore.stats
  return [
    { label: '尖峰', value: stats.critical, color: '#EF4444' },
    { label: '峰', value: stats.peak, color: '#F59E0B' },
    { label: '平', value: stats.flat, color: '#3B82F6' },
    { label: '谷', value: stats.valley, color: '#10B981' }
  ]
})

const hourlyData = computed(() => {
  const readings = energyStore.getReadingsByDeviceType('electricity')
  const hourly = aggregateByHour(readings)
  return hourly.map((h, i) => ({
    hour: i,
    value: h.value
  }))
})

const costCalculation = computed(() => {
  const stats = energyStore.stats
  let totalCost = 0
  
  touPrices.value.forEach(price => {
    let energy = 0
    switch (price.period) {
      case 'critical': energy = stats.critical; break
      case 'peak': energy = stats.peak; break
      case 'flat': energy = stats.flat; break
      case 'valley': energy = stats.valley; break
    }
    totalCost += energy * price.price
  })

  return {
    totalCost,
    avgCostPerKwh: totalCost / stats.total
  }
})

function savePrices() {
  isEditing.value = false
}

function updatePrice(index: number, field: keyof TimeOfUsePrice, value: any) {
  touPrices.value[index] = { ...touPrices.value[index], [field]: value }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 bg-bg-secondary rounded-lg p-1 border border-slate-700/50">
          <button
            v-for="range in timeRanges"
            :key="range.value"
            @click="selectTimeRange(range.value as TimeRange)"
            class="px-3 py-1.5 text-sm rounded-md transition-colors"
            :class="energyStore.selectedTimeRange === range.value
              ? 'bg-brand-600 text-white'
              : 'text-slate-400 hover:text-slate-200'"
          >
            {{ range.label }}
          </button>
        </div>
      </div>
      <div class="flex items-center gap-2 text-sm text-slate-400">
        <Clock class="w-4 h-4" />
        <span>统计周期: {{ getTimeRangeText(energyStore.selectedTimeRange) }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card p-5">
        <p class="text-sm text-slate-400 mb-2">尖峰时段电费</p>
        <p class="text-2xl font-mono font-bold text-status-danger">
          ¥{{ formatNumber(energyStore.stats.critical * 1.5) }}
        </p>
        <p class="text-xs text-slate-500 mt-1">{{ formatNumber(energyStore.stats.critical) }} kWh × 1.50 元</p>
      </div>
      <div class="card p-5">
        <p class="text-sm text-slate-400 mb-2">峰时段电费</p>
        <p class="text-2xl font-mono font-bold text-status-warning">
          ¥{{ formatNumber(energyStore.stats.peak * 1.2) }}
        </p>
        <p class="text-xs text-slate-500 mt-1">{{ formatNumber(energyStore.stats.peak) }} kWh × 1.20 元</p>
      </div>
      <div class="card p-5">
        <p class="text-sm text-slate-400 mb-2">平时段电费</p>
        <p class="text-2xl font-mono font-bold text-brand-400">
          ¥{{ formatNumber(energyStore.stats.flat * 0.8) }}
        </p>
        <p class="text-xs text-slate-500 mt-1">{{ formatNumber(energyStore.stats.flat) }} kWh × 0.80 元</p>
      </div>
      <div class="card p-5">
        <p class="text-sm text-slate-400 mb-2">谷时段电费</p>
        <p class="text-2xl font-mono font-bold text-status-success">
          ¥{{ formatNumber(energyStore.stats.valley * 0.4) }}
        </p>
        <p class="text-xs text-slate-500 mt-1">{{ formatNumber(energyStore.stats.valley) }} kWh × 0.40 元</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium text-white">峰谷能耗占比</h3>
          <div class="flex items-center gap-2 text-sm text-slate-400">
            <DollarSign class="w-4 h-4" />
            <span>总计: ¥{{ formatNumber(costCalculation.totalCost) }}</span>
          </div>
        </div>
        <PeakValleyPie :data="pieData" :height="280" />
      </div>

      <div class="lg:col-span-2 card p-5">
        <h3 class="font-medium text-white mb-4">24小时能耗分布</h3>
        <HourlyBarChart :data="hourlyData" :height="280" />
      </div>
    </div>

    <div class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-medium text-white">分时电价配置</h3>
        <button
          @click="isEditing ? savePrices() : (isEditing = true)"
          class="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors"
          :class="isEditing
            ? 'bg-status-success/20 text-status-success hover:bg-status-success/30'
            : 'bg-brand-600/20 text-brand-400 hover:bg-brand-600/30'"
        >
          <component :is="isEditing ? Save : Edit3" class="w-4 h-4" />
          {{ isEditing ? '保存配置' : '编辑配置' }}
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>时段类型</th>
              <th>开始时间</th>
              <th>结束时间</th>
              <th>电价 (元/kWh)</th>
              <th>能耗 (kWh)</th>
              <th>电费 (元)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(price, index) in touPrices" :key="index">
              <td>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="{
                    'bg-status-danger/20 text-status-danger': price.period === 'critical',
                    'bg-status-warning/20 text-status-warning': price.period === 'peak',
                    'bg-brand-600/20 text-brand-400': price.period === 'flat',
                    'bg-status-success/20 text-status-success': price.period === 'valley'
                  }"
                >
                  {{ price.name }}
                </span>
              </td>
              <td>
                <input
                  v-if="isEditing"
                  v-model="price.startTime"
                  type="time"
                  class="bg-bg-tertiary border border-slate-600 rounded px-2 py-1 text-sm text-slate-200"
                  @change="updatePrice(index, 'startTime', ($event.target as HTMLInputElement).value)"
                />
                <span v-else class="font-mono">{{ price.startTime }}</span>
              </td>
              <td>
                <input
                  v-if="isEditing"
                  v-model="price.endTime"
                  type="time"
                  class="bg-bg-tertiary border border-slate-600 rounded px-2 py-1 text-sm text-slate-200"
                  @change="updatePrice(index, 'endTime', ($event.target as HTMLInputElement).value)"
                />
                <span v-else class="font-mono">{{ price.endTime }}</span>
              </td>
              <td>
                <input
                  v-if="isEditing"
                  :value="price.price"
                  type="number"
                  step="0.01"
                  min="0"
                  class="bg-bg-tertiary border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 w-20 font-mono"
                  @change="updatePrice(index, 'price', parseFloat(($event.target as HTMLInputElement).value))"
                />
                <span v-else class="font-mono">{{ price.price.toFixed(2) }}</span>
              </td>
              <td class="font-mono">
                {{ formatNumber(
                  price.period === 'critical' ? energyStore.stats.critical :
                  price.period === 'peak' ? energyStore.stats.peak :
                  price.period === 'flat' ? energyStore.stats.flat :
                  energyStore.stats.valley
                ) }}
              </td>
              <td class="font-mono text-slate-300">
                ¥{{ formatNumber(
                  (price.period === 'critical' ? energyStore.stats.critical :
                  price.period === 'peak' ? energyStore.stats.peak :
                  price.period === 'flat' ? energyStore.stats.flat :
                  energyStore.stats.valley) * price.price
                ) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 p-4 bg-brand-600/10 border border-brand-500/20 rounded-lg">
        <p class="text-sm text-brand-300">
          <strong>优化建议：</strong>当前峰时段能耗占比较高（38%），建议将部分可调度负荷转移至谷时段，预计可节省电费约 <strong class="text-status-success">¥{{ formatNumber(costCalculation.totalCost * 0.1) }}</strong>（10%）
        </p>
      </div>
    </div>
  </div>
</template>
