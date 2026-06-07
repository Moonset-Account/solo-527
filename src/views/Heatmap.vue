<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import HeatmapChart from '@/components/charts/HeatmapChart.vue';
import ExportButton from '@/components/common/ExportButton.vue';
import { useFilterStore } from '@/stores/filter';
import { useSystemConfigStore } from '@/stores/systemConfig';
import { dataAdapter } from '@/api/adapter';
import type { HeatmapCell, ClosedDate, ExamPeriod } from '@/types';
import { format } from 'date-fns';
import { Calendar, AlertCircle } from 'lucide-vue-next';

const filterStore = useFilterStore();
const configStore = useSystemConfigStore();
const heatmapData = ref<HeatmapCell[]>([]);
const closedDates = ref<ClosedDate[]>([]);
const examPeriods = ref<ExamPeriod[]>([]);
const loading = ref(false);

const exportData = computed(() => {
  return heatmapData.value.map(d => ({
    日期: format(d.date, 'yyyy-MM-dd'),
    时段: `${d.hour}:00`,
    利用率: (d.value * 100).toFixed(2) + '%',
    样本量: d.sampleSize,
    是否闭馆: d.isClosed ? '是' : '否',
    是否考试周: d.isExamWeek ? '是' : '否',
  }));
});

async function loadData() {
  loading.value = true;
  try {
    heatmapData.value = await dataAdapter.getHeatmapData({
      dateRange: filterStore.dateRange,
      areas: filterStore.selectedAreas,
      floors: filterStore.selectedFloors,
    });
    closedDates.value = await dataAdapter.getClosedDates();
    examPeriods.value = await dataAdapter.getExamPeriods();
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
        <h1 class="text-2xl font-bold text-slate-800">时段热力分析</h1>
        <p class="text-slate-500 mt-1">按日期和时段展示座位使用热度分布</p>
      </div>
      <ExportButton :data="exportData" filename="时段热力数据" />
    </div>
    
    <div class="flex flex-wrap gap-4">
      <div class="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
        <div class="w-3 h-3 bg-red-100 border-2 border-red-500 rounded"></div>
        <span class="text-sm text-red-700">临时闭馆</span>
      </div>
      <div class="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
        <AlertCircle class="w-4 h-4 text-orange-500" />
        <span class="text-sm text-orange-700">考试周数据已特殊标注</span>
      </div>
      <div class="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
        <div class="w-3 h-3 bg-slate-200 border border-slate-400 border-dashed rounded"></div>
        <span class="text-sm text-amber-700">样本量较小</span>
      </div>
    </div>
    
    <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <HeatmapChart :data="heatmapData" :height="520" />
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar class="w-5 h-5 text-red-500" />
          临时闭馆日
        </h3>
        <div class="space-y-2">
          <div 
            v-for="cd in closedDates" 
            :key="format(cd.date, 'yyyy-MM-dd')"
            class="flex items-center justify-between p-3 bg-red-50 rounded-lg"
          >
            <span class="text-sm font-medium text-red-800">{{ format(cd.date, 'yyyy-MM-dd') }}</span>
            <span class="text-sm text-red-600">{{ cd.reason }}</span>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <AlertCircle class="w-5 h-5 text-orange-500" />
          考试周期
        </h3>
        <div class="space-y-2">
          <div 
            v-for="ep in examPeriods" 
            :key="ep.name"
            class="p-4 bg-orange-50 rounded-lg"
          >
            <p class="font-medium text-orange-800">{{ ep.name }}</p>
            <p class="text-sm text-orange-600 mt-1">
              {{ format(ep.startDate, 'yyyy-MM-dd') }} 至 {{ format(ep.endDate, 'yyyy-MM-dd') }}
            </p>
            <p class="text-xs text-orange-500 mt-2">
              爽约阈值: {{ ep.noShowThreshold }} 次/学期
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
