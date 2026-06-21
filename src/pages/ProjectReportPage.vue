<script setup lang="ts">
import { computed } from 'vue'
import { FileDown, FileSpreadsheet } from 'lucide-vue-next'
import { useProjectStore } from '@/stores/project'
import ChartWrapper from '@/components/ChartWrapper.vue'

const store = useProjectStore()

const consumptionOption = computed(() => ({
  tooltip: { trigger: 'axis', backgroundColor: '#1E293B', borderColor: '#334E68', textStyle: { color: '#F0F4F8' } },
  grid: { left: 80, right: 20, top: 20, bottom: 30 },
  xAxis: { type: 'value', axisLabel: { color: '#9FB3C8', formatter: '¥{0}' }, splitLine: { lineStyle: { color: 'rgba(51,78,104,0.3)' } } },
  yAxis: { type: 'category', data: store.consumptionData.map(d => d.name), axisLabel: { color: '#9FB3C8' }, axisLine: { lineStyle: { color: '#334E68' } } },
  series: [{ type: 'bar', data: store.consumptionData.map(d => d.value), barWidth: 20, itemStyle: { color: '#0D9488', borderRadius: [0, 4, 4, 0] } }]
}))

const budgetOption = computed(() => ({
  tooltip: { trigger: 'axis', backgroundColor: '#1E293B', borderColor: '#334E68', textStyle: { color: '#F0F4F8' } },
  legend: { data: ['预算', '支出'], textStyle: { color: '#9FB3C8' } },
  grid: { left: 50, right: 20, top: 40, bottom: 30 },
  xAxis: { type: 'category', data: store.budgetComparison.map(d => d.name), axisLabel: { color: '#9FB3C8' }, axisLine: { lineStyle: { color: '#334E68' } } },
  yAxis: { type: 'value', axisLabel: { color: '#9FB3C8', formatter: '¥{0}' }, splitLine: { lineStyle: { color: 'rgba(51,78,104,0.3)' } } },
  series: [
    { name: '预算', type: 'bar', data: store.budgetComparison.map(d => d.budget), barWidth: 20, itemStyle: { color: '#334E68', borderRadius: [4, 4, 0, 0] } },
    { name: '支出', type: 'bar', data: store.budgetComparison.map(d => d.spent), barWidth: 20, itemStyle: { color: '#0D9488', borderRadius: [4, 4, 0, 0] } },
  ]
}))

const spendingOption = computed(() => ({
  tooltip: { trigger: 'axis', backgroundColor: '#1E293B', borderColor: '#334E68', textStyle: { color: '#F0F4F8' } },
  grid: { left: 60, right: 20, top: 20, bottom: 30 },
  xAxis: { type: 'category', data: store.monthlySpending.map(d => d.month), axisLabel: { color: '#9FB3C8' }, axisLine: { lineStyle: { color: '#334E68' } } },
  yAxis: { type: 'value', axisLabel: { color: '#9FB3C8', formatter: '¥{0}' }, splitLine: { lineStyle: { color: 'rgba(51,78,104,0.3)' } } },
  series: [{ type: 'line', smooth: true, data: store.monthlySpending.map(d => d.amount), areaStyle: { color: 'rgba(13,148,136,0.15)' }, lineStyle: { color: '#0D9488' }, itemStyle: { color: '#0D9488' } }]
}))
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">课题报表</h2>
      <div class="header-actions">
        <select class="input" v-model="store.selectedProject">
          <option v-for="p in store.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <button class="btn btn-secondary"><FileDown :size="14" /> 导出PDF</button>
        <button class="btn btn-secondary"><FileSpreadsheet :size="14" /> 导出Excel</button>
      </div>
    </div>

    <div class="charts-grid">
      <div class="card">
        <h3 class="card-title">试剂消耗排行</h3>
        <ChartWrapper :option="consumptionOption" height="300px" />
      </div>
      <div class="card">
        <h3 class="card-title">预算 vs 支出对比</h3>
        <ChartWrapper :option="budgetOption" height="300px" />
      </div>
    </div>

    <div class="card" style="margin-top: 16px">
      <h3 class="card-title">月度支出趋势</h3>
      <ChartWrapper :option="spendingOption" height="280px" />
    </div>
  </div>
</template>

<style scoped>
.page-container { padding: 24px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 22px; font-weight: 600; color: var(--color-text-primary); }
.header-actions { display: flex; align-items: center; gap: 10px; }
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.card-title { font-size: 15px; font-weight: 500; color: var(--color-text-secondary); margin-bottom: 16px; }
@media (max-width: 1024px) { .charts-grid { grid-template-columns: 1fr; } }
</style>
