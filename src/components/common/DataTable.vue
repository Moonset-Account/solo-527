<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronUp, ChevronDown, Search } from 'lucide-vue-next'

interface Column {
  key: string
  label: string
  sortable?: boolean
  width?: string
}

const props = defineProps<{
  columns: Column[]
  data: Record<string, any>[]
  searchable?: boolean
  searchPlaceholder?: string
}>()

const searchQuery = ref('')
const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

const filteredData = computed(() => {
  let result = [...props.data]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(q)),
    )
  }
  if (sortKey.value) {
    result.sort((a, b) => {
      const aVal = a[sortKey.value]
      const bVal = b[sortKey.value]
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortOrder.value === 'asc' ? cmp : -cmp
    })
  }
  return result
})

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
}
</script>

<template>
  <div class="bg-white rounded-xl border border-rosegold/10 overflow-hidden">
    <div v-if="searchable" class="p-4 border-b border-rosegold/10">
      <div class="relative max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grayrose/50" />
        <input
          v-model="searchQuery"
          :placeholder="searchPlaceholder || '搜索...'"
          class="w-full pl-10 pr-4 py-2 text-sm border border-rosegold/10 rounded-lg focus:outline-none focus:border-rosegold/30 bg-warmwhite"
        />
      </div>
    </div>
    <div class="overflow-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-rosegold/10 bg-warmwhite">
            <th
              v-for="col in columns"
              :key="col.key"
              :style="col.width ? { width: col.width } : {}"
              class="px-4 py-3 text-left text-xs font-medium text-grayrose uppercase tracking-wider"
            >
              <button
                v-if="col.sortable"
                class="flex items-center gap-1 hover:text-rosegold transition-colors"
                @click="toggleSort(col.key)"
              >
                {{ col.label }}
                <span class="flex flex-col">
                  <ChevronUp :class="['w-3 h-3', sortKey === col.key && sortOrder === 'asc' ? 'text-rosegold' : 'text-grayrose/30']" />
                  <ChevronDown :class="['w-3 h-3 -mt-1', sortKey === col.key && sortOrder === 'desc' ? 'text-rosegold' : 'text-grayrose/30']" />
                </span>
              </button>
              <span v-else>{{ col.label }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in filteredData"
            :key="idx"
            class="border-b border-rosegold/5 hover:bg-rosegold/[0.02] transition-colors"
          >
            <td v-for="col in columns" :key="col.key" class="px-4 py-3 text-sm text-gray-700">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
          <tr v-if="filteredData.length === 0">
            <td :colspan="columns.length" class="px-4 py-12 text-center text-sm text-grayrose/50">
              暂无数据
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
