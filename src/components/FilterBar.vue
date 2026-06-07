<template>
  <div class="sticky top-0 z-50 bg-base-900/95 backdrop-blur border-b border-surface-border">
    <div class="flex flex-wrap items-center gap-3 px-5 py-3">
      <div
        v-for="cfg in filterConfigs"
        :key="cfg.field"
        class="relative"
        ref="dropdownRefs"
      >
        <button
          class="flex items-center gap-2 px-3 py-1.5 bg-base-800 border border-surface-border rounded-lg text-sm text-base-500 hover:text-accent hover:border-accent/30 transition-all duration-200"
          @click="toggleDropdown(cfg.field)"
        >
          <span>{{ cfg.label }}</span>
          <span v-if="getSelectedCount(cfg.field) > 0" class="badge-accent text-xs px-1.5 py-0.5 rounded-full">
            {{ getSelectedCount(cfg.field) }}
          </span>
          <svg class="w-3.5 h-3.5 transition-transform duration-200" :class="{ 'rotate-180': openDropdown === cfg.field }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          v-show="openDropdown === cfg.field"
          class="absolute top-full left-0 mt-1 w-44 max-h-56 overflow-y-auto bg-base-800 border border-surface-border rounded-lg shadow-xl z-50"
        >
          <label
            v-for="opt in filterStore.options[cfg.field]"
            :key="opt"
            class="flex items-center gap-2 px-3 py-2 text-sm hover:bg-base-700 cursor-pointer transition-colors duration-150"
          >
            <input
              type="checkbox"
              :checked="isSelected(cfg.field, opt)"
              @change="toggleOption(cfg.field, opt)"
              class="accent-accent w-3.5 h-3.5"
            />
            <span class="text-base-500">{{ opt }}</span>
          </label>
        </div>
      </div>

      <label class="flex items-center gap-2 px-3 py-1.5 bg-base-800 border border-surface-border rounded-lg text-sm cursor-pointer hover:border-accent/30 transition-all duration-200">
        <input
          type="checkbox"
          :checked="filterStore.excludeAbnormal"
          @change="filterStore.setFilter('excludeAbnormal', !filterStore.excludeAbnormal)"
          class="accent-warn w-3.5 h-3.5"
        />
        <span class="text-base-500">排除异常</span>
      </label>

      <button
        v-if="filterStore.activeFilterCount > 0"
        class="btn-ghost text-sm py-1.5 px-3"
        @click="filterStore.clearAll()"
      >
        清空筛选
      </button>
    </div>

    <div v-if="allSelectedTags.length > 0" class="flex flex-wrap items-center gap-2 px-5 pb-3">
      <span
        v-for="tag in allSelectedTags"
        :key="tag.field + tag.value"
        class="filter-tag"
        @click="toggleOption(tag.field, tag.value)"
      >
        <span class="text-xs opacity-70">{{ tag.label }}:</span>
        <span>{{ tag.value }}</span>
        <svg class="w-3 h-3 opacity-60 hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useFilterStore } from '@/stores/filter'
import type { FilterState } from '@/types'

const filterStore = useFilterStore()

const openDropdown = ref<string | null>(null)

const filterConfigs: { field: keyof Pick<FilterState, 'accounts' | 'categories' | 'members' | 'months' | 'merchants'>; label: string }[] = [
  { field: 'accounts', label: '账户' },
  { field: 'categories', label: '分类' },
  { field: 'members', label: '成员' },
  { field: 'months', label: '月份' },
  { field: 'merchants', label: '商户' },
]

function toggleDropdown(field: string) {
  openDropdown.value = openDropdown.value === field ? null : field
}

function isSelected(field: string, value: string): boolean {
  return (filterStore[field as keyof typeof filterStore] as unknown as string[]).includes(value)
}

function toggleOption(field: string, value: string) {
  const current = [...(filterStore[field as keyof typeof filterStore] as unknown as string[])]
  const idx = current.indexOf(value)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(value)
  }
  filterStore.setFilter(field as keyof FilterState, current)
}

function getSelectedCount(field: string): number {
  return (filterStore[field as keyof typeof filterStore] as unknown as string[]).length
}

const allSelectedTags = computed(() => {
  const tags: { field: string; label: string; value: string }[] = []
  for (const cfg of filterConfigs) {
    const values = filterStore[cfg.field] as unknown as string[]
    for (const v of values) {
      tags.push({ field: cfg.field, label: cfg.label, value: v })
    }
  }
  return tags
})

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.relative')) {
    openDropdown.value = null
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>
