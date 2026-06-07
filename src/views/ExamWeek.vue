<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import LineTrendChart from '@/components/charts/LineTrendChart.vue';
import { dataAdapter } from '@/api/adapter';
import type { ViolationStats, AreaUtilization } from '@/types';
import { format, subDays } from 'date-fns';
import { GraduationCap, Settings, AlertTriangle, BarChart3, ArrowRight } from 'lucide-vue-next';
import { EXAM_PERIODS } from '@/mock/dataGenerator';
import { useRouter } from 'vue-router';

const router = useRouter();
const examViolationStats = ref<ViolationStats[]>([]);
const normalViolationStats = ref<ViolationStats[]>([]);
const examAreaData = ref<AreaUtilization[]>([]);
const normalAreaData = ref<AreaUtilization[]>([]);

const examPeriod = EXAM_PERIODS[0];
const normalPeriod = {
  startDate: subDays(examPeriod.startDate, 14),
  endDate: subDays(examPeriod.startDate, 1),
};

const examTrendData = computed(() => {
  return examViolationStats.value.map(d => ({
    date: d.date,
    value: d.noShowRate,
    label: `${format(d.date, 'MM-dd')} 爽约率: ${(d.noShowRate * 100).toFixed(1)}%`,
  }));
});

const normalTrendData = computed(() => {
  return normalViolationStats.value.map(d => ({
    date: d.date,
    value: d.noShowRate,
    label: `${format(d.date, 'MM-dd')} 爽约率: ${(d.noShowRate * 100).toFixed(1)}%`,
  }));
});

const avgExamNoShowRate = computed(() => {
  if (examViolationStats.value.length === 0) return 0;
  return examViolationStats.value.reduce((s, d) => s + d.noShowRate, 0) / examViolationStats.value.length;
});

const avgNormalNoShowRate = computed(() => {
  if (normalViolationStats.value.length === 0) return 0;
  return normalViolationStats.value.reduce((s, d) => s + d.noShowRate, 0) / normalViolationStats.value.length;
});

const avgExamUtilization = computed(() => {
  if (examAreaData.value.length === 0) return 0;
  return examAreaData.value.reduce((s, d) => s + d.utilization, 0) / examAreaData.value.length;
});

const avgNormalUtilization = computed(() => {
  if (normalAreaData.value.length === 0) return 0;
  return normalAreaData.value.reduce((s, d) => s + d.utilization, 0) / normalAreaData.value.length;
});

onMounted(async () => {
  examViolationStats.value = await dataAdapter.getViolationStats({
    dateRange: [examPeriod.startDate, examPeriod.endDate],
  });
  
  normalViolationStats.value = await dataAdapter.getViolationStats({
    dateRange: [normalPeriod.startDate, normalPeriod.endDate],
  });
  
  examAreaData.value = await dataAdapter.getAreaUtilization({
    dateRange: [examPeriod.startDate, examPeriod.endDate],
  });
  
  normalAreaData.value = await dataAdapter.getAreaUtilization({
    dateRange: [normalPeriod.startDate, normalPeriod.endDate],
  });
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">考试周专项分析</h1>
        <p class="text-slate-500 mt-1">考试周与平日数据对比分析</p>
      </div>
      <button 
        class="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
        @click="router.push('/settings')"
      >
        <Settings class="w-4 h-4" />
        规则配置
      </button>
    </div>
    
    <div class="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-6 text-white">
      <div class="flex items-center gap-3 mb-4">
        <GraduationCap class="w-8 h-8" />
        <div>
          <h3 class="text-xl font-bold">{{ examPeriod.name }}</h3>
          <p class="text-white/80 text-sm">
            {{ format(examPeriod.startDate, 'yyyy-MM-dd') }} 至 {{ format(examPeriod.endDate, 'yyyy-MM-dd') }}
          </p>
        </div>
      </div>
      <p class="text-sm text-white/90">
        ⚠️ 考试周爽约规则：爽约阈值 {{ examPeriod.noShowThreshold }} 次/学期，超过将暂停预约权限 7 天
      </p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div class="flex items-center gap-2 mb-4">
          <AlertTriangle class="w-5 h-5 text-red-500" />
          <h3 class="font-semibold text-slate-800">爽约率对比</h3>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-orange-50 rounded-xl">
            <p class="text-sm text-orange-600 font-medium">考试周</p>
            <p class="text-3xl font-bold text-orange-700 mt-1">{{ (avgExamNoShowRate * 100).toFixed(1) }}%</p>
          </div>
          <div class="p-4 bg-blue-50 rounded-xl">
            <p class="text-sm text-blue-600 font-medium">平日</p>
            <p class="text-3xl font-bold text-blue-700 mt-1">{{ (avgNormalNoShowRate * 100).toFixed(1) }}%</p>
          </div>
        </div>
        <div class="flex items-center justify-center gap-4">
          <span class="text-sm text-slate-500">变化</span>
          <span 
            class="text-lg font-bold px-3 py-1 rounded-full"
            :class="avgExamNoShowRate > avgNormalNoShowRate ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'"
          >
            {{ avgExamNoShowRate > avgNormalNoShowRate ? '↑' : '↓' }} 
            {{ Math.abs((avgExamNoShowRate - avgNormalNoShowRate) * 100).toFixed(1) }}%
          </span>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <div class="flex items-center gap-2 mb-4">
          <BarChart3 class="w-5 h-5 text-blue-500" />
          <h3 class="font-semibold text-slate-800">区域利用率对比</h3>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-orange-50 rounded-xl">
            <p class="text-sm text-orange-600 font-medium">考试周</p>
            <p class="text-3xl font-bold text-orange-700 mt-1">{{ (avgExamUtilization * 100).toFixed(1) }}%</p>
          </div>
          <div class="p-4 bg-blue-50 rounded-xl">
            <p class="text-sm text-blue-600 font-medium">平日</p>
            <p class="text-3xl font-bold text-blue-700 mt-1">{{ (avgNormalUtilization * 100).toFixed(1) }}%</p>
          </div>
        </div>
        <div class="flex items-center justify-center gap-4">
          <span class="text-sm text-slate-500">变化</span>
          <span 
            class="text-lg font-bold px-3 py-1 rounded-full"
            :class="avgExamUtilization > avgNormalUtilization ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
          >
            {{ avgExamUtilization > avgNormalUtilization ? '↑' : '↓' }} 
            {{ Math.abs((avgExamUtilization - avgNormalUtilization) * 100).toFixed(1) }}%
          </span>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 class="font-semibold text-slate-800 mb-4">考试周爽约率趋势</h3>
        <LineTrendChart :data="examTrendData" :show-area="true" color="#f97316" />
      </div>
      
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 class="font-semibold text-slate-800 mb-4">平日爽约率趋势</h3>
        <LineTrendChart :data="normalTrendData" :show-area="true" color="#3b82f6" />
      </div>
    </div>
    
    <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <h3 class="font-semibold text-slate-800 mb-4">各区域考试周 vs 平日利用率对比</h3>
      <div class="space-y-4">
        <div 
          v-for="(exam, index) in examAreaData.slice(0, 6)" 
          :key="exam.areaId"
          class="space-y-2"
        >
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-700 font-medium">{{ exam.areaName }}</span>
            <div class="flex items-center gap-4">
              <span class="text-orange-600">考试周 {{ (exam.utilization * 100).toFixed(1) }}%</span>
              <ArrowRight class="w-4 h-4 text-slate-300" />
              <span class="text-blue-600">平日 {{ (normalAreaData[index]?.utilization * 100 || 0).toFixed(1) }}%</span>
            </div>
          </div>
          <div class="flex gap-1 h-3">
            <div 
              class="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-l-full"
              :style="{ width: `${exam.utilization * 100}%` }"
            ></div>
            <div 
              class="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-r-full"
              :style="{ width: `${(normalAreaData[index]?.utilization || 0) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
