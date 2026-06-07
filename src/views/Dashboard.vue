<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Users, CalendarCheck, CheckCircle, XCircle, TrendingUp } from 'lucide-vue-next';
import StatCard from '@/components/charts/StatCard.vue';
import LineTrendChart from '@/components/charts/LineTrendChart.vue';
import AreaBarChart from '@/components/charts/AreaBarChart.vue';
import ExportButton from '@/components/common/ExportButton.vue';
import { useFilterStore } from '@/stores/filter';
import { dataAdapter } from '@/api/adapter';
import type { DashboardStats, AreaUtilization } from '@/types';

const filterStore = useFilterStore();
const stats = ref<DashboardStats | null>(null);
const areaData = ref<AreaUtilization[]>([]);

const weekTrendData = computed(() => {
  if (!stats.value) return [];
  return stats.value.weekTrend.map(d => ({
    date: d.date,
    value: d.entries / 3000,
    label: `${d.date} 入馆: ${d.entries}人次`,
  }));
});

const exportData = computed(() => {
  if (!stats.value) return [];
  return stats.value.weekTrend.map(d => ({
    日期: d.date,
    入馆人次: d.entries,
    预约量: d.reservations,
  }));
});

onMounted(async () => {
  stats.value = await dataAdapter.getDashboardStats({
    dateRange: filterStore.dateRange,
    areas: filterStore.selectedAreas,
    floors: filterStore.selectedFloors,
  });
  
  areaData.value = await dataAdapter.getAreaUtilization({
    dateRange: filterStore.dateRange,
    areas: filterStore.selectedAreas,
    floors: filterStore.selectedFloors,
  });
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">总览仪表盘</h1>
        <p class="text-slate-500 mt-1">图书馆座位使用核心指标概览</p>
      </div>
      <ExportButton :data="exportData" filename="图书馆数据总览" />
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        title="今日入馆人次" 
        :value="stats?.todayEntries || 0" 
        unit="人次"
        :trend="5.2"
        :icon="Users"
        color="text-blue-800"
      />
      <StatCard 
        title="今日预约量" 
        :value="stats?.todayReservations || 0" 
        unit="次"
        :trend="3.8"
        :icon="CalendarCheck"
        color="text-green-800"
      />
      <StatCard 
        title="签到率" 
        :value="stats?.checkInRate || 0" 
        :is-percentage="true"
        :trend="2.1"
        :icon="CheckCircle"
        color="text-emerald-800"
      />
      <StatCard 
        title="爽约率" 
        :value="stats?.noShowRate || 0" 
        :is-percentage="true"
        :trend="-1.5"
        :icon="XCircle"
        color="text-red-800"
      />
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-slate-800">近7天入馆趋势</h3>
          <span class="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">人次</span>
        </div>
        <LineTrendChart :data="weekTrendData" :show-area="true" color="#3b82f6" />
      </div>
      
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-slate-800">区域利用率排行</h3>
        </div>
        <AreaBarChart :data="areaData.slice(0, 5)" />
      </div>
    </div>
    
    <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <h3 class="font-semibold text-slate-800 mb-4">热门区域 TOP5</h3>
      <div class="space-y-3">
        <div 
          v-for="(area, index) in stats?.topAreas?.slice(0, 5) || []" 
          :key="area.areaName"
          class="flex items-center gap-4"
        >
          <span 
            class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            :class="index < 3 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'"
          >
            {{ index + 1 }}
          </span>
          <span class="flex-1 text-sm text-slate-700">{{ area.areaName }}</span>
          <div class="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
              :style="{ width: `${area.utilization * 100}%` }"
            ></div>
          </div>
          <span class="text-sm font-medium text-slate-700 w-14 text-right">
            {{ (area.utilization * 100).toFixed(1) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
