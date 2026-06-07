<script setup lang="ts">
import { Database, AlertTriangle, XCircle, RefreshCcw, Info } from 'lucide-vue-next';
import { computed } from 'vue';
import type { DataQualityReport } from '@/types';
import { CALIBER_VERSION } from '@/data/calibers';
import { formatDateTime } from '@/data/cleaner';

interface Props {
  report: DataQualityReport | null;
  loading?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'refresh'): void;
}>();

const missingLevel = computed(() => {
  if (!props.report) return 'normal';
  if (props.report.missingValueRate > 10) return 'danger';
  if (props.report.missingValueRate > 5) return 'warning';
  return 'normal';
});

const anomalyLevel = computed(() => {
  if (!props.report) return 'normal';
  if (props.report.anomalyCount > 50) return 'danger';
  if (props.report.anomalyCount > 20) return 'warning';
  return 'normal';
});

const levelColors: Record<string, { bg: string; text: string; border: string }> = {
  normal: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  danger: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
};
</script>

<template>
  <div class="bg-white border-t border-slate-200 px-6 py-3">
    <div class="flex items-center gap-6 flex-wrap">
      <div class="flex items-center gap-2 text-sm">
        <Database class="w-4 h-4 text-slate-400" />
        <span class="text-slate-500">数据口径:</span>
        <span class="font-medium text-slate-700">{{ CALIBER_VERSION }}</span>
      </div>

      <div v-if="report" :class="['flex items-center gap-2 px-3 py-1 rounded-lg border text-sm', levelColors[missingLevel].bg, levelColors[missingLevel].border]">
        <AlertTriangle :class="['w-4 h-4', levelColors[missingLevel].text]" />
        <span class="text-slate-500">缺失值:</span>
        <span :class="['font-semibold', levelColors[missingLevel].text]">{{ report.missingValueRate.toFixed(1) }}%</span>
      </div>

      <div v-if="report" :class="['flex items-center gap-2 px-3 py-1 rounded-lg border text-sm', levelColors[anomalyLevel].bg, levelColors[anomalyLevel].border]">
        <XCircle :class="['w-4 h-4', levelColors[anomalyLevel].text]" />
        <span class="text-slate-500">异常点:</span>
        <span :class="['font-semibold', levelColors[anomalyLevel].text]">{{ report.anomalyCount }}</span>
      </div>

      <div v-if="report" class="flex items-center gap-2 text-sm">
        <Info class="w-4 h-4 text-slate-400" />
        <span class="text-slate-500">样本量:</span>
        <span class="font-medium text-slate-700">{{ report.totalSampleSize.toLocaleString() }}</span>
      </div>

      <div class="ml-auto flex items-center gap-4">
        <div v-if="report" class="flex items-center gap-2 text-xs text-slate-400">
          <RefreshCcw class="w-3 h-3" />
          <span>更新于: {{ formatDateTime(report.lastUpdateTime) }}</span>
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
</template>
