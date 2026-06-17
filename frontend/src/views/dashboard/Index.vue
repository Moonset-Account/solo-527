<template>
  <div class="page-container">
    <div class="page-header">
      <h2>工作台</h2>
      <span style="color: #909399;">今日数据概览</span>
    </div>
    <el-row :gutter="16" style="margin-bottom: 20px;">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">账单总金额</div>
          <div class="stat-value" style="color: #409EFF;">¥ {{ formatMoney(billStats.summary?.totalAmount || 0) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">已收金额</div>
          <div class="stat-value" style="color: #67C23A;">¥ {{ formatMoney(billStats.summary?.totalPaid || 0) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">待收金额</div>
          <div class="stat-value" style="color: #E6A23C;">¥ {{ formatMoney(billStats.summary?.totalUnpaid || 0) }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">收费进度</div>
          <div class="stat-value" style="color: #F56C6C;">
            {{ billStats.summary?.totalAmount ? ((billStats.summary.totalPaid / billStats.summary.totalAmount) * 100).toFixed(1) : 0 }}%
          </div>
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="16" style="margin-bottom: 20px;">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">待处理报修</div>
          <div class="stat-value" style="color: #E6A23C;">{{ pendingMaintenance }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">待处理异常</div>
          <div class="stat-value" style="color: #F56C6C;">{{ pendingExceptions }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">今日巡检任务</div>
          <div class="stat-value" style="color: #409EFF;">{{ todayInspections }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">空闲房间</div>
          <div class="stat-value" style="color: #67C23A;">{{ vacantRooms }}</div>
        </div>
      </el-col>
    </el-row>
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><b>按账期收费统计</b></template>
          <v-chart class="chart" :option="periodOption" autoresize />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never">
          <template #header><b>账单类型分布</b></template>
          <v-chart class="chart" :option="typeOption" autoresize />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { getBillStatistics } from '@/api/bill';
import { getMaintenances, getAccessExceptions, getInspections, getRoomPricingStatistics } from '@/api/config';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart, PieChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components';
import VChart from 'vue-echarts';

use([CanvasRenderer, BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent]);

const billStats = reactive<any>({ summary: {}, byPeriod: [], byType: [] });
const pendingMaintenance = ref(0);
const pendingExceptions = ref(0);
const todayInspections = ref(0);
const vacantRooms = ref(0);

const formatMoney = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2 });

const typeLabels: Record<string, string> = {
  rent: '租金', water: '水费', electricity: '电费', gas: '燃气费',
  network: '网费', property: '物业费', other: '其他',
};

const periodOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['应收', '实收', '待收'] },
  grid: { left: 40, right: 20, bottom: 40, top: 50 },
  xAxis: { type: 'category', data: billStats.byPeriod.map((p: any) => p._id) },
  yAxis: { type: 'value' },
  series: [
    { name: '应收', type: 'bar', data: billStats.byPeriod.map((p: any) => p.total), itemStyle: { color: '#409EFF' } },
    { name: '实收', type: 'bar', data: billStats.byPeriod.map((p: any) => p.paid), itemStyle: { color: '#67C23A' } },
    { name: '待收', type: 'bar', data: billStats.byPeriod.map((p: any) => p.unpaid), itemStyle: { color: '#E6A23C' } },
  ],
}));

const typeOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [{
    type: 'pie', radius: ['40%', '65%'],
    label: { formatter: '{b}: {c}' },
    data: billStats.byType.map((t: any) => ({ name: typeLabels[t._id] || t._id, value: t.count })),
  }],
}));

onMounted(async () => {
  try {
    const [bs, ms, es, ips, rs] = await Promise.all([
      getBillStatistics(),
      getMaintenances({ status: 'pending', limit: 1 }),
      getAccessExceptions({ status: 'open', limit: 1 }),
      getInspections({ status: 'pending', limit: 1 }),
      getRoomPricingStatistics(),
    ]) as any;
    Object.assign(billStats, bs || {});
    pendingMaintenance.value = ms.total || 0;
    pendingExceptions.value = es.total || 0;
    todayInspections.value = ips.total || 0;
    const vs = rs?.byStatus?.find((s: any) => s._id === 'vacant');
    vacantRooms.value = vs?.count || 0;
  } catch (_) {}
});
</script>

<style scoped>
.chart { height: 300px; }
</style>
