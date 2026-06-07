<script setup lang="ts">
import { Download, Loader2, AlertCircle, Database } from 'lucide-vue-next';

interface Props {
  title: string;
  sampleSize?: number;
  loading?: boolean;
  error?: string | null;
  showExport?: boolean;
  large?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showExport: false,
  large: false
});

const emit = defineEmits<{
  (e: 'export'): void;
}>();
</script>

<template>
  <div
    :class="[
      'bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden',
      large ? 'col-span-2 row-span-2' : ''
    ]"
  >
    <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div class="flex items-center gap-3">
        <h3 class="font-semibold text-slate-800">{{ title }}</h3>
        <div v-if="sampleSize !== undefined" class="flex items-center gap-1 text-xs text-slate-400">
          <Database class="w-3 h-3" />
          <span>样本量: {{ sampleSize.toLocaleString() }}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div v-if="loading" class="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 class="w-4 h-4 animate-spin" />
          <span>加载中</span>
        </div>
        <div v-else-if="error" class="flex items-center gap-1 text-sm text-rose-500">
          <AlertCircle class="w-4 h-4" />
          <span>数据异常</span>
        </div>
        <button
          v-if="showExport && !loading"
          class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          @click="emit('export')"
          title="导出数据"
        >
          <Download class="w-4 h-4" />
        </button>
      </div>
    </div>
    <div class="flex-1 p-4 min-h-0 relative">
      <slot />
      <div v-if="loading" class="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
        <Loader2 class="w-8 h-8 animate-spin text-teal-600" />
      </div>
    </div>
  </div>
</template>
