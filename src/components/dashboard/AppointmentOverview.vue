<script setup lang="ts">
import { computed } from 'vue'
import { CalendarCheck, Users, CheckCircle, XCircle } from 'lucide-vue-next'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useAppointmentsStore } from '@/stores/appointments'

use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])

const appointmentsStore = useAppointmentsStore()
const stats = computed(() => appointmentsStore.todayStats)

const chartOption = computed(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {d}%' },
  series: [{
    type: 'pie',
    radius: ['55%', '80%'],
    center: ['50%', '50%'],
    avoidLabelOverlap: false,
    label: {
      show: true,
      position: 'center',
      formatter: `{d}%`,
      fontSize: 20,
      fontWeight: 'bold',
      color: '#B76E79',
    },
    data: [
      { value: stats.value.visitRate, name: '到店率', itemStyle: { color: '#7BC8A4' } },
      { value: 100 - stats.value.visitRate, name: '未到店', itemStyle: { color: '#F0E0E3' } },
    ],
  }],
}))
</script>

<template>
  <div class="bg-white rounded-xl border border-rosegold/10 p-5">
    <div class="flex items-center gap-2 mb-4">
      <CalendarCheck class="w-5 h-5 text-rosegold" />
      <h3 class="text-sm font-medium text-gray-800">今日预约概览</h3>
    </div>
    <div class="flex items-center gap-6">
      <div class="w-36 h-36 flex-shrink-0">
        <VChart :option="chartOption" autoresize class="w-full h-full" />
      </div>
      <div class="flex-1 space-y-3">
        <div class="flex items-center gap-3">
          <Users class="w-4 h-4 text-rosegold" />
          <span class="text-sm text-grayrose">总预约</span>
          <span class="ml-auto text-lg font-semibold text-gray-800">{{ stats.total }}</span>
        </div>
        <div class="flex items-center gap-3">
          <CheckCircle class="w-4 h-4 text-mint" />
          <span class="text-sm text-grayrose">已完成</span>
          <span class="ml-auto text-lg font-semibold text-mint">{{ stats.completed }}</span>
        </div>
        <div class="flex items-center gap-3">
          <XCircle class="w-4 h-4 text-coral" />
          <span class="text-sm text-grayrose">未到店</span>
          <span class="ml-auto text-lg font-semibold text-coral">{{ stats.noShow }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
