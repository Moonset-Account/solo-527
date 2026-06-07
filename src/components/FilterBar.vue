<script setup lang="ts">
import { Filter, RotateCcw, ChevronDown } from 'lucide-vue-next';
import { useFilterStore } from '@/stores/filter';
import { ENTRANCES, AREAS, TICKET_TYPES, ACTIVITIES } from '@/data/constants';
import { computed, ref } from 'vue';

const emit = defineEmits<{
  (e: 'change'): void;
}>();

const filterStore = useFilterStore();
const showAreaDropdown = ref(false);
const showEntranceDropdown = ref(false);
const showTicketDropdown = ref(false);
const showActivityDropdown = ref(false);

const areaNames = computed(() => AREAS.map(a => a.name));
const selectedAreaLabels = computed(() => {
  return filterStore.filters.area.length > 0
    ? filterStore.filters.area.join(', ')
    : '全部区域';
});
const selectedEntranceLabels = computed(() => {
  return filterStore.filters.entrance.length > 0
    ? filterStore.filters.entrance.join(', ')
    : '全部入口';
});
const selectedTicketLabels = computed(() => {
  return filterStore.filters.ticketType.length > 0
    ? filterStore.filters.ticketType.join(', ')
    : '全部票种';
});
const selectedActivityLabels = computed(() => {
  return filterStore.filters.activity.length > 0
    ? filterStore.filters.activity.join(', ')
    : '全部活动';
});

function toggleArea(area: string) {
  const current = [...filterStore.filters.area];
  const idx = current.indexOf(area);
  if (idx >= 0) current.splice(idx, 1);
  else current.push(area);
  filterStore.setArea(current);
  emit('change');
}
function toggleEntrance(entrance: string) {
  const current = [...filterStore.filters.entrance];
  const idx = current.indexOf(entrance);
  if (idx >= 0) current.splice(idx, 1);
  else current.push(entrance);
  filterStore.setEntrance(current);
  emit('change');
}
function toggleTicket(type: string) {
  const current = [...filterStore.filters.ticketType];
  const idx = current.indexOf(type);
  if (idx >= 0) current.splice(idx, 1);
  else current.push(type);
  filterStore.setTicketType(current);
  emit('change');
}
function toggleActivity(activity: string) {
  const current = [...filterStore.filters.activity];
  const idx = current.indexOf(activity);
  if (idx >= 0) current.splice(idx, 1);
  else current.push(activity);
  filterStore.setActivity(current);
  emit('change');
}
function reset() {
  filterStore.resetFilters();
  emit('change');
}

function closeDropdowns() {
  showAreaDropdown.value = false;
  showEntranceDropdown.value = false;
  showTicketDropdown.value = false;
  showActivityDropdown.value = false;
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
    <div class="flex items-center gap-3 flex-wrap">
      <div class="flex items-center gap-2 text-slate-700">
        <Filter class="w-5 h-5 text-teal-600" />
        <span class="font-medium text-sm">筛选条件</span>
      </div>

      <div class="relative" @click.stop>
        <button
          class="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm border border-slate-200 transition-colors min-w-[140px] justify-between"
          @click="showEntranceDropdown = !showEntranceDropdown; closeDropdowns(); showEntranceDropdown = !showEntranceDropdown"
        >
          <span class="truncate">{{ selectedEntranceLabels }}</span>
          <ChevronDown class="w-4 h-4 text-slate-400" />
        </button>
        <div
          v-if="showEntranceDropdown"
          class="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-48 py-1 max-h-60 overflow-auto"
        >
          <label
            v-for="item in ENTRANCES"
            :key="item"
            class="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
          >
            <input
              type="checkbox"
              :checked="filterStore.filters.entrance.includes(item)"
              @change="toggleEntrance(item)"
              class="rounded text-teal-600 focus:ring-teal-500"
            />
            {{ item }}
          </label>
        </div>
      </div>

      <div class="relative" @click.stop>
        <button
          class="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm border border-slate-200 transition-colors min-w-[140px] justify-between"
          @click="closeDropdowns(); showAreaDropdown = !showAreaDropdown"
        >
          <span class="truncate">{{ selectedAreaLabels }}</span>
          <ChevronDown class="w-4 h-4 text-slate-400" />
        </button>
        <div
          v-if="showAreaDropdown"
          class="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-48 py-1 max-h-60 overflow-auto"
        >
          <label
            v-for="item in areaNames"
            :key="item"
            class="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
          >
            <input
              type="checkbox"
              :checked="filterStore.filters.area.includes(item)"
              @change="toggleArea(item)"
              class="rounded text-teal-600 focus:ring-teal-500"
            />
            {{ item }}
          </label>
        </div>
      </div>

      <div class="relative" @click.stop>
        <button
          class="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm border border-slate-200 transition-colors min-w-[140px] justify-between"
          @click="closeDropdowns(); showTicketDropdown = !showTicketDropdown"
        >
          <span class="truncate">{{ selectedTicketLabels }}</span>
          <ChevronDown class="w-4 h-4 text-slate-400" />
        </button>
        <div
          v-if="showTicketDropdown"
          class="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-48 py-1 max-h-60 overflow-auto"
        >
          <label
            v-for="item in TICKET_TYPES"
            :key="item"
            class="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
          >
            <input
              type="checkbox"
              :checked="filterStore.filters.ticketType.includes(item)"
              @change="toggleTicket(item)"
              class="rounded text-teal-600 focus:ring-teal-500"
            />
            {{ item }}
          </label>
        </div>
      </div>

      <div class="relative" @click.stop>
        <button
          class="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm border border-slate-200 transition-colors min-w-[140px] justify-between"
          @click="closeDropdowns(); showActivityDropdown = !showActivityDropdown"
        >
          <span class="truncate">{{ selectedActivityLabels }}</span>
          <ChevronDown class="w-4 h-4 text-slate-400" />
        </button>
        <div
          v-if="showActivityDropdown"
          class="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-48 py-1 max-h-60 overflow-auto"
        >
          <label
            v-for="item in ACTIVITIES"
            :key="item"
            class="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
          >
            <input
              type="checkbox"
              :checked="filterStore.filters.activity.includes(item)"
              @change="toggleActivity(item)"
              class="rounded text-teal-600 focus:ring-teal-500"
            />
            {{ item }}
          </label>
        </div>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <span class="text-xs text-slate-500">
          时间: {{ filterStore.timeRangeLabel }}
        </span>
        <button
          class="flex items-center gap-1 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm transition-colors"
          @click="reset"
        >
          <RotateCcw class="w-4 h-4" />
          重置
        </button>
      </div>
    </div>
  </div>
</template>
