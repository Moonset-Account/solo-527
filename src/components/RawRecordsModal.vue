<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { X, Download, ChevronLeft, ChevronRight, Filter, Database, Clock, Layers } from 'lucide-vue-next';
import type { RawRecord, FilterState } from '@/types';
import { generateRawRecords } from '@/data/mockData';
import { generateCSV, formatDateTime } from '@/data/cleaner';

interface Props {
  show: boolean;
  title: string;
  filters: FilterState;
  areaId?: string;
  recordType?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
}>();

const page = ref(1);
const pageSize = 20;
const loading = ref(false);
const records = ref<RawRecord[]>([]);
const total = ref(0);
const sampleSize = ref(0);

async function fetchData() {
  if (!props.show) return;
  loading.value = true;
  try {
    await new Promise(r => setTimeout(r, 200));
    const result = generateRawRecords(props.filters, props.areaId, props.recordType, page.value, pageSize);
    records.value = result.data;
    total.value = result.total;
    sampleSize.value = result.sampleSize;
  } finally {
    loading.value = false;
  }
}

watch(() => [props.show, page], () => {
  fetchData();
}, { immediate: true });

const totalPages = computed(() => Math.ceil(total.value / pageSize));

function exportData() {
  const exportData = records.value.map(r => ({
    ID: r.id,
    时间: formatDateTime(r.timestamp),
    类型: r.type,
    ...r.data
  }));
  generateCSV(exportData, `原始记录_${props.title}`);
}

const filterSummary = computed(() => {
  const parts: string[] = [];
  if (props.filters.entrance.length) parts.push(`入口: ${props.filters.entrance.join(',')}`);
  if (props.filters.area.length) parts.push(`区域: ${props.filters.area.join(',')}`);
  if (props.filters.ticketType.length) parts.push(`票种: ${props.filters.ticketType.join(',')}`);
  if (props.filters.activity.length) parts.push(`活动: ${props.filters.activity.join(',')}`);
  const { start, end } = props.filters.timeRange;
  parts.push(`时间: ${formatDateTime(start)} ~ ${formatDateTime(end)}`);
  return parts.join(' | ');
});

function getTypeIcon(type: string) {
  const icons: Record<string, string> = {
    ticket: '🎫',
    gate: '🚪',
    parking: '🅿️',
    consumption: '💳'
  };
  return icons[type] || '📋';
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    ticket: '门票',
    gate: '闸机',
    parking: '停车',
    consumption: '消费'
  };
  return labels[type] || type;
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="emit('close')" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
            <div>
              <h2 class="text-lg font-semibold text-slate-800">{{ title }} - 原始记录</h2>
              <div class="flex items-center gap-4 mt-1 text-xs text-slate-500">
                <span class="flex items-center gap-1">
                  <Filter class="w-3 h-3" />
                  {{ filterSummary }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                @click="exportData"
              >
                <Download class="w-4 h-4" />
                导出
              </button>
              <button
                class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                @click="emit('close')"
              >
                <X class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="flex items-center gap-6 px-6 py-3 bg-teal-50/50 border-b border-teal-100">
            <div class="flex items-center gap-2 text-sm">
              <Database class="w-4 h-4 text-teal-600" />
              <span class="text-slate-600">样本量:</span>
              <span class="font-semibold text-teal-700">{{ sampleSize.toLocaleString() }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <Layers class="w-4 h-4 text-teal-600" />
              <span class="text-slate-600">当前显示:</span>
              <span class="font-semibold text-teal-700">{{ records.length }} / {{ total }} 条</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <Clock class="w-4 h-4 text-slate-400" />
              <span class="text-slate-500">时间窗口: {{ Math.round((props.filters.timeRange.end.getTime() - props.filters.timeRange.start.getTime()) / 3600000) }} 小时</span>
            </div>
          </div>

          <div class="flex-1 overflow-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 sticky top-0">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-slate-500">类型</th>
                  <th class="px-4 py-3 text-left font-medium text-slate-500">时间</th>
                  <th class="px-4 py-3 text-left font-medium text-slate-500">详情</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="record in records" :key="record.id" class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-xs">
                      <span>{{ getTypeIcon(record.type) }}</span>
                      <span class="text-slate-600">{{ getTypeLabel(record.type) }}</span>
                    </span>
                  </td>
                  <td class="px-4 py-3 text-slate-600 font-mono text-xs">{{ formatDateTime(record.timestamp) }}</td>
                  <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-x-4 gap-y-1">
                      <span
                        v-for="(value, key) in record.data"
                        :key="key"
                        class="text-xs"
                      >
                        <span class="text-slate-400">{{ key }}:</span>
                        <span class="text-slate-700 font-medium ml-1">{{ value }}</span>
                      </span>
                    </div>
                  </td>
                </tr>
                <tr v-if="loading">
                  <td colspan="3" class="px-4 py-12 text-center text-slate-400">加载中...</td>
                </tr>
                <tr v-else-if="!records.length">
                  <td colspan="3" class="px-4 py-12 text-center text-slate-400">暂无数据</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
            <span class="text-sm text-slate-500">
              第 {{ page }} / {{ totalPages }} 页
            </span>
            <div class="flex items-center gap-1">
              <button
                class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                :disabled="page <= 1"
                @click="page--"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
              <button
                class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                :disabled="page >= totalPages"
                @click="page++"
              >
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95) translateY(10px);
}
</style>
