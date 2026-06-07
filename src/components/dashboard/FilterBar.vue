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

const emit = defineEmits<{
  (e: 'export'): void;
  (e: 'refresh'): void;
}>();

onMounted(async () => {
  dimensions.value = await api.getDimensions();
});

const enterpriseOptions = computed(() => dimensions.value?.enterprises || []);
const gateOptions = computed(() => dimensions.value?.gates || []);
const visitorTypeOptions = computed(() => dimensions.value?.visitorTypes || []);
const laneOptions = computed(() => dimensions.value?.lanes || []);

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
            class="btn-secondary flex items-center gap-2 text-sm"
            @click="showEnterpriseDropdown = !showEnterpriseDropdown"
          >
            <Building2 class="w-4 h-4" />
            企业
            <span v-if="store.enterpriseIds.length > 0" class="tag tag-info ml-1">
              {{ store.enterpriseIds.length }}
            </span>
          </button>
          <div
            v-if="showEnterpriseDropdown"
            class="absolute top-full left-0 mt-1 w-56 max-h-60 overflow-y-auto glass-card z-50 py-2"
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
            class="btn-secondary flex items-center gap-2 text-sm"
            @click="showGateDropdown = !showGateDropdown"
          >
            <MapPin class="w-4 h-4" />
            入口
            <span v-if="store.gateIds.length > 0" class="tag tag-info ml-1">
              {{ store.gateIds.length }}
            </span>
          </button>
          <div
            v-if="showGateDropdown"
            class="absolute top-full left-0 mt-1 w-44 max-h-60 overflow-y-auto glass-card z-50 py-2"
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
            class="btn-secondary flex items-center gap-2 text-sm"
            @click="showVisitorDropdown = !showVisitorDropdown"
          >
            <Users class="w-4 h-4" />
            访客类型
            <span v-if="store.visitorTypes.length > 0" class="tag tag-info ml-1">
              {{ store.visitorTypes.length }}
            </span>
          </button>
          <div
            v-if="showVisitorDropdown"
            class="absolute top-full left-0 mt-1 w-44 max-h-60 overflow-y-auto glass-card z-50 py-2"
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

        <button class="btn-secondary flex items-center gap-2 text-sm">
          <Calendar class="w-4 h-4" />
          时段
        </button>

        <div class="relative">
          <button class="btn-secondary flex items-center gap-2 text-sm">
            <Route class="w-4 h-4" />
            车道
            <span v-if="store.laneIds.length > 0" class="tag tag-info ml-1">
              {{ store.laneIds.length }}
            </span>
          </button>
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
    </div>
  </div>
</template>
