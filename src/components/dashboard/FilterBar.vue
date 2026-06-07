<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Filter, X, Download, RefreshCw, Calendar, Building2, MapPin, Users, Route } from 'lucide-vue-next';
import { useFilterStore } from '../../stores/filterStore';
import { api, type Dimensions } from '../../utils/api';

const store = useFilterStore();

const dimensions = ref<Dimensions | null>(null);
const showEnterpriseDropdown = ref(false);
const showGateDropdown = ref(false);
const showVisitorDropdown = ref(false);
const showLaneDropdown = ref(false);
const showDateDropdown = ref(false);

const datePresets = [
  { label: '今日', value: 'today' },
  { label: '昨日', value: 'yesterday' },
  { label: '近7天', value: '7days' },
  { label: '近30天', value: '30days' },
];

const selectedPreset = ref('30days');

const emit = defineEmits<{
  (e: 'export'): void;
  (e: 'refresh'): void;
}>();

onMounted(async () => {
  dimensions.value = await api.getDimensions();
  applyDatePreset('30days');
});

const enterpriseOptions = computed(() => dimensions.value?.enterprises || []);
const gateOptions = computed(() => dimensions.value?.gates || []);
const visitorTypeOptions = computed(() => dimensions.value?.visitorTypes || []);
const laneOptions = computed(() => dimensions.value?.lanes || []);

function applyDatePreset(preset: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let start = new Date(today);

  switch (preset) {
    case 'today':
      start = new Date(today);
      break;
    case 'yesterday':
      start = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      today.setTime(start.getTime());
      break;
    case '7days':
      start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30days':
      start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const end = new Date(today);
  end.setHours(23, 59, 59, 999);
  
  store.setDateRange(start.toISOString(), end.toISOString());
  selectedPreset.value = preset;
  showDateDropdown.value = false;
}

function toggleEnterprise(id: string) {
  store.toggleEnterprise(id);
}

function toggleGate(id: string) {
  store.toggleGate(id);
}

function toggleVisitorType(id: string) {
  store.toggleVisitorType(id);
}

function toggleLane(id: string) {
  store.toggleLane(id);
}

function closeDropdowns(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.dropdown-trigger') && !target.closest('.dropdown-menu')) {
    showEnterpriseDropdown.value = false;
    showGateDropdown.value = false;
    showVisitorDropdown.value = false;
    showLaneDropdown.value = false;
    showDateDropdown.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdowns);
});

const currentDateLabel = computed(() => {
  const preset = datePresets.find(p => p.value === selectedPreset.value);
  return preset?.label || '自定义';
});
</script>

<template>
  <div class="glass-card p-4">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-2">
        <Filter class="w-5 h-5 text-[var(--color-accent-light)]" />
        <span class="text-sm font-medium text-[var(--color-text-primary)]">筛选维度</span>
        <span v-if="store.activeFilterCount > 0" class="tag tag-info">
          {{ store.activeFilterCount }} 个筛选
        </span>
      </div>

      <div class="flex items-center gap-2 flex-wrap">
        <div class="relative">
          <button
            class="btn-secondary flex items-center gap-2 text-sm dropdown-trigger"
            @click.stop="showEnterpriseDropdown = !showEnterpriseDropdown"
          >
            <Building2 class="w-4 h-4" />
            企业
            <span v-if="store.enterpriseIds.length > 0" class="tag tag-info ml-1">
              {{ store.enterpriseIds.length }}
            </span>
          </button>
          <div
            v-if="showEnterpriseDropdown"
            class="absolute top-full left-0 mt-1 w-56 max-h-60 overflow-y-auto glass-card z-50 py-2 dropdown-menu"
          >
            <label
              v-for="opt in enterpriseOptions"
              :key="opt.id"
              class="flex items-center gap-2 px-3 py-2 hover:bg-[var(--color-bg-dark)] cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                :checked="store.enterpriseIds.includes(opt.id)"
                @change="toggleEnterprise(opt.id)"
                class="rounded border-[var(--color-border)] bg-transparent"
              />
              <span class="truncate">{{ opt.name }}</span>
            </label>
          </div>
        </div>

        <div class="relative">
          <button
            class="btn-secondary flex items-center gap-2 text-sm dropdown-trigger"
            @click.stop="showGateDropdown = !showGateDropdown"
          >
            <MapPin class="w-4 h-4" />
            入口
            <span v-if="store.gateIds.length > 0" class="tag tag-info ml-1">
              {{ store.gateIds.length }}
            </span>
          </button>
          <div
            v-if="showGateDropdown"
            class="absolute top-full left-0 mt-1 w-44 max-h-60 overflow-y-auto glass-card z-50 py-2 dropdown-menu"
          >
            <label
              v-for="opt in gateOptions"
              :key="opt.id"
              class="flex items-center gap-2 px-3 py-2 hover:bg-[var(--color-bg-dark)] cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                :checked="store.gateIds.includes(opt.id)"
                @change="toggleGate(opt.id)"
                class="rounded border-[var(--color-border)] bg-transparent"
              />
              <span>{{ opt.name }}</span>
            </label>
          </div>
        </div>

        <div class="relative">
          <button
            class="btn-secondary flex items-center gap-2 text-sm dropdown-trigger"
            @click.stop="showVisitorDropdown = !showVisitorDropdown"
          >
            <Users class="w-4 h-4" />
            访客类型
            <span v-if="store.visitorTypes.length > 0" class="tag tag-info ml-1">
              {{ store.visitorTypes.length }}
            </span>
          </button>
          <div
            v-if="showVisitorDropdown"
            class="absolute top-full left-0 mt-1 w-44 max-h-60 overflow-y-auto glass-card z-50 py-2 dropdown-menu"
          >
            <label
              v-for="opt in visitorTypeOptions"
              :key="opt.id"
              class="flex items-center gap-2 px-3 py-2 hover:bg-[var(--color-bg-dark)] cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                :checked="store.visitorTypes.includes(opt.id)"
                @change="toggleVisitorType(opt.id)"
                class="rounded border-[var(--color-border)] bg-transparent"
              />
              <span>{{ opt.name }}</span>
            </label>
          </div>
        </div>

        <div class="relative">
          <button
            class="btn-secondary flex items-center gap-2 text-sm dropdown-trigger"
            @click.stop="showDateDropdown = !showDateDropdown"
          >
            <Calendar class="w-4 h-4" />
            {{ currentDateLabel }}
          </button>
          <div
            v-if="showDateDropdown"
            class="absolute top-full left-0 mt-1 w-36 glass-card z-50 py-2 dropdown-menu"
          >
            <div
              v-for="preset in datePresets"
              :key="preset.value"
              class="px-3 py-2 hover:bg-[var(--color-bg-dark)] cursor-pointer text-sm"
              :class="{ 'text-[var(--color-accent-light)] font-medium': selectedPreset === preset.value }"
              @click="applyDatePreset(preset.value)"
            >
              {{ preset.label }}
            </div>
          </div>
        </div>

        <div class="relative">
          <button
            class="btn-secondary flex items-center gap-2 text-sm dropdown-trigger"
            @click.stop="showLaneDropdown = !showLaneDropdown"
          >
            <Route class="w-4 h-4" />
            车道
            <span v-if="store.laneIds.length > 0" class="tag tag-info ml-1">
              {{ store.laneIds.length }}
            </span>
          </button>
          <div
            v-if="showLaneDropdown"
            class="absolute top-full left-0 mt-1 w-48 max-h-60 overflow-y-auto glass-card z-50 py-2 dropdown-menu"
          >
            <label
              v-for="opt in laneOptions"
              :key="opt.id"
              class="flex items-center gap-2 px-3 py-2 hover:bg-[var(--color-bg-dark)] cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                :checked="store.laneIds.includes(opt.id)"
                @change="toggleLane(opt.id)"
                class="rounded border-[var(--color-border)] bg-transparent"
              />
              <span class="truncate">{{ opt.name }}</span>
            </label>
          </div>
        </div>

        <button
          v-if="store.activeFilterCount > 0"
          class="btn-secondary flex items-center gap-2 text-sm"
          @click="store.clearAll()"
        >
          <X class="w-4 h-4" />
          清除
        </button>

        <div class="w-px h-6 bg-[var(--color-border)] mx-1" />

        <button class="btn-secondary flex items-center gap-2 text-sm" @click="emit('refresh')">
          <RefreshCw class="w-4 h-4" />
          刷新
        </button>

        <button class="btn-primary flex items-center gap-2 text-sm" @click="emit('export')">
          <Download class="w-4 h-4" />
          导出
        </button>
      </div>
    </div>

    <div v-if="store.activeFilterCount > 0" class="mt-3 flex flex-wrap gap-2">
      <span
        v-for="id in store.enterpriseIds"
        :key="'e-' + id"
        class="filter-chip filter-chip-active"
        @click="toggleEnterprise(id)"
      >
        {{ enterpriseOptions.find(e => e.id === id)?.name }}
        <X class="w-3 h-3" />
      </span>
      <span
        v-for="id in store.gateIds"
        :key="'g-' + id"
        class="filter-chip filter-chip-active"
        @click="toggleGate(id)"
      >
        {{ gateOptions.find(g => g.id === id)?.name }}
        <X class="w-3 h-3" />
      </span>
      <span
        v-for="id in store.visitorTypes"
        :key="'v-' + id"
        class="filter-chip filter-chip-active"
        @click="toggleVisitorType(id)"
      >
        {{ visitorTypeOptions.find(v => v.id === id)?.name }}
        <X class="w-3 h-3" />
      </span>
      <span
        v-for="id in store.laneIds"
        :key="'l-' + id"
        class="filter-chip filter-chip-active"
        @click="toggleLane(id)"
      >
        {{ laneOptions.find(l => l.id === id)?.name }}
        <X class="w-3 h-3" />
      </span>
    </div>
  </div>
</template>
