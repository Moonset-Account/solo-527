<template>
  <div class="card">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-base font-semibold">异常样本</h3>
      <div class="flex items-center gap-2">
        <span class="badge-danger">{{ abnormalSamples.length }}</span>
        <button
          v-if="!filterStore.excludeAbnormal && filterStore.excludedTxIds.length === 0"
          class="btn-ghost text-xs"
          :disabled="selectedIds.size === 0"
          @click="excludeSelected"
        >
          排除选中 ({{ selectedIds.size }})
        </button>
        <button
          v-else
          class="btn-ghost text-xs"
          @click="clearExclusion"
        >
          清除排除
        </button>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left text-base-400 border-b border-surface-border">
            <th class="py-2 px-2 w-8"></th>
            <th class="py-2 px-2">日期</th>
            <th class="py-2 px-2">商户</th>
            <th class="py-2 px-2">金额</th>
            <th class="py-2 px-2">分类</th>
            <th class="py-2 px-2">异常类型</th>
            <th class="py-2 px-2">状态</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in abnormalSamples"
            :key="item.id"
            class="border-b border-surface-border/50 hover:bg-surface/30"
            :class="{ 'opacity-40': isExcluded(item.id) }"
          >
            <td class="py-2 px-2">
              <input
                type="checkbox"
                :checked="selectedIds.has(item.id)"
                :disabled="isExcluded(item.id)"
                class="accent-[#00C9A7]"
                @change="toggleSelect(item.id)"
              />
            </td>
            <td class="py-2 px-2">{{ item.date }}</td>
            <td class="py-2 px-2">{{ item.merchant }}</td>
            <td class="py-2 px-2">¥{{ item.amount.toFixed(2) }}</td>
            <td class="py-2 px-2">{{ item.category }}</td>
            <td class="py-2 px-2">
              <span :class="abnormalBadgeClass(item.abnormalType)">
                {{ abnormalLabel(item.abnormalType) }}
              </span>
            </td>
            <td class="py-2 px-2">
              <span v-if="isExcluded(item.id)" class="badge-danger text-xs">已排除</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDataStore } from '@/stores/data'
import { useFilterStore } from '@/stores/filter'

const dataStore = useDataStore()
const filterStore = useFilterStore()

const abnormalSamples = computed(() => dataStore.abnormalSamples)
const selectedIds = ref<Set<string>>(new Set())

function isExcluded(id: string): boolean {
  return filterStore.excludedTxIds.includes(id) || filterStore.excludeAbnormal
}

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
}

function excludeSelected() {
  const ids = Array.from(selectedIds.value)
  if (ids.length === 0) return
  filterStore.excludeTxIds(ids)
  selectedIds.value.clear()
}

function clearExclusion() {
  filterStore.clearExcludedTxIds()
  selectedIds.value.clear()
}

function abnormalBadgeClass(type?: 'amount' | 'frequency' | 'merchant'): string {
  switch (type) {
    case 'amount': return 'badge-danger'
    case 'frequency': return 'badge-warn'
    case 'merchant': return 'badge-info'
    default: return 'badge-warn'
  }
}

function abnormalLabel(type?: 'amount' | 'frequency' | 'merchant'): string {
  switch (type) {
    case 'amount': return '金额异常'
    case 'frequency': return '频率异常'
    case 'merchant': return '商户异常'
    default: return '未知'
  }
}
</script>
