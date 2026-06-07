<script setup lang="ts">
import { Database, AlertTriangle, XCircle, RefreshCcw, Info, ChevronDown, ChevronUp, FileText, Sparkles } from 'lucide-vue-next';
import { computed, ref } from 'vue';
import type { DataQualityReport } from '@/types';
import { DATA_CALIBERS } from '@/data/calibers';
import { formatDateTime } from '@/data/cleaner';

interface Props {
  report: DataQualityReport | null;
  loading?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const showDetails = ref(false);
const showCalibers = ref(false);

const missingLevel = computed(() => {
  if (!props.report) return 'normal';
  if (props.report.missingRate > 10) return 'danger';
  if (props.report.missingRate > 5) return 'warning';
  return 'normal';
});

const anomalyLevel = computed(() => {
  if (!props.report) return 'normal';
  if (props.report.outlierCount > 50) return 'danger';
  if (props.report.outlierCount > 20) return 'warning';
  return 'normal';
});

const levelColors: Record<string, { bg: string; text: string; border: string }> = {
  normal: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  danger: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
};

function getStatLevel(rate: number, isMissing = true) {
  if (isMissing) {
    if (rate > 10) return 'text-rose-600';
    if (rate > 5) return 'text-amber-600';
    return 'text-emerald-600';
  } else {
    if (rate > 5) return 'text-rose-600';
    if (rate > 2) return 'text-amber-600';
    return 'text-emerald-600';
  }
}
</script>

<template>
  <div class="bg-white border-t border-slate-200">
    <div class="px-6 py-3">
      <div class="flex items-center gap-6 flex-wrap">
        <div class="flex items-center gap-2 text-sm">
          <Database class="w-4 h-4 text-slate-400" />
          <span class="text-slate-500">数据口径:</span>
          <span class="font-medium text-slate-700">{{ report?.caliberVersion || 'v1.0' }} ({{ DATA_CALIBERS.length }}个指标)</span>
        </div>

        <div v-if="report" :class="['flex items-center gap-2 px-3 py-1 rounded-lg border text-sm', levelColors[missingLevel].bg, levelColors[missingLevel].border]">
          <AlertTriangle :class="['w-4 h-4', levelColors[missingLevel].text]" />
          <span class="text-slate-500">缺失值:</span>
          <span :class="['font-semibold', levelColors[missingLevel].text]">{{ report.missingRate.toFixed(1) }}%</span>
        </div>

        <div v-if="report" :class="['flex items-center gap-2 px-3 py-1 rounded-lg border text-sm', levelColors[anomalyLevel].bg, levelColors[anomalyLevel].border]">
          <XCircle :class="['w-4 h-4', levelColors[anomalyLevel].text]" />
          <span class="text-slate-500">异常点:</span>
          <span :class="['font-semibold', levelColors[anomalyLevel].text]">{{ report.outlierCount }}</span>
        </div>

        <div v-if="report && report.cleanedCount" class="flex items-center gap-2 px-3 py-1 rounded-lg border border-sky-100 bg-sky-50 text-sm">
          <Sparkles class="w-4 h-4 text-sky-600" />
          <span class="text-slate-500">已清洗:</span>
          <span class="font-semibold text-sky-700">{{ report.cleanedCount.toLocaleString() }}条</span>
        </div>

        <div v-if="report" class="flex items-center gap-2 text-sm">
          <Info class="w-4 h-4 text-slate-400" />
          <span class="text-slate-500">样本量:</span>
          <span class="font-medium text-slate-700">{{ report.sampleSize.toLocaleString() }}</span>
        </div>

        <div class="ml-auto flex items-center gap-4">
          <button
            class="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            @click="showDetails = !showDetails"
          >
            <FileText class="w-3.5 h-3.5" />
            <span>{{ showDetails ? '收起详情' : '数据详情' }}</span>
            <ChevronDown v-if="!showDetails" class="w-3.5 h-3.5" />
            <ChevronUp v-else class="w-3.5 h-3.5" />
          </button>
          <button
            class="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            @click="showCalibers = !showCalibers"
          >
            <Database class="w-3.5 h-3.5" />
            <span>{{ showCalibers ? '收起口径' : '口径规则' }}</span>
            <ChevronDown v-if="!showCalibers" class="w-3.5 h-3.5" />
            <ChevronUp v-else class="w-3.5 h-3.5" />
          </button>
          <div v-if="report" class="flex items-center gap-2 text-xs text-slate-400">
            <RefreshCcw class="w-3 h-3" />
            <span>更新于: {{ formatDateTime(new Date(report.updatedAt)) }}</span>
          </div>
          <button
            class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            :class="{ 'animate-spin': loading }"
            @click="emit('refresh')"
            title="刷新数据"
          >
            <RefreshCcw class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDetails && report" class="border-t border-slate-100 bg-slate-50 px-6 py-4">
      <div class="text-sm font-medium text-slate-700 mb-3">各数据源质量统计</div>
      <div class="grid grid-cols-3 md:grid-cols-6 gap-3">
        <div
          v-for="stat in report.fieldStats"
          :key="stat.fieldName"
          class="bg-white rounded-lg border border-slate-200 p-3"
        >
          <div class="text-xs text-slate-500 mb-2">{{ stat.fieldName }}</div>
          <div class="space-y-1.5">
            <div class="flex justify-between items-center text-xs">
              <span class="text-slate-500">记录数</span>
              <span class="font-medium text-slate-700">{{ stat.recordCount.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-slate-500">缺失值</span>
              <span :class="['font-medium', getStatLevel(stat.missingRate, true)]">
                {{ stat.missingCount }} ({{ stat.missingRate.toFixed(1) }}%)
              </span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-slate-500">异常点</span>
              <span :class="['font-medium', getStatLevel(stat.outlierRate, false)]">
                {{ stat.outlierCount }} ({{ stat.outlierRate.toFixed(1) }}%)
              </span>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-slate-500">完整度</span>
              <span :class="['font-medium', stat.completeness >= 95 ? 'text-emerald-600' : stat.completeness >= 85 ? 'text-amber-600' : 'text-rose-600']">
                {{ stat.completeness.toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCalibers" class="border-t border-slate-100 bg-slate-50 px-6 py-4">
      <div class="text-sm font-medium text-slate-700 mb-3">数据口径规则 ({{ report?.caliberVersion || 'v1.0' }})</div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="caliber in DATA_CALIBERS"
          :key="caliber.id"
          class="bg-white rounded-lg border border-slate-200 p-3"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-slate-700">{{ caliber.name }}</span>
            <span class="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded">{{ caliber.metricName }}</span>
          </div>
          <div class="space-y-1 text-xs text-slate-500">
            <div class="flex gap-2">
              <span class="text-slate-400">公式:</span>
              <code class="text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded text-[11px]">{{ caliber.formula }}</code>
            </div>
            <div class="flex gap-2">
              <span class="text-slate-400">来源:</span>
              <span>{{ caliber.source.join(', ') }}</span>
            </div>
            <div class="flex gap-2">
              <span class="text-slate-400">窗口:</span>
              <span>{{ caliber.timeWindow }}</span>
            </div>
            <div class="flex gap-2">
              <span class="text-slate-400">粒度:</span>
              <span>{{ caliber.granularity }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
