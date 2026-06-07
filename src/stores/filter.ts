import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { subDays } from 'date-fns';

export const useFilterStore = defineStore('filter', () => {
  const endDate = new Date(2026, 4, 31);
  const startDate = subDays(endDate, 29);
  
  const dateRange = ref<[Date, Date]>([startDate, endDate]);
  const selectedAreas = ref<string[]>([]);
  const selectedFloors = ref<number[]>([]);
  const preserveContext = ref(true);
  
  function setDateRange(range: [Date, Date]) {
    dateRange.value = range;
  }
  
  function setSelectedAreas(areas: string[]) {
    selectedAreas.value = areas;
  }
  
  function setSelectedFloors(floors: number[]) {
    selectedFloors.value = floors;
  }
  
  function resetFilters() {
    const end = new Date(2026, 4, 31);
    const start = subDays(end, 29);
    dateRange.value = [start, end];
    selectedAreas.value = [];
    selectedFloors.value = [];
  }
  
  return {
    dateRange,
    selectedAreas,
    selectedFloors,
    preserveContext,
    setDateRange,
    setSelectedAreas,
    setSelectedFloors,
    resetFilters,
  };
});
