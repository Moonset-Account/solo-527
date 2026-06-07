<script setup lang="ts">
import { computed, watch } from 'vue'
import { Zap, Droplets, Wind, Building2, Clock, AlertCircle } from 'lucide-vue-next'
import { useEnergyStore } from '@/stores/energy'
import MetricCard from '@/components/common/MetricCard.vue'
import EnergyLineChart from '@/components/charts/EnergyLineChart.vue'
import { aggregateByHour, formatNumber, getDeviceTypeLabel, getStatusLabel } from '@/utils'
import type { Dimension, TimeRange } from '@/types'
import { ElMessage } from 'element-plus'

const energyStore = useEnergyStore()

const dimensions = [
  { value: 'building', label: '楼栋' },
  { value: 'floor', label: '楼层' },
  { value: 'tenant', label: '租户' },
  { value: 'device', label: '设备' }
]

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

function selectDimension(dim: Dimension) {
  energyStore.selectedDimension = dim
  if (dim === 'floor') {
    energyStore.selectedDimensionId = 'flr-001'
  } else if (dim === 'tenant') {
    energyStore.selectedDimensionId = 'ten-001'
  } else if (dim === 'device') {
    energyStore.selectedDimensionId = 'dev-001'
  }
  const dimLabel = dimensions.find(d => d.value === dim)?.label
  ElMessage.info(`已切换至${dimLabel}维度`)
}

watch(() => energyStore.selectedTimeRange, () => {
  energyStore.refreshData()
})

const electricityData = computed(() => {
  const readings = energyStore.getReadingsByDeviceType('electricity')
  return aggregateByHour(readings)
})

const waterData = computed(() => {
  const readings = energyStore.getReadingsByDeviceType('water')
  return aggregateByHour(readings)
})

const hvacData = computed(() => {
  const readings = energyStore.getReadingsByDeviceType('hvac')
  return aggregateByHour(readings)
})

const totalElectricity = computed(() => 
  energyStore.getReadingsByDeviceType('electricity')
    .filter(r => !r.isOffline)
    .reduce((sum, r) => sum + r.value, 0)
)

const totalWater = computed(() => 
  energyStore.getReadingsByDeviceType('water')
    .filter(r => !r.isOffline)
    .reduce((sum, r) => sum + r.value, 0)
)

const totalHVAC = computed(() => 
  energyStore.getReadingsByDeviceType('hvac')
    .filter(r => !r.isOffline)
    .reduce((sum, r) => sum + r.value, 0)
)

const deviceStats = computed(() => {
  const filtered = energyStore.filteredDevices
  return {
    total: filtered.length,
    online: filtered.filter(d => d.status === 'online').length,
    offline: filtered.filter(d => d.status === 'offline').length,
    warning: filtered.filter(d => d.status === 'warning').length
  }
})
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

        <div class="flex items-center gap-2 bg-bg-secondary rounded-lg p-1 border border-slate-700/50">
          <button
            v-for="dim in dimensions"
            :key="dim.value"
            @click="selectDimension(dim.value as Dimension)"
            class="px-3 py-1.5 text-sm rounded-md transition-colors"
            :class="energyStore.selectedDimension === dim.value
              ? 'bg-brand-600 text-white'
              : 'text-slate-400 hover:text-slate-200'"
          >
            {{ dim.label }}
          </button>
        </div>

        <select
          v-if="energyStore.selectedDimension === 'floor'"
          v-model="energyStore.selectedDimensionId"
          class="bg-bg-tertiary border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-brand-500"
        >
          <option v-for="floor in energyStore.floors" :key="floor.id" :value="floor.id">
            {{ floor.name }}
          </option>
        </select>

        <select
          v-if="energyStore.selectedDimension === 'tenant'"
          v-model="energyStore.selectedDimensionId"
          class="bg-bg-tertiary border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-brand-500"
        >
          <option v-for="tenant in energyStore.tenants" :key="tenant.id" :value="tenant.id">
            {{ tenant.name }}
          </option>
        </select>

        <select
          v-if="energyStore.selectedDimension === 'device'"
          v-model="energyStore.selectedDimensionId"
          class="bg-bg-tertiary border border-slate-600 rounded-lg px-2 py-1.5 text-sm text-slate-200 outline-none focus:border-brand-500"
        >
          <option v-for="device in energyStore.devices" :key="device.id" :value="device.id">
            {{ device.name }}
          </option>
        </select>
      </div>

      <div class="flex items-center gap-2 text-sm text-slate-400">
        <Clock class="w-4 h-4" />
        <span>数据样本: {{ energyStore.stats.sampleCount }} / {{ energyStore.stats.totalSamples }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="总用电量"
        :value="formatNumber(totalElectricity)"
        unit="kWh"
        :trend="5.2"
        :icon="Zap"
        color="#3B82F6"
      />
      <MetricCard
        title="总用水量"
        :value="formatNumber(totalWater)"
        unit="m³"
        :trend="-2.8"
        :icon="Droplets"
        color="#06B6D4"
      />
      <MetricCard
        title="空调能耗"
        :value="formatNumber(totalHVAC)"
        unit="kWh"
        :trend="8.5"
        :icon="Wind"
        color="#8B5CF6"
      />
      <MetricCard
        title="设备在线率"
        :value="formatNumber((deviceStats.online / deviceStats.total) * 100, 1)"
        unit="%"
        :icon="Building2"
        color="#10B981"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium text-white">能耗趋势图</h3>
          <div class="flex items-center gap-4 text-sm">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-chart-electricity"></span>
              <span class="text-slate-400">电力</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-chart-water"></span>
              <span class="text-slate-400">水</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-chart-hvac"></span>
              <span class="text-slate-400">空调</span>
            </div>
          </div>
        </div>
        <EnergyLineChart
          :data="electricityData"
          color="#3B82F6"
          :height="250"
        />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <EnergyLineChart
            :data="waterData"
            color="#06B6D4"
            :height="150"
            title="用水趋势"
          />
          <EnergyLineChart
            :data="hvacData"
            color="#8B5CF6"
            :height="150"
            title="空调能耗趋势"
          />
        </div>
      </div>

      <div class="space-y-6">
        <div class="card p-5">
          <h3 class="font-medium text-white mb-4">设备状态概览</h3>
          <div class="grid grid-cols-3 gap-3 mb-4">
            <div class="text-center p-3 bg-bg-tertiary/50 rounded-lg">
              <div class="text-2xl font-mono font-bold text-status-success">{{ deviceStats.online }}</div>
              <div class="text-xs text-slate-400 mt-1">在线</div>
            </div>
            <div class="text-center p-3 bg-bg-tertiary/50 rounded-lg">
              <div class="text-2xl font-mono font-bold text-status-warning">{{ deviceStats.warning }}</div>
              <div class="text-xs text-slate-400 mt-1">异常</div>
            </div>
            <div class="text-center p-3 bg-bg-tertiary/50 rounded-lg">
              <div class="text-2xl font-mono font-bold text-status-danger">{{ deviceStats.offline }}</div>
              <div class="text-xs text-slate-400 mt-1">离线</div>
            </div>
          </div>
          
          <div v-if="deviceStats.offline > 0" class="space-y-2">
            <div class="flex items-center gap-2 text-sm text-status-danger mb-2">
              <AlertCircle class="w-4 h-4" />
              <span>离线设备列表</span>
            </div>
            <div
              v-for="device in energyStore.filteredDevices.filter(d => d.status === 'offline')"
              :key="device.id"
              class="flex items-center justify-between p-2 bg-status-danger/10 rounded-lg border border-status-danger/20"
            >
              <div>
                <p class="text-sm text-slate-200">{{ device.name }}</p>
                <p class="text-xs text-slate-400">{{ getDeviceTypeLabel(device.type) }} · {{ device.location }}</p>
              </div>
              <span class="text-xs px-2 py-0.5 bg-status-danger/20 text-status-danger rounded">
                {{ getStatusLabel(device.status) }}
              </span>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="font-medium text-white mb-4">最近告警</h3>
          <div class="space-y-3">
            <div
              v-for="alert in energyStore.openAlerts.slice(0, 3)"
              :key="alert.id"
              class="flex items-start gap-3 p-3 bg-bg-tertiary/30 rounded-lg"
            >
              <div
                class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                :class="{
                  'bg-status-danger': alert.level === 'critical',
                  'bg-status-warning': alert.level === 'warning',
                  'bg-status-info': alert.level === 'info'
                }"
              ></div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-slate-200 truncate">{{ alert.message }}</p>
                <p class="text-xs text-slate-500 mt-1">{{ alert.deviceName }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
