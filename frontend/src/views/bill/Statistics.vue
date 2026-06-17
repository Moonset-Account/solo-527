<template>
  <div class="page-container">
    <div class="page-header"><h2>收费进度统计</h2></div>
    <el-row :gutter="16" style="margin-bottom: 20px;">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">账单总数</div>
          <div class="stat-value" style="color:#409EFF;">{{ stats.summary?.totalBills || 0 }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">应收总额</div>
          <div class="stat-value" style="color:#909399;">¥ {{ (stats.summary?.totalAmount || 0).toLocaleString('zh-CN',{minimumFractionDigits:2}) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">实收总额</div>
          <div class="stat-value" style="color:#67C23A;">¥ {{ (stats.summary?.totalPaid || 0).toLocaleString('zh-CN',{minimumFractionDigits:2}) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">待收总额</div>
          <div class="stat-value" style="color:#E6A23C;">¥ {{ (stats.summary?.totalUnpaid || 0).toLocaleString('zh-CN',{minimumFractionDigits:2}) }}</div>
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="16" style="margin-bottom: 20px;">
      <el-col :span="6">
        <div class="stat-card"><div class="stat-label">已缴</div><div class="stat-value" style="color:#67C23A;">{{ stats.summary?.paidCount || 0 }}</div></div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card"><div class="stat-label">未缴</div><div class="stat-value" style="color:#E6A23C;">{{ stats.summary?.unpaidCount || 0 }}</div></div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card"><div class="stat-label">部分已缴</div><div class="stat-value" style="color:#409EFF;">{{ stats.summary?.partialCount || 0 }}</div></div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card"><div class="stat-label">逾期</div><div class="stat-value" style="color:#F56C6C;">{{ stats.summary?.overdueCount || 0 }}</div></div>
      </el-col>
    </el-row>
    <el-row :gutter="16" style="margin-bottom: 20px;">
      <el-col :span="16">
        <el-card shadow="never">
          <template #header><b>按账期收费进度</b></template>
          <v-chart class="chart" :option="periodOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never">
          <template #header><b>账单状态占比</b></template>
          <v-chart class="chart" :option="statusOption" autoresize />
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><b>各类型收费金额</b></template>
          <v-chart class="chart" :option="typeAmountOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><b>整体收费率</b></template>
          <v-chart class="chart" :option="gaugeOption" autoresize />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { getBillStatistics } from '@/api/bill';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, PieChart, GaugeChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';

use([CanvasRenderer, BarChart, PieChart, GaugeChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const stats = reactive<any>({ summary: {}, byPeriod: [], byType: [] });
const typeLabels: Record<string, string> = {
  rent: '租金', water: '水费', electricity: '电费', gas: '燃气费',
  network: '网费', property: '物业费', other: '其他',
};
onMounted(async () => {
  try { Object.assign(stats, await getBillStatistics()); } catch (_) {}
});

const periodOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['应收', '实收', '待收'] },
  grid: { left: 50, right: 20, top: 50, bottom: 40 },
  xAxis: { type: 'category', data: stats.byPeriod.map((p: any) => p._id) },
  yAxis: { type: 'value' },
  series: [
    { name: '应收', type: 'bar', stack: 'total', data: stats.byPeriod.map((p: any) => p.paid), itemStyle: { color: '#67C23A' } },
    { name: '实收', type: 'bar', stack: 'total', data: stats.byPeriod.map((p: any) => 0), itemStyle: { color: 'transparent' } },
    { name: '待收', type: 'bar', data: stats.byPeriod.map((p: any) => p.unpaid), itemStyle: { color: '#E6A23C' } },
    { name: '总额', type: 'line', data: stats.byPeriod.map((p: any) => p.total), itemStyle: { color: '#409EFF' } },
  ],
}));

const statusOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [{
    type: 'pie', radius: '60%',
    label: { formatter: '{b}: {c} ({d}%)' },
    data: [
      { value: stats.summary?.paidCount || 0, name: '已缴', itemStyle: { color: '#67C23A' } },
      { value: stats.summary?.unpaidCount || 0, name: '未缴', itemStyle: { color: '#E6A23C' } },
      { value: stats.summary?.partialCount || 0, name: '部分已缴', itemStyle: { color: '#409EFF' } },
      { value: stats.summary?.overdueCount || 0, name: '逾期', itemStyle: { color: '#F56C6C' } },
    ],
  }],
}));

const typeAmountOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['应收', '实收'] },
  grid: { left: 50, right: 20, top: 40, bottom: 30 },
  xAxis: { type: 'category', data: stats.byType.map((t: any) => typeLabels[t._id] || t._id) },
  yAxis: { type: 'value' },
  series: [
    { name: '应收', type: 'bar', data: stats.byType.map((t: any) => t.total), itemStyle: { color: '#909399' } },
    { name: '实收', type: 'bar', data: stats.byType.map((t: any) => t.paid), itemStyle: { color: '#67C23A' } },
  ],
}));

const gaugeOption = computed(() => {
  const rate = stats.summary?.totalAmount ? (stats.summary.totalPaid / stats.summary.totalAmount * 100) : 0;
  return {
    series: [{
      type: 'gauge', progress: { show: true, width: 20 },
      axisLine: { lineStyle: { width: 20 } },
      pointer: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: { offsetCenter: [0, '20%'], fontSize: 16, color: '#909399' },
      detail: { offsetCenter: [0, '-10%'], fontSize: 40, fontWeight: 'bold', formatter: '{value}%' },
      data: [{ value: rate.toFixed(1), name: '整体收费率' }],
    }],
  };
});
</script>

<style scoped>
.chart { height: 320px; }
</style>
