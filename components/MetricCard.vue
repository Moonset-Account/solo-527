<template>
  <div class="card p-5 hover:shadow-card-hover transition-all duration-300 group cursor-pointer">
    <div class="flex items-start justify-between mb-3">
      <div>
        <p class="text-sm text-slate-500 mb-1">{{ title }}</p>
        <div class="flex items-baseline gap-2">
          <span class="text-2xl font-bold text-slate-800 font-mono animate-number-roll">
            {{ displayValue }}
          </span>
          <span class="text-sm text-slate-400">{{ unit }}</span>
        </div>
      </div>
      <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="iconBgClass">
        <component :is="icon" class="w-5 h-5" :class="iconColorClass" />
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1" :class="yoyClass">
          <TrendingUp v-if="yoy >= 0" class="w-4 h-4" />
          <TrendingDown v-else class="w-4 h-4" />
          <span class="text-sm font-medium">同比 {{ formatPercent(Math.abs(yoy)) }}</span>
        </div>
        <div class="flex items-center gap-1" :class="momClass">
          <TrendingUp v-if="mom >= 0" class="w-3.5 h-3.5" />
          <TrendingDown v-else class="w-3.5 h-3.5" />
          <span class="text-xs">环比 {{ formatPercent(Math.abs(mom)) }}</span>
        </div>
      </div>

      <div class="h-8 w-20">
        <canvas ref="miniChartRef"></canvas>
      </div>
    </div>

    <div v-if="trendData && trendData.length > 0" class="mt-3 pt-3 border-t border-slate-100">
      <div class="flex items-center justify-between text-xs">
        <span class="text-slate-400">趋势</span>
        <span class="text-slate-500">近{{ trendData.length }}天</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { TrendingUp, TrendingDown } from 'lucide-vue-next'
import { formatNumber, formatPercent } from '~/utils/format'

const props = withDefaults(defineProps<{
  title: string
  value: number
  unit?: string
  yoy: number
  mom: number
  icon?: any
  iconBgClass?: string
  iconColorClass?: string
  trendData?: { date: string; value: number }[]
  decimals?: number
}>(), {
  unit: '',
  decimals: 2,
  icon: TrendingUp,
  iconBgClass: 'bg-primary-50',
  iconColorClass: 'text-primary-500'
})

const miniChartRef = ref<HTMLCanvasElement | null>(null)

const displayValue = computed(() => formatNumber(props.value, props.decimals))

const yoyClass = computed(() => 
  props.yoy >= 0 ? 'text-success-600' : 'text-danger-600'
)

const momClass = computed(() => 
  props.mom >= 0 ? 'text-success-500' : 'text-danger-500'
)

const drawMiniChart = () => {
  if (!miniChartRef.value || !props.trendData || props.trendData.length === 0) return

  const canvas = miniChartRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const width = rect.width
  const height = rect.height
  const data = props.trendData.map(d => d.value)
  
  const minVal = Math.min(...data)
  const maxVal = Math.max(...data)
  const range = maxVal - minVal || 1

  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  const isPositive = data[data.length - 1] >= data[0]
  const color = isPositive ? '#2ECC71' : '#E74C3C'
  
  gradient.addColorStop(0, color + '30')
  gradient.addColorStop(1, color + '05')

  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((val - minVal) / range) * (height - 4) - 2
  }))

  ctx.beginPath()
  ctx.moveTo(points[0].x, height)
  
  points.forEach((point, i) => {
    if (i === 0) {
      ctx.lineTo(point.x, point.y)
    } else {
      const prev = points[i - 1]
      const cpX = (prev.x + point.x) / 2
      ctx.quadraticCurveTo(prev.x, prev.y, cpX, (prev.y + point.y) / 2)
    }
  })
  
  ctx.lineTo(points[points.length - 1].x, height)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.beginPath()
  points.forEach((point, i) => {
    if (i === 0) {
      ctx.moveTo(point.x, point.y)
    } else {
      const prev = points[i - 1]
      const cpX = (prev.x + point.x) / 2
      ctx.quadraticCurveTo(prev.x, prev.y, cpX, (prev.y + point.y) / 2)
    }
  })
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
  ctx.strokeStyle = color
  ctx.lineWidth = 1.5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
}

onMounted(() => {
  nextTick(() => {
    drawMiniChart()
  })
})

watch(() => props.trendData, () => {
  nextTick(() => {
    drawMiniChart()
  })
}, { deep: true })
</script>
