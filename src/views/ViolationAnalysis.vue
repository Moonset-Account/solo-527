<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import LineTrendChart from '@/components/charts/LineTrendChart.vue';
import ExportButton from '@/components/common/ExportButton.vue';
import { useFilterStore } from '@/stores/filter';
import { useAuthStore } from '@/stores/auth';
import { useSystemConfigStore } from '@/stores/systemConfig';
import { dataAdapter } from '@/api/adapter';
import { maskStudentId, maskStudentName } from '@/utils/dataMasking';
import type { ViolationStats, Violation } from '@/types';
import { format } from 'date-fns';
import { AlertTriangle, Users, Clock, XCircle, Settings } from 'lucide-vue-next';

const filterStore = useFilterStore();
const authStore = useAuthStore();
const configStore = useSystemConfigStore();
const violationStats = ref<ViolationStats[]>([]);
const violations = ref<Violation[]>([]);
const loading = ref(false);

const noShowTrendData = computed(() => {
  return violationStats.value.map(d => ({
    date: d.date,
    value: d.noShowRate,
    label: `${format(d.date, 'MM-dd')} 爽约率: ${(d.noShowRate * 100).toFixed(1)}%`,
  }));
});

const violationTypeDistribution = computed(() => {
  const total = violationStats.value.reduce((sum, d) => sum + d.totalViolations, 0);
  const types: Record<string, number> = {};
  for (const stat of violationStats.value) {
    for (const [type, count] of Object.entries(stat.violationByType)) {
      types[type] = (types[type] || 0) + count;
    }
  }
  return Object.entries(types).map(([type, count]) => ({
    type,
    count,
    percentage: total > 0 ? count / total : 0,
  }));
});

const typeLabels: Record<string, string> = {
  no_show: '爽约',
  late_checkin: '签到迟到',
  early_leave: '提前离开',
  occupancy_timeout: '超时占用',
};

const typeColors: Record<string, string> = {
  no_show: 'bg-red-500',
  late_checkin: 'bg-orange-500',
  early_leave: 'bg-yellow-500',
  occupancy_timeout: 'bg-purple-500',
};

const typeBadgeClasses: Record<string, string> = {
  no_show: 'bg-red-100 text-red-700',
  late_checkin: 'bg-orange-100 text-orange-700',
  early_leave: 'bg-yellow-100 text-yellow-700',
  occupancy_timeout: 'bg-purple-100 text-purple-700',
};

const statusLabels: Record<string, { text: string; class: string }> = {
  pending: { text: '待处理', class: 'bg-yellow-100 text-yellow-700' },
  processed: { text: '已处理', class: 'bg-green-100 text-green-700' },
  ignored: { text: '已忽略', class: 'bg-slate-100 text-slate-600' },
};

const exportData = computed(() => {
  return violations.value.map(v => ({
    学号: maskStudentId(v.studentId, authStore.userRole),
    姓名: maskStudentName(v.studentName, authStore.userRole),
    违规类型: typeLabels[v.violationType] || v.violationType,
    发生时间: format(v.occurTime, 'yyyy-MM-dd HH:mm'),
    状态: statusLabels[v.status]?.text || v.status,
    备注: v.remark || '',
  }));
});

async function loadData() {
  loading.value = true;
  try {
    violationStats.value = await dataAdapter.getViolationStats({
      dateRange: filterStore.dateRange,
      areas: filterStore.selectedAreas,
      floors: filterStore.selectedFloors,
    });
    
    violations.value = await dataAdapter.getViolations({
      dateRange: filterStore.dateRange,
      areas: filterStore.selectedAreas,
      floors: filterStore.selectedFloors,
    });
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
        <h1 class="text-2xl font-bold text-slate-800">爽约与违规分析</h1>
        <p class="text-slate-500 mt-1">爽约率统计与违规记录管理</p>
      </div>
      <ExportButton :data="exportData" filename="违规记录数据" />
    </div>
    
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <Settings class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p class="text-sm font-medium text-blue-800">当前爽约规则</p>
          <p class="text-xs text-blue-600 mt-0.5">
            平日阈值: <strong>{{ configStore.normalNoShowThreshold }}</strong> 次/学期
            <span class="mx-2">|</span>
            考试周: 已配置 {{ configStore.examPeriods.length }} 个周期
            <span class="ml-2 text-xs text-blue-500">
              ({{ configStore.examPeriods.map(e => `${e.name}:${e.noShowThreshold}次`).join(', ') }})
            </span>
          </p>
        </div>
      </div>
      <button 
        class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        @click="$router.push('/settings')"
      >
        修改规则
      </button>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
            <XCircle class="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p class="text-sm text-slate-500">平均爽约率</p>
            <p class="text-2xl font-bold text-red-600">
              {{ ((violationStats.reduce((s, d) => s + d.noShowRate, 0) / Math.max(1, violationStats.length)) * 100).toFixed(1) }}%
            </p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
            <AlertTriangle class="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p class="text-sm text-slate-500">违规总次数</p>
            <p class="text-2xl font-bold text-orange-600">
              {{ violationStats.reduce((s, d) => s + d.totalViolations, 0).toLocaleString() }}
            </p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
            <Clock class="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p class="text-sm text-slate-500">待处理</p>
            <p class="text-2xl font-bold text-yellow-600">
              {{ violations.filter(v => v.status === 'pending').length }}
            </p>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Users class="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p class="text-sm text-slate-500">涉及学生</p>
            <p class="text-2xl font-bold text-blue-600">
              {{ new Set(violations.map(v => v.studentId)).size }}
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 class="font-semibold text-slate-800 mb-4">爽约率趋势</h3>
        <LineTrendChart :data="noShowTrendData" :show-area="true" color="#ef4444" />
      </div>
      
      <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h3 class="font-semibold text-slate-800 mb-4">违规类型分布</h3>
        <div class="space-y-4">
          <div 
            v-for="item in violationTypeDistribution" 
            :key="item.type"
            class="space-y-2"
          >
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-700">{{ typeLabels[item.type] || item.type }}</span>
              <span class="font-medium text-slate-800">{{ (item.percentage * 100).toFixed(1) }}%</span>
            </div>
            <div class="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-500"
                :class="typeColors[item.type] || 'bg-slate-500'"
                :style="{ width: `${item.percentage * 100}%` }"
              ></div>
            </div>
            <p class="text-xs text-slate-500 text-right">{{ item.count }} 次</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-slate-800">违规记录列表</h3>
        <p class="text-xs text-slate-500">
          {{ authStore.userRole !== 'super_admin' ? '🔒 学号已脱敏' : '👑 超级管理员可查看完整信息' }}
        </p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-200">
              <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">学号</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">姓名</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">违规类型</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">发生时间</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">状态</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-slate-600">备注</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="v in violations.slice(0, 20)" 
              :key="v.violationId"
              class="border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <td class="py-3 px-4 text-sm font-mono text-slate-700">
                {{ maskStudentId(v.studentId, authStore.userRole) }}
              </td>
              <td class="py-3 px-4 text-sm text-slate-700">
                {{ maskStudentName(v.studentName, authStore.userRole) }}
              </td>
              <td class="py-3 px-4">
                <span 
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="typeBadgeClasses[v.violationType] || 'bg-slate-100 text-slate-700'"
                >
                  {{ typeLabels[v.violationType] || v.violationType }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-slate-600">{{ format(v.occurTime, 'yyyy-MM-dd HH:mm') }}</td>
              <td class="py-3 px-4">
                <span 
                  class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="statusLabels[v.status]?.class"
                >
                  {{ statusLabels[v.status]?.text || v.status }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-slate-500 max-w-[200px] truncate">{{ v.remark || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
