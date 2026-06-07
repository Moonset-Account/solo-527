<script setup lang="ts">
import { AlertTriangle, X, Clock, MapPin } from 'lucide-vue-next';
import { ref, computed } from 'vue';
import type { ClosedAreaNotice } from '@/types';
import { formatTime } from '@/data/cleaner';

interface Props {
  notices: ClosedAreaNotice[];
}

const props = defineProps<Props>();
const showAll = ref(false);

const totalCapacityDeducted = computed(() => {
  return props.notices.reduce((sum, n) => sum + n.capacityReduced, 0);
});

const visibleNotices = computed(() => {
  return showAll.value ? props.notices : props.notices.slice(0, 2);
});
</script>

<template>
  <div v-if="notices.length" class="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
    <div class="flex items-center justify-between px-4 py-3 bg-amber-100/50 border-b border-amber-200">
      <div class="flex items-center gap-2">
        <AlertTriangle class="w-5 h-5 text-amber-600" />
        <span class="font-medium text-amber-800 text-sm">临时闭园通知</span>
        <span class="text-xs text-amber-600 bg-amber-200 px-2 py-0.5 rounded-full">
          扣除容量 {{ totalCapacityDeducted.toLocaleString() }} 人
        </span>
      </div>
      <button
        v-if="notices.length > 2"
        class="text-xs text-amber-600 hover:text-amber-800 hover:bg-amber-200 px-2 py-1 rounded transition-colors"
        @click="showAll = !showAll"
      >
        {{ showAll ? '收起' : `展开全部 (${notices.length})` }}
      </button>
    </div>
    <div class="divide-y divide-amber-100">
      <div
        v-for="notice in visibleNotices"
        :key="notice.areaId"
        class="px-4 py-3 flex items-start gap-3"
      >
        <MapPin class="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-medium text-amber-900 text-sm">{{ notice.areaName }}</span>
            <span class="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
              {{ notice.reason }}
            </span>
          </div>
          <div class="flex items-center gap-3 mt-1 text-xs text-amber-600">
            <span class="flex items-center gap-1">
              <Clock class="w-3 h-3" />
              {{ formatTime(new Date(notice.startTime)) }} - {{ formatTime(new Date(notice.endTime)) }}
            </span>
            <span>容量扣除: {{ notice.capacityReduced.toLocaleString() }} 人</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
