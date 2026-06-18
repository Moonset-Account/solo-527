<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { reportsApi } from '@/api'
import type { LeadQualityReport, ContractPendingReason, ProcessingTimeReport, PersonPerformance } from '@/types'
import DataTable from '@/components/common/DataTable.vue'

use([BarChart, LineChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer])

const activeTab = ref<'quality' | 'contract' | 'processing' | 'performance'>('quality')

const qualityData = ref<LeadQualityReport[]>([])
const contractData = ref<ContractPendingReason[]>([])
const processingData = ref<ProcessingTimeReport[]>([])
const performanceData = ref<PersonPerformance[]>([])

const qualityOption = ref<Record<string, unknown>>({})
const contractOption = ref<Record<string, unknown>>({})
const processingOption = ref<Record<string, unknown>>({})

const qualityColumns = [
  { key: 'source', label: '来源渠道' },
  { key: 'count', label: '线索数' },
  { key: 'conversionRate', label: '转化率' },
  { key: 'avgScore', label: '平均评分' },
]

const performanceColumns = [
  { key: 'personName', label: '负责人' },
  { key: 'leadsCount', label: '线索数' },
  { key: 'followupRate', label: '回访率' },
  { key: 'closeRate', label: '成交率' },
  { key: 'avgScore', label: '平均评分' },
]

function buildQualityOption(data: LeadQualityReport[]) {
  qualityOption.value = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['线索数', '转化率'], textStyle: { color: '#64748B' } },
    grid: { left: 50, right: 50, top: 40, bottom: 30 },
    xAxis: { type: 'category' as const, data: data.map((d) => d.source), axisLabel: { color: '#64748B' } },
    yAxis: [
      { type: 'value' as const, name: '线索数', axisLabel: { color: '#64748B' } },
      { type: 'value' as const, name: '转化率', axisLabel: { color: '#64748B', formatter: '{value}%' } },
    ],
    series: [
      { name: '线索数', type: 'bar', data: data.map((d) => d.count), itemStyle: { color: '#F59E0B', borderRadius: [4, 4, 0, 0] }, barWidth: 24 },
      { name: '转化率', type: 'line', yAxisIndex: 1, data: data.map((d) => d.conversionRate), itemStyle: { color: '#10B981' }, lineStyle: { color: '#10B981' } },
    ],
  }
}

function buildContractOption(data: ContractPendingReason[]) {
  contractOption.value = {
    tooltip: { trigger: 'axis' as const },
    legend: { textStyle: { color: '#64748B' } },
    grid: { left: 80, right: 20, top: 40, bottom: 30 },
    xAxis: { type: 'value' as const },
    yAxis: { type: 'category' as const, data: data.map((d) => d.reason), axisLabel: { color: '#64748B' } },
    series: [{ type: 'bar', data: data.map((d) => ({ value: d.count, itemStyle: { color: '#F59E0B', borderRadius: [0, 4, 4, 0] } })), barWidth: 20, stack: 'total' }],
  }
}

function buildProcessingOption(data: ProcessingTimeReport[]) {
  processingOption.value = {
    tooltip: { trigger: 'axis' as const },
    grid: { left: 80, right: 40, top: 20, bottom: 30 },
    xAxis: { type: 'value' as const, name: '平均耗时(h)', axisLabel: { color: '#64748B' } },
    yAxis: { type: 'category' as const, data: data.map((d) => d.stage), axisLabel: { color: '#64748B' } },
    series: [{ type: 'bar', data: data.map((d) => ({ value: d.avgHours, itemStyle: { color: d.overtimeRate > 0.3 ? '#EF4444' : '#10B981', borderRadius: [0, 4, 4, 0] } })), barWidth: 20 }],
  }
}

async function fetchTabData() {
  switch (activeTab.value) {
    case 'quality': {
      const { data } = await reportsApi.leadQuality()
      qualityData.value = data
      buildQualityOption(data)
      break
    }
    case 'contract': {
      const { data } = await reportsApi.contractPending()
      contractData.value = data
      buildContractOption(data)
      break
    }
    case 'processing': {
      const { data } = await reportsApi.processingTime()
      processingData.value = data
      buildProcessingOption(data)
      break
    }
    case 'performance': {
      const { data } = await reportsApi.performance()
      performanceData.value = data.sort((a, b) => b.avgScore - a.avgScore)
      break
    }
  }
}

const tabs = [
  { key: 'quality' as const, label: '线索质量' },
  { key: 'contract' as const, label: '合同待确认' },
  { key: 'processing' as const, label: '处理耗时' },
  { key: 'performance' as const, label: '责任人绩效' },
]

watch(activeTab, fetchTabData)
onMounted(fetchTabData)
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-xl font-semibold text-slate-800">报表中心</h1>

    <div class="flex bg-slate-100 rounded-md p-0.5 w-fit">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="px-4 py-2 text-sm rounded-md transition-colors"
        :class="activeTab === tab.key ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <template v-if="activeTab === 'quality'">
      <div class="bg-white rounded-lg border border-slate-200 p-5">
        <h3 class="font-medium text-slate-800 mb-4">线索质量分析</h3>
        <VChart v-if="qualityData.length" :option="qualityOption" style="height: 350px" autoresize />
        <div v-else class="text-center text-slate-400 py-8">暂无数据</div>
      </div>
      <div class="bg-white rounded-lg border border-slate-200 p-5">
        <DataTable :columns="qualityColumns" :data="(qualityData as any)">
          <template #conversionRate="{ row }">
            <span class="text-sm font-medium" :class="(row as any).conversionRate >= 20 ? 'text-emerald-600' : 'text-amber-600'">
              {{ (row as any).conversionRate }}%
            </span>
          </template>
        </DataTable>
      </div>
    </template>

    <template v-if="activeTab === 'contract'">
      <div class="bg-white rounded-lg border border-slate-200 p-5">
        <h3 class="font-medium text-slate-800 mb-4">合同待确认原因分析</h3>
        <VChart v-if="contractData.length" :option="contractOption" style="height: 300px" autoresize />
        <div v-else class="text-center text-slate-400 py-8">暂无数据</div>
      </div>
      <div class="bg-white rounded-lg border border-slate-200 p-5">
        <div
          v-for="item in contractData"
          :key="item.reason"
          class="p-4 border-b border-slate-100 last:border-0"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-slate-800">{{ item.reason }}</span>
            <span class="text-sm text-amber-600">{{ item.count }}条</span>
          </div>
          <div class="text-xs text-slate-400">
            涉及线索：{{ item.details?.map((d) => d.leadName).join('、') }}
          </div>
        </div>
      </div>
    </template>

    <template v-if="activeTab === 'processing'">
      <div class="bg-white rounded-lg border border-slate-200 p-5">
        <h3 class="font-medium text-slate-800 mb-4">各阶段处理耗时</h3>
        <VChart v-if="processingData.length" :option="processingOption" style="height: 300px" autoresize />
        <div v-else class="text-center text-slate-400 py-8">暂无数据</div>
      </div>
      <div class="bg-white rounded-lg border border-slate-200 p-5">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-200">
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500">阶段</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500">平均耗时</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500">超时率</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in processingData" :key="item.stage" class="hover:bg-slate-50">
              <td class="px-4 py-3 text-sm text-slate-700">{{ item.stage }}</td>
              <td class="px-4 py-3 text-sm text-slate-700">{{ item.avgHours }}h</td>
              <td class="px-4 py-3 text-sm" :class="item.overtimeRate > 0.3 ? 'text-red-600 font-medium' : 'text-emerald-600'">
                {{ (item.overtimeRate * 100).toFixed(1) }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-if="activeTab === 'performance'">
      <div class="bg-white rounded-lg border border-slate-200 p-5">
        <DataTable :columns="performanceColumns" :data="(performanceData as any)">
          <template #followupRate="{ row }">
            <span class="text-sm font-medium" :class="(row as any).followupRate >= 80 ? 'text-emerald-600' : 'text-amber-600'">
              {{ (row as any).followupRate }}%
            </span>
          </template>
          <template #closeRate="{ row }">
            <span class="text-sm font-medium" :class="(row as any).closeRate >= 20 ? 'text-emerald-600' : 'text-slate-600'">
              {{ (row as any).closeRate }}%
            </span>
          </template>
          <template #avgScore="{ row }">
            <span class="text-sm font-medium" :class="(row as any).avgScore >= 70 ? 'text-emerald-600' : 'text-amber-600'">
              {{ (row as any).avgScore }}
            </span>
          </template>
        </DataTable>
      </div>
    </template>
  </div>
</template>
