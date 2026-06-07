<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-base-500">预算进度</h3>
      <span v-if="currentPeriod" class="badge-info text-xs">{{ currentPeriod }}</span>
    </div>
    <div class="space-y-3">
      <div
        v-for="item in dataStore.budgetProgress"
        :key="item.category"
        class="cursor-pointer group"
        @click="filterStore.toggleCategoryDrilldown(item.category)"
      >
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2">
            <span class="text-sm text-base-500 group-hover:text-accent transition-colors duration-200">{{ item.category }}</span>
            <span v-if="item.spentAmount > item.budgetAmount" class="badge-warn text-xs">
              ⚠ 超支
            </span>
          </div>
          <div class="flex items-center gap-1.5 text-xs">
            <span :class="getAmountColorClass(item)">¥{{ item.spentAmount.toLocaleString() }}</span>
            <span class="text-base-600">/</span>
            <span class="text-base-600">¥{{ item.budgetAmount.toLocaleString() }}</span>
          </div>
        </div>
        <div class="w-full h-2.5 bg-base-800 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500 ease-out"
            :class="getBarColorClass(item)"
            :style="{ width: getBarWidth(item) + '%' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from '@/stores/data'
import { useFilterStore } from '@/stores/filter'
import type { BudgetItem } from '@/types'

const dataStore = useDataStore()
const filterStore = useFilterStore()

const currentPeriod = computed(() => {
  const items = dataStore.budgetProgress
  if (items.length > 0) return items[0].period
  return ''
})

function getRatio(item: BudgetItem): number {
  if (item.budgetAmount <= 0) return 0
  return item.spentAmount / item.budgetAmount
}

function getBarWidth(item: BudgetItem): number {
  return Math.min(getRatio(item) * 100, 100)
}

function getBarColorClass(item: BudgetItem): string {
  const ratio = getRatio(item)
  if (ratio >= 1) return 'bg-danger'
  if (ratio >= 0.8) return 'bg-warn'
  return 'bg-accent'
}

function getAmountColorClass(item: BudgetItem): string {
  const ratio = getRatio(item)
  if (ratio >= 1) return 'text-danger font-medium'
  if (ratio >= 0.8) return 'text-warn font-medium'
  return 'text-accent'
}
</script>
