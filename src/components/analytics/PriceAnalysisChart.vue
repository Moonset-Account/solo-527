<script setup lang="ts">
import { computed } from 'vue'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useAnalyticsStore } from '@/stores/analytics'

use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const analyticsStore = useAnalyticsStore()

const trendIcon = { up: TrendingUp, down: TrendingDown, stable: Minus }
const trendColor = { up: 'text-mint', down: 'text-coral', stable: 'text-grayrose' }
const trendLabel = { up: '上升', down: '下降', stable: '稳定' }

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: '#fff',
    borderColor: '#B76E7930',
    textStyle: { color: '#666', fontSize: 12 },
  },
  legend: {
    data: ['售价', '成本'],
    top: 0,
    textStyle: { color: '#9E8A8F', fontSize: 12 },
  },
  grid: { left: 60, right: 20, top: 40, bottom: 60 },
  xAxis: {
    type: 'category',
    data: analyticsStore.priceAnalysis.map((s) => s.serviceName),
    axisLabel: { color: '#9E8A8F', fontSize: 10, rotate: 30 },
    axisLine: { lineStyle: { color: '#B76E7920' } },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#9E8A8F', fontSize: 11, formatter: (v: number) => `¥${v}` },
    splitLine: { lineStyle: { color: '#B76E7910' } },
  },
  series: [
    {
      name: '售价',
      type: 'bar',
      data: analyticsStore.priceAnalysis.map((s) => s.sellingPrice),
      itemStyle: { color: '#B76E79', borderRadius: [4, 4, 0, 0] },
      barGap: '10%',
    },
    {
      name: '成本',
      type: 'bar',
      data: analyticsStore.priceAnalysis.map((s) => s.costPrice),
      itemStyle: { color: '#9E8A8F50', borderRadius: [4, 4, 0, 0] },
    },
  ],
}))
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white rounded-xl border border-rosegold/10 p-5">
      <h3 class="text-sm font-medium text-gray-800 mb-4">项目价格 vs 成本</h3>
      <div class="h-80">
        <VChart :option="chartOption" autoresize class="w-full h-full" />
      </div>
    </div>
    <div class="bg-white rounded-xl border border-rosegold/10 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-rosegold/10 bg-warmwhite">
            <th class="px-4 py-3 text-left text-xs font-medium text-grayrose">服务项目</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-grayrose">分类</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-grayrose">售价</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-grayrose">成本</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-grayrose">利润率</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-grayrose">月用量</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-grayrose">趋势</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in analyticsStore.priceAnalysis"
            :key="item.id"
            class="border-b border-rosegold/5 hover:bg-rosegold/[0.02] transition-colors"
          >
            <td class="px-4 py-3 text-sm font-medium text-gray-800">{{ item.serviceName }}</td>
            <td class="px-4 py-3 text-sm text-grayrose">{{ item.category }}</td>
            <td class="px-4 py-3 text-sm text-right text-gray-800">¥{{ item.sellingPrice }}</td>
            <td class="px-4 py-3 text-sm text-right text-grayrose">¥{{ item.costPrice }}</td>
            <td class="px-4 py-3 text-sm text-right font-medium text-mint">{{ item.profitMargin }}%</td>
            <td class="px-4 py-3 text-sm text-center text-gray-800">{{ item.monthlyUsage }}</td>
            <td class="px-4 py-3 text-center">
              <span :class="['inline-flex items-center gap-1 text-xs', trendColor[item.trend]]">
                <component :is="trendIcon[item.trend]" class="w-3.5 h-3.5" />
                {{ trendLabel[item.trend] }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
