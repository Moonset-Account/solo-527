<template>
  <div class="overflow-x-auto rounded-btn border border-brand/10 bg-white">
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-brand/10 bg-cream/50">
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 text-left font-medium text-bark/70 whitespace-nowrap"
            :class="{ 'cursor-pointer select-none hover:text-brand': col.sortable }"
            @click="col.sortable && toggleSort(col.key)"
          >
            <span class="flex items-center gap-1">
              {{ col.label }}
              <span v-if="col.sortable && sortKey === col.key" class="text-accent">
                {{ sortOrder === 'asc' ? '↑' : '↓' }}
              </span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in sortedData"
          :key="i"
          class="border-b border-brand/5 transition-colors hover:bg-cream/30"
          :class="{ 'cursor-pointer': clickable }"
          @click="clickable && $emit('rowClick', row)"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-3 whitespace-nowrap"
            :class="col.class"
          >
            <slot :name="col.key" :row="row" :value="row[col.key]">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
        <tr v-if="!sortedData.length">
          <td :colspan="columns.length" class="px-4 py-8 text-center text-bark/40">
            暂无数据
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface Column {
  key: string
  label: string
  sortable?: boolean
  class?: string
}

const props = defineProps<{
  columns: Column[]
  data: Record<string, any>[]
  clickable?: boolean
}>()

defineEmits<{
  rowClick: [row: Record<string, any>]
}>()

const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

const toggleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}

const sortedData = computed(() => {
  if (!sortKey.value) return props.data
  const key = sortKey.value
  const order = sortOrder.value === 'asc' ? 1 : -1
  return [...props.data].sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * order
    return String(va).localeCompare(String(vb)) * order
  })
})
</script>
