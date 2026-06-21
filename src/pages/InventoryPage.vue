<script setup lang="ts">
import { computed } from 'vue'
import { FlaskConical, DollarSign, AlertTriangle, ArrowDownToLine } from 'lucide-vue-next'
import { useInventoryStore } from '@/stores/inventory'
import StatCard from '@/components/StatCard.vue'
import ChartWrapper from '@/components/ChartWrapper.vue'
import DataTable from '@/components/DataTable.vue'

const store = useInventoryStore()

const categoryOption = computed(() => ({
  tooltip: { trigger: 'item', backgroundColor: '#1E293B', borderColor: '#334E68', textStyle: { color: '#F0F4F8' } },
  legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { color: '#9FB3C8' } },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    center: ['40%', '50%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 6, borderColor: '#1E293B', borderWidth: 2 },
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#F0F4F8' } },
    data: store.categoryData.map((item, i) => ({
      ...item,
      itemStyle: { color: ['#0D9488', '#2DD4BF', '#5EEAD4', '#334E68', '#486581', '#627D98', '#829AB1'][i] }
    }))
  }]
}))

const dangerOption = computed(() => ({
  tooltip: { trigger: 'axis', backgroundColor: '#1E293B', borderColor: '#334E68', textStyle: { color: '#F0F4F8' } },
  grid: { left: 60, right: 20, top: 20, bottom: 30 },
  xAxis: { type: 'category', data: store.dangerLevelData.map(d => d.name), axisLabel: { color: '#9FB3C8' }, axisLine: { lineStyle: { color: '#334E68' } } },
  yAxis: { type: 'value', axisLabel: { color: '#9FB3C8' }, splitLine: { lineStyle: { color: 'rgba(51,78,104,0.3)' } } },
  series: [{ type: 'bar', data: store.dangerLevelData.map(d => ({ value: d.value, itemStyle: { color: d.color } })), barWidth: 32, itemStyle: { borderRadius: [4, 4, 0, 0] } }]
}))

const trendOption = computed(() => ({
  tooltip: { trigger: 'axis', backgroundColor: '#1E293B', borderColor: '#334E68', textStyle: { color: '#F0F4F8' } },
  legend: { data: ['入库', '出库'], textStyle: { color: '#9FB3C8' } },
  grid: { left: 50, right: 20, top: 40, bottom: 30 },
  xAxis: { type: 'category', data: store.monthlyTrend.map(d => d.month), axisLabel: { color: '#9FB3C8' }, axisLine: { lineStyle: { color: '#334E68' } } },
  yAxis: { type: 'value', axisLabel: { color: '#9FB3C8' }, splitLine: { lineStyle: { color: 'rgba(51,78,104,0.3)' } } },
  series: [
    { name: '入库', type: 'line', smooth: true, data: store.monthlyTrend.map(d => d.inbound), areaStyle: { color: 'rgba(13,148,136,0.15)' }, lineStyle: { color: '#0D9488' }, itemStyle: { color: '#0D9488' } },
    { name: '出库', type: 'line', smooth: true, data: store.monthlyTrend.map(d => d.outbound), areaStyle: { color: 'rgba(51,78,104,0.15)' }, lineStyle: { color: '#486581' }, itemStyle: { color: '#486581' } },
  ]
}))

const warningColumns = [
  { key: 'name', label: '试剂名称', sortable: true },
  { key: 'level', label: '危险等级', sortable: true, width: '100px' },
  { key: 'stock', label: '当前库存', sortable: true, width: '100px' },
  { key: 'minStock', label: '最低库存', width: '100px' },
  { key: 'expiry', label: '有效期至', width: '120px' },
  { key: 'location', label: '位置', width: '100px' },
]
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">库存统计</h2>

    <div class="stats-grid">
      <StatCard title="试剂总数" :value="store.stats.totalReagents" :icon="FlaskConical" :trend="store.stats.totalTrend" suffix="种" />
      <StatCard title="库存金额" :value="store.stats.totalValue" :icon="DollarSign" :trend="store.stats.valueTrend" suffix="元" />
      <StatCard title="预警数量" :value="store.stats.warningCount" :icon="AlertTriangle" :trend="store.stats.warningTrend" suffix="项" />
      <StatCard title="本月出库" :value="store.stats.monthlyOut" :icon="ArrowDownToLine" :trend="store.stats.outTrend" suffix="次" />
    </div>

    <div class="charts-grid">
      <div class="card">
        <h3 class="card-title">分类分布</h3>
        <ChartWrapper :option="categoryOption" height="280px" />
      </div>
      <div class="card">
        <h3 class="card-title">危险等级分布</h3>
        <ChartWrapper :option="dangerOption" height="280px" />
      </div>
    </div>

    <div class="card" style="margin-top: 16px">
      <h3 class="card-title">月度出入库趋势</h3>
      <ChartWrapper :option="trendOption" height="280px" />
    </div>

    <div class="card" style="margin-top: 16px">
      <h3 class="card-title">预警列表</h3>
      <DataTable :columns="warningColumns" :data="store.warningList">
        <template #level="{ row }">
          <span class="tag" :class="store.levelTag[row.level]">{{ row.level }}</span>
        </template>
        <template #stock="{ row }">
          <span class="font-data" :class="row.stock <= row.minStock * 0.3 ? 'text-danger-400' : 'text-warn-400'">{{ row.stock }}</span>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  padding: 24px;
}
.page-title {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--color-text-primary);
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}
.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.card-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 16px;
}
@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .charts-grid { grid-template-columns: 1fr; }
}
</style>
