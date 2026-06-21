<template>
  <div class="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 overflow-hidden relative">
    <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-deep-blue-500 via-deep-blue-600 to-amber-gold-500"></div>
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-500">{{ title }}</p>
        <div class="mt-2 flex items-baseline">
          <component
            :is="useGradientText"
            v-if="useGradientText"
            type="success"
            size="xlarge"
            class="font-charter font-bold"
          >
            <template #default>{{ displayValue }}</template>
          </component>
          <span v-else class="text-3xl font-charter font-bold text-deep-blue-900">{{ displayValue }}</span>
          <span v-if="suffix" class="ml-1 text-sm text-slate-400">{{ suffix }}</span>
        </div>
        <div class="mt-2 flex items-center space-x-2" v-if="showMom">
          <span
            class="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
            :class="momClass"
          >
            <NIcon :size="12" class="mr-0.5">
              <ArrowUpOutlined v-if="mom >= 0" />
              <ArrowDownOutlined v-else />
            </NIcon>
            {{ Math.abs(mom) }}%
          </span>
          <span class="text-xs text-slate-400">环比</span>
        </div>
      </div>
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-4"
        :class="iconBgClass"
      >
        <NIcon :size="24" :color="iconColor">
          <component :is="icon" />
        </NIcon>
      </div>
    </div>
    <div class="mt-4 h-14 -mx-5 -mb-5" v-if="trendData.length > 0">
      <v-chart :option="miniChartOption" autoresize autoresize-root />
    </div>
    <div class="mt-4" v-else-if="showProgress">
      <NProgress
        :percentage="Number(value)"
        :gradient="progressGradient"
        :stroke-width="8"
        :show-indicator="false"
        type="line"
      />
      <p class="text-xs text-slate-400 mt-1.5">{{ progressHint || `目标完成度 ${value}%` }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, type Component } from 'vue'
import { NIcon, NProgress, NGradientText, useThemeVars } from 'naive-ui'
import { ArrowUpOutlined, ArrowDownOutlined } from '@vicons/antd'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

interface Props {
  title: string
  value: number | string
  suffix?: string
  mom?: number
  icon?: Component
  iconBgClass?: string
  iconColor?: string
  trendData?: [number, number][]
  showMom?: boolean
  showProgress?: boolean
  progressHint?: string
  useGradient?: boolean
  gradientColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  mom: 0,
  iconBgClass: 'bg-deep-blue-50',
  iconColor: '#0B4F8C',
  trendData: () => [],
  showMom: true,
  showProgress: false,
  useGradient: false
})

const useGradientText = computed(() => (props.useGradient ? NGradientText : null))

const displayValue = computed(() => {
  if (typeof props.value === 'number') {
    if (props.value >= 10000) {
      return (props.value / 10000).toFixed(1) + 'w'
    }
    if (Number.isInteger(props.value)) return props.value.toString()
    return props.value.toFixed(2)
  }
  return props.value
})

const momClass = computed(() => {
  if (props.mom >= 0) return 'bg-emerald-50 text-emerald-600'
  return 'bg-red-50 text-red-600'
})

const themeVars = useThemeVars()

const progressGradient = computed(() => ({
  from: '#0B4F8C',
  to: '#D4A853'
}))

const miniChartOption = computed(() => ({
  grid: { top: 5, right: 0, bottom: 5, left: 0 },
  xAxis: {
    type: 'category',
    show: false,
    data: props.trendData.map((d) => d[0])
  },
  yAxis: { type: 'value', show: false, min: (value: { min: number }) => value.min * 0.9 },
  tooltip: {
    trigger: 'axis',
    confine: true,
    textStyle: { fontSize: 11, color: '#fff' },
    backgroundColor: 'rgba(11,79,140,0.95)',
    borderWidth: 0
  },
  series: [
    {
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: {
        width: 2,
        color: '#0B4F8C'
      },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(11,79,140,0.25)' },
            { offset: 1, color: 'rgba(11,79,140,0.02)' }
          ]
        }
      },
      data: props.trendData.map((d) => d[1])
    }
  ]
}))
</script>
