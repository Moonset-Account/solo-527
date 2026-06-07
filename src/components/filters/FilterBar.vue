<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useFilterStore } from '@/stores/filter';
import { dataAdapter } from '@/api/adapter';
import { Calendar, MapPin, Building2, RotateCcw, Download } from 'lucide-vue-next';
import { format } from 'date-fns';
import type { Area } from '@/types';

const filterStore = useFilterStore();
const areas = ref<Area[]>([]);

const floors = [1, 2, 3, 4, 5];

const dateRangeText = computed(() => {
  const [start, end] = filterStore.dateRange;
  return `${format(start, 'yyyy-MM-dd')} 至 ${format(end, 'yyyy-MM-dd')}`;
});

onMounted(async () => {
  areas.value = await dataAdapter.getAreas();
});

function resetFilters() {
  filterStore.resetFilters();
}
</script>

<template>
  <div class="flex items-center gap-4 flex-wrap">
    <div class="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
      <Calendar class="w-4 h-4 text-slate-500" />
      <span class="text-sm text-slate-700 font-medium">{{ dateRangeText }}</span>
    </div>
    
    <div class="relative group">
      <button class="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
        <MapPin class="w-4 h-4 text-slate-500" />
        <span class="text-sm text-slate-700">
          {{ filterStore.selectedAreas.length > 0 ? `已选 ${filterStore.selectedAreas.length} 个区域` : '全部区域' }}
        </span>
      </button>
      <div class="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl p-3 w-64 hidden group-hover:block z-50">
        <div class="space-y-2 max-h-64 overflow-auto">
          <label v-for="area in areas" :key="area.areaId" class="flex items-center gap-2 hover:bg-slate-50 px-2 py-1 rounded cursor-pointer">
            <input 
              type="checkbox" 
              :value="area.areaId"
              v-model="filterStore.selectedAreas"
              class="rounded text-blue-600"
            />
            <span class="text-sm text-slate-700">{{ area.areaName }}</span>
          </label>
        </div>
      </div>
    </div>
    
    <div class="relative group">
      <button class="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
        <Building2 class="w-4 h-4 text-slate-500" />
        <span class="text-sm text-slate-700">
          {{ filterStore.selectedFloors.length > 0 ? `已选 ${filterStore.selectedFloors.length} 层` : '全部楼层' }}
        </span>
      </button>
      <div class="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl p-3 hidden group-hover:block z-50">
        <div class="flex gap-2">
          <label v-for="floor in floors" :key="floor" class="flex items-center gap-1 hover:bg-slate-50 px-2 py-1 rounded cursor-pointer">
            <input 
              type="checkbox" 
              :value="floor"
              v-model="filterStore.selectedFloors"
              class="rounded text-blue-600"
            />
            <span class="text-sm text-slate-700">{{ floor }}F</span>
          </label>
        </div>
      </div>
    </div>
    
    <div class="flex-1"></div>
    
    <button 
      class="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
      @click="resetFilters"
    >
      <RotateCcw class="w-4 h-4" />
      重置
    </button>
  </div>
</template>
