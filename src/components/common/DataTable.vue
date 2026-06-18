<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-vue-next'

interface Column {
  key: string
  label: string
  sortable?: boolean
  width?: string
}

const props = defineProps<{
  columns: Column[]
  data: Record<string, unknown>[]
  total?: number
  page?: number
  pageSize?: number
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'page-change', page: number): void
  (e: 'sort', key: string, order: 'asc' | 'desc'): void
}>()

const totalPages = computed(() => Math.ceil((props.total || 0) / (props.pageSize || 20)) || 1)

function handleSort(key: string) {
  emit('sort', key, 'asc')
}
</script>

<template>
  <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200">
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              :style="col.width ? { width: col.width } : {}"
            >
              <button
                v-if="col.sortable"
                class="flex items-center gap-1 hover:text-slate-700"
                @click="handleSort(col.key)"
              >
                {{ col.label }}
                <ArrowUpDown class="w-3 h-3" />
              </button>
              <span v-else>{{ col.label }}</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading" class="animate-pulse">
            <td :colspan="columns.length" class="px-4 py-8 text-center text-slate-400">
              加载中...
            </td>
          </tr>
          <tr v-else-if="!data.length">
            <td :colspan="columns.length" class="px-4 py-8 text-center text-slate-400">
              暂无数据
            </td>
          </tr>
          <tr
            v-else
            v-for="(row, idx) in data"
            :key="idx"
            class="hover:bg-slate-50 transition-colors"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 text-sm text-slate-700"
            >
              <slot :name="col.key" :row="row" :value="row[col.key]">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="total !== undefined && page !== undefined"
      class="flex items-center justify-between px-4 py-3 border-t border-slate-200"
    >
      <span class="text-sm text-slate-500">
        共 {{ total }} 条记录
      </span>
      <div class="flex items-center gap-1">
        <button
          class="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
          :disabled="page <= 1"
          @click="emit('page-change', 1)"
        >
          <ChevronsLeft class="w-4 h-4" />
        </button>
        <button
          class="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
          :disabled="page <= 1"
          @click="emit('page-change', page - 1)"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>
        <span class="px-3 text-sm text-slate-700">{{ page }} / {{ totalPages }}</span>
        <button
          class="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
          :disabled="page >= totalPages"
          @click="emit('page-change', page + 1)"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
        <button
          class="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
          :disabled="page >= totalPages"
          @click="emit('page-change', totalPages)"
        >
          <ChevronsRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
