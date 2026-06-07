import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { FilterParams } from '../utils/api';

export const useFilterStore = defineStore('filter', () => {
  const startDate = ref<string>('');
  const endDate = ref<string>('');
  const enterpriseIds = ref<string[]>([]);
  const gateIds = ref<string[]>([]);
  const visitorTypes = ref<string[]>([]);
  const laneIds = ref<string[]>([]);

  const activeFilterCount = computed(() => {
    let count = 0;
    if (startDate.value || endDate.value) count++;
    if (enterpriseIds.value.length > 0) count++;
    if (gateIds.value.length > 0) count++;
    if (visitorTypes.value.length > 0) count++;
    if (laneIds.value.length > 0) count++;
    return count;
  });

  const filterParams = computed<FilterParams>(() => ({
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined,
    enterpriseIds: enterpriseIds.value.length > 0 ? enterpriseIds.value : undefined,
    gateIds: gateIds.value.length > 0 ? gateIds.value : undefined,
    visitorTypes: visitorTypes.value.length > 0 ? visitorTypes.value : undefined,
    laneIds: laneIds.value.length > 0 ? laneIds.value : undefined,
  }));

  function setDateRange(start: string, end: string) {
    startDate.value = start;
    endDate.value = end;
  }

  function toggleEnterprise(id: string) {
    const idx = enterpriseIds.value.indexOf(id);
    if (idx > -1) {
      enterpriseIds.value.splice(idx, 1);
    } else {
      enterpriseIds.value.push(id);
    }
  }

  function toggleGate(id: string) {
    const idx = gateIds.value.indexOf(id);
    if (idx > -1) {
      gateIds.value.splice(idx, 1);
    } else {
      gateIds.value.push(id);
    }
  }

  function toggleVisitorType(id: string) {
    const idx = visitorTypes.value.indexOf(id);
    if (idx > -1) {
      visitorTypes.value.splice(idx, 1);
    } else {
      visitorTypes.value.push(id);
    }
  }

  function toggleLane(id: string) {
    const idx = laneIds.value.indexOf(id);
    if (idx > -1) {
      laneIds.value.splice(idx, 1);
    } else {
      laneIds.value.push(id);
    }
  }

  function clearAll() {
    startDate.value = '';
    endDate.value = '';
    enterpriseIds.value = [];
    gateIds.value = [];
    visitorTypes.value = [];
    laneIds.value = [];
  }

  function setEnterpriseIds(ids: string[]) {
    enterpriseIds.value = ids;
  }

  function setGateIds(ids: string[]) {
    gateIds.value = ids;
  }

  return {
    startDate,
    endDate,
    enterpriseIds,
    gateIds,
    visitorTypes,
    laneIds,
    activeFilterCount,
    filterParams,
    setDateRange,
    toggleEnterprise,
    toggleGate,
    toggleVisitorType,
    toggleLane,
    clearAll,
    setEnterpriseIds,
    setGateIds,
  };
});
