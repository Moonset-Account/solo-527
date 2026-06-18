<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { predictionsApi } from '@/api'
import type { Prediction, FunnelData } from '@/types'
import ScoreBar from '@/components/common/ScoreBar.vue'
import DataTable from '@/components/common/DataTable.vue'

use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const predictions = ref<Prediction[]>([])
const funnelData = ref<FunnelData[]>([])
const riskLeads = ref<Prediction[]>([])
const loading = ref(false)

const columns = [
  { key: 'leadName', label: '线索名称' },
  { key: 'score', label: '预测评分', width: '200px' },
  { key: 'riskLevel', label: '风险等级' },
  { key: 'factors', label: '关键因素' },
  { key: 'lastUpdated', label: '更新时间' },
]

const riskLevelMap: Record<string, { label: string; class: string }> = {
  low: { label: '低风险', class: 'bg-emerald-100 text-emerald-700' },
  medium: { label: '中风险', class: 'bg-amber-100 text-amber-700' },
  high: { label: '高风险', class: 'bg-red-100 text-red-700' },
}

const funnelOption = ref<Record<string, unknown>>({})

function buildFunnelOption(data: FunnelData[]) {
  funnelOption.value = {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 80, right: 40, top: 20, bottom: 30 },
    xAxis: { type: 'value' as const },
    yAxis: {
      type: 'category' as const,
      data: data.map((d) => d.stage),
      axisLabel: { color: '#64748B' },
    },
    series: [
      {
        type: 'bar',
        data: data.map((d) => ({
          value: d.count,
          itemStyle: { color: '#F59E0B', borderRadius: [0, 4, 4, 0] },
        })),
        barWidth: 24,
        label: {
          show: true,
          position: 'right' as const,
          formatter: '{c}',
          color: '#1E293B',
          fontSize: 12,
        },
      },
    ],
  }
}

async function fetchData() {
  loading.value = true
  try {
    const [predRes, funnelRes, riskRes] = await Promise.all([
      predictionsApi.list(),
      predictionsApi.funnel(),
      predictionsApi.risks(),
    ])
    predictions.value = predRes.data.list
    funnelData.value = funnelRes.data
    riskLeads.value = riskRes.data
    buildFunnelOption(funnelData.value)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-xl font-semibold text-slate-800">转化预测</h1>

    <div class="bg-white rounded-lg border border-slate-200 p-5">
      <h3 class="font-medium text-slate-800 mb-4">转化漏斗</h3>
      <VChart v-if="funnelData.length" :option="funnelOption" style="height: 300px" autoresize />
      <div v-else class="text-center text-slate-400 py-8">暂无漏斗数据</div>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 p-5">
      <h3 class="font-medium text-slate-800 mb-4">预测列表</h3>
      <DataTable :columns="columns" :data="(predictions as any)" :loading="loading">
        <template #score="{ row }">
          <ScoreBar :score="(row as any).score" />
        </template>
        <template #riskLevel="{ row }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            :class="riskLevelMap[(row as any).riskLevel]?.class"
          >
            {{ riskLevelMap[(row as any).riskLevel]?.label }}
          </span>
        </template>
        <template #factors="{ row }">
          <div class="flex flex-wrap gap-1">
            <span
              v-for="f in (row as any).factors?.slice(0, 3)"
              :key="f"
              class="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-600"
            >
              {{ f }}
            </span>
          </div>
        </template>
      </DataTable>
    </div>

    <div class="bg-white rounded-lg border border-slate-200 p-5">
      <h3 class="font-medium text-slate-800 mb-4 flex items-center gap-2">
        <span class="w-2 h-2 bg-red-500 rounded-full"></span>
        高风险线索
      </h3>
      <div class="grid grid-cols-3 gap-4">
        <div
          v-for="risk in riskLeads"
          :key="risk.id"
          class="p-4 rounded-lg border-2 border-red-200 bg-red-50/50"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-slate-800">{{ risk.leadName }}</span>
            <span class="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">高风险</span>
          </div>
          <ScoreBar :score="risk.score" />
          <div class="mt-2">
            <span
              v-for="f in risk.factors?.slice(0, 2)"
              :key="f"
              class="inline-block px-1.5 py-0.5 bg-white rounded text-xs text-slate-500 mr-1"
            >
              {{ f }}
            </span>
          </div>
        </div>
        <div v-if="!riskLeads.length" class="col-span-3 text-center text-slate-400 py-8">
          暂无高风险线索
        </div>
      </div>
    </div>
  </div>
</template>
