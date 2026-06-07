<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { X, Download, ChevronLeft, ChevronRight, Filter, Database, Clock, Layers } from 'lucide-vue-next';
import type { FilterState } from '@/types';
import { useRawRecordsStore } from '@/stores/rawRecords';
import { storeToRefs } from 'pinia';
import { generateCSV, formatDateTime } from '@/data/cleaner';

interface Props {
  show: boolean;
  title: string;
  filters: FilterState;
  areaId?: string;
  source?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
}>();

const rawRecordsStore = useRawRecordsStore();
const { records, loading, page, pageSize, total, lastUpdate } = storeToRefs(rawRecordsStore);

const localPage = ref(1);

async function fetchData() {
  if (!props.show) return;
  await rawRecordsStore.fetchRecords(props.filters, {
    page: localPage.value,
    pageSize: pageSize.value,
    areaId: props.areaId,
    source: props.source
  });
}

watch(() => [props.show, localPage.value], async () => {
  if (props.show) {
    await fetchData();
  }
}, { immediate: false });

watch(() => props.show, (newVal) => {
  if (newVal) {
    localPage.value = 1;
    rawRecordsStore.reset();
  }
});

async function goToPage(p: number) {
  if (p < 1 || p > totalPages.value) return;
  localPage.value = p;
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

function exportData() {
  const exportData = records.value.map(r => ({
    ID: r.id,
    来源: getTypeLabel(r.source),
    时间: formatDateTime(new Date(r.time)),
    标题: r.title,
    描述: r.description,
    ...r.metadata
  }));
  generateCSV(exportData, `原始记录_${props.title}`);
}

const filterSummary = computed(() => {
  const parts: string[] = [];
  if (props.filters.entrance.length) parts.push(`入口: ${props.filters.entrance.join(',')}`);
  if (props.filters.area.length) parts.push(`区域: ${props.filters.area.join(',')}`);
  if (props.filters.ticketType.length) parts.push(`票种: ${props.filters.ticketType.join(',')}`);
  if (props.filters.activity.length) parts.push(`活动: ${props.filters.activity.join(',')}`);
  if (props.areaId) parts.push(`下钻区域: ${props.areaId}`);
  if (props.source) parts.push(`数据来源: ${getTypeLabel(props.source)}`);
  if (props.filters.timeRange) {
    const [start, end] = props.filters.timeRange;
    parts.push(`时间: ${formatDateTime(start)} ~ ${formatDateTime(end)}`);
  }
  return parts.join(' | ');
});

function getTypeIcon(type: string) {
  const icons: Record<string, string> = {
    ticket: '🎫',
    gate: '🚪',
    parking: '🅿️',
    consumption: '💳',
    weather: '🌤️',
    show: '🎭'
  };
  return icons[type] || '📋';
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    ticket: '门票',
    gate: '闸机',
    parking: '停车',
    consumption: '消费',
    weather: '天气',
    show: '演出'
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
              <span class="font-semibold text-teal-700">{{ total.toLocaleString() }}</span>
            </div>
            <div class="flex items-center gap-2 text-sm">
              <Layers class="w-4 h-4 text-teal-600" />
              <span class="text-slate-600">当前显示:</span>
              <span class="font-semibold text-teal-700">{{ records.length }} / {{ total }} 条</span>
            </div>
            <div v-if="lastUpdate" class="flex items-center gap-2 text-sm">
              <Clock class="w-4 h-4 text-slate-400" />
              <span class="text-slate-500">更新时间: {{ formatDateTime(lastUpdate) }}</span>
            </div>
          </div>

          <div class="flex-1 overflow-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 sticky top-0">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-slate-500">来源</th>
                  <th class="px-4 py-3 text-left font-medium text-slate-500">时间</th>
                  <th class="px-4 py-3 text-left font-medium text-slate-500">标题</th>
                  <th class="px-4 py-3 text-left font-medium text-slate-500">详情</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="record in records" :key="record.id" class="hover:bg-slate-50 transition-colors">
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-md text-xs">
                      <span>{{ getTypeIcon(record.source) }}</span>
                      <span class="text-slate-600">{{ getTypeLabel(record.source) }}</span>
                    </span>
                  </td>
                  <td class="px-4 py-3 text-slate-600 font-mono text-xs">{{ formatDateTime(new Date(record.time)) }}</td>
                  <td class="px-4 py-3 text-slate-700 font-medium">{{ record.title }}</td>
                  <td class="px-4 py-3 text-slate-600">{{ record.description }}</td>
                </tr>
                <tr v-if="loading">
                  <td colspan="4" class="px-4 py-12 text-center text-slate-400">加载中...</td>
                </tr>
                <tr v-else-if="!records.length">
                  <td colspan="4" class="px-4 py-12 text-center text-slate-400">暂无数据</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50">
            <span class="text-sm text-slate-500">
              第 {{ localPage }} / {{ totalPages }} 页
            </span>
            <div class="flex items-center gap-1">
              <button
                class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                :disabled="localPage <= 1"
                @click="goToPage(localPage - 1)"
              >
                <ChevronLeft class="w-4 h-4" />
              </button>
              <button
                class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                :disabled="localPage >= totalPages"
                @click="goToPage(localPage + 1)"
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
