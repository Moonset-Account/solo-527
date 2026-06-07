<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import AreaBarChart from '@/components/charts/AreaBarChart.vue';
import LineTrendChart from '@/components/charts/LineTrendChart.vue';
import ExportButton from '@/components/common/ExportButton.vue';
import { useFilterStore } from '@/stores/filter';
import { useSystemConfigStore } from '@/stores/systemConfig';
import { dataAdapter } from '@/api/adapter';
import type { AreaUtilization } from '@/types';
import { format } from 'date-fns';
import { Building2, TrendingUp, Clock } from 'lucide-vue-next';

const filterStore = useFilterStore();
const configStore = useSystemConfigStore();
const areaData = ref<AreaUtilization[]>([]);
const selectedArea = ref<string | null>(null);
const loading = ref(false);

const selectedAreaData = computed(() => {
  if (!selectedArea.value) return null;
  return areaData.value.find(a => a.areaId === selectedArea.value);
});

const trendData = computed(() => {
  if (!selectedAreaData.value) return [];
  return selectedAreaData.value.trend.map(t => ({
    date: t.date,
    value: t.value,
    label: `${format(t.date, 'MM-dd')} 利用率: ${(t.value * 100).toFixed(1)}%`,
  }));
});

const sortedAreaData = computed(() => {
  return [...areaData.value].sort((a, b) => b.utilization - a.utilization);
});

const exportData = computed(() => {
  return areaData.value.map(d => ({
    区域: d.areaName,
    楼层: d.floor + 'F',
    利用率: (d.utilization * 100).toFixed(2) + '%',
    总预约量: d.totalReservations,
    高峰时段: d.peakHours.map(h => `${h}:00`).join(', '),
  }));
});

async function loadData() {
  loading.value = true;
  try {
    areaData.value = await dataAdapter.getAreaUtilization({
      dateRange: filterStore.dateRange,
      areas: filterStore.selectedAreas,
      floors: filterStore.selectedFloors,
    });
    if (areaData.value.length > 0 && !selectedArea.value) {
      selectedArea.value = areaData.value[0].areaId;
    }
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);

watch(
  [
    () => filterStore.dateRange,
    () => filterStore.selectedAreas,
    () => filterStore.selectedFloors,
    () => configStore.closedDates,
    () => configStore.examPeriods,
    () => configStore.normalNoShowThreshold,
  ],
  loadData,
  { deep: true }
);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">区域利用率分析</h1>
        <p class="text-slate-500 mt-1">各区域座位利用率对比与历史趋势</p>
      </div>
      <ExportButton :data="exportData" filename="区域利用率数据" />
    </div>
    
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div 
        v-for="floor in [1, 2, 3, 4, 5]" 
        :key="floor"
        class="bg-white rounded-xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md transition-all"
        :class="{ 'ring-2 ring-blue-500': filterStore.selectedFloors.includes(floor) }"
        @click="filterStore.selectedFloors = filterStore.selectedFloors.includes(floor) 
          ? filterStore.selectedFloors.filter(f => f !== floor)
          : [...filterStore.selectedFloors, floor]"
      >
        <div class="flex items-center gap-2 mb-2">
          <Building2 class="w-5 h-5 text-blue-600" />
          <span class="font-semibold text-slate-800">{{ floor }}F</span>
        </div>
        <p class="text-2xl font-bold text-slate-700">
          {{ ((areaData.filter(a => a.floor === floor).reduce((s, a) => s + a.utilization, 0) / 
            Math.max(1, areaData.filter(a => a.floor === floor).length)) * 100).toFixed(1) }}%
        </p>
        <p class="text-xs text-slate-500">平均利用率</p>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 class="font-semibold text-slate-800 mb-4">区域利用率对比</h3>
        <AreaBarChart :data="sortedAreaData" />
      </div>
      
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 class="font-semibold text-slate-800 mb-4">区域详情</h3>
        <div class="space-y-2 max-h-80 overflow-auto">
          <div 
            v-for="area in sortedAreaData" 
            :key="area.areaId"
            class="p-3 rounded-lg cursor-pointer transition-colors"
            :class="selectedArea === area.areaId ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 hover:bg-slate-100'"
            @click="selectedArea = area.areaId"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-700">{{ area.areaName }}</span>
              <span class="text-sm font-bold text-blue-600">
                {{ (area.utilization * 100).toFixed(1) }}%
              </span>
            </div>
            <div class="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span>{{ area.floor }}F</span>
              <span>·</span>
              <span>{{ area.totalSeats }} 座</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-slate-800 flex items-center gap-2">
          <TrendingUp class="w-5 h-5 text-blue-600" />
          {{ selectedAreaData?.areaName || '选择区域' }} - 利用率趋势
        </h3>
      </div>
      <LineTrendChart :data="trendData" :show-area="true" color="#3b82f6" />
      
      <div class="mt-4 pt-4 border-t border-slate-100">
        <h4 class="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
          <Clock class="w-4 h-4" />
          高峰时段
        </h4>
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="hour in selectedAreaData?.peakHours || []" 
            :key="hour"
            class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
          >
            {{ hour }}:00
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
