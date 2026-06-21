<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-vue-next'

export interface Column {
  key: string
  label: string
  sortable?: boolean
  width?: string
}

const props = withDefaults(defineProps<{
  columns: Column[]
  data: Record<string, any>[]
  rowKey?: string
  selectable?: boolean
  selectedKeys?: (string | number)[]
}>(), {
  rowKey: 'id',
  selectable: false,
})

const emit = defineEmits<{
  'update:selectedKeys': [keys: (string | number)[]]
  'row-click': [row: Record<string, any>]
}>()

const sortKey = ref('')
const sortDir = ref<'asc' | 'desc'>('asc')
const currentPage = ref(1)
const pageSize = ref(10)

const sortedData = computed(() => {
  if (!sortKey.value) return props.data
  return [...props.data].sort((a, b) => {
    const va = a[sortKey.value]
    const vb = b[sortKey.value]
    const cmp = va > vb ? 1 : va < vb ? -1 : 0
    return sortDir.value === 'asc' ? cmp : -cmp
  })
})

const totalPages = computed(() => Math.ceil(sortedData.value.length / pageSize.value) || 1)

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedData.value.slice(start, start + pageSize.value)
})

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

function toggleSelect(key: string | number) {
  const keys = [...(props.selectedKeys || [])]
  const idx = keys.indexOf(key)
  if (idx >= 0) keys.splice(idx, 1)
  else keys.push(key)
  emit('update:selectedKeys', keys)
}

function isAllSelected() {
  if (!pagedData.value.length) return false
  return pagedData.value.every(r => (props.selectedKeys || []).includes(r[props.rowKey]))
}

function toggleAll() {
  if (isAllSelected()) {
    const selected = new Set((props.selectedKeys || []).map(String))
    pagedData.value.forEach(r => selected.delete(String(r[props.rowKey])))
    emit('update:selectedKeys', [...selected])
  } else {
    const keys = [...(props.selectedKeys || [])]
    pagedData.value.forEach(r => {
      if (!keys.includes(r[props.rowKey])) keys.push(r[props.rowKey])
    })
    emit('update:selectedKeys', keys)
  }
}
</script>

<template>
  <div class="data-table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th v-if="selectable" class="th-check">
            <input type="checkbox" :checked="isAllSelected()" @change="toggleAll" />
          </th>
          <th
            v-for="col in columns"
            :key="col.key"
            :style="col.width ? { width: col.width } : {}"
            :class="{ sortable: col.sortable }"
            @click="col.sortable && toggleSort(col.key)"
          >
            <span class="th-content">
              {{ col.label }}
              <span v-if="col.sortable && sortKey === col.key" class="sort-icon">
                <ChevronUp v-if="sortDir === 'asc'" :size="14" />
                <ChevronDown v-else :size="14" />
              </span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in pagedData" :key="row[rowKey]" @click="emit('row-click', row)">
          <td v-if="selectable" class="td-check">
            <input
              type="checkbox"
              :checked="(selectedKeys || []).includes(row[rowKey])"
              @change.stop="toggleSelect(row[rowKey])"
            />
          </td>
          <td v-for="col in columns" :key="col.key">
            <slot :name="col.key" :row="row">{{ row[col.key] }}</slot>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="table-pagination">
      <span class="page-info">共 {{ data.length }} 条</span>
      <div class="page-controls">
        <button class="page-btn" :disabled="currentPage <= 1" @click="currentPage--">
          <ChevronLeft :size="16" />
        </button>
        <span class="page-num font-data">{{ currentPage }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="currentPage >= totalPages" @click="currentPage++">
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.data-table th {
  text-align: left;
  padding: 12px 16px;
  color: var(--color-text-muted);
  font-weight: 500;
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
.data-table th.sortable {
  cursor: pointer;
  user-select: none;
}
.data-table th.sortable:hover {
  color: var(--color-text-primary);
}
.th-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.sort-icon {
  color: var(--color-accent);
}
.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(51, 78, 104, 0.3);
  color: var(--color-text-secondary);
}
.data-table tr:hover td {
  background: rgba(13, 148, 136, 0.05);
}
.th-check, .td-check {
  width: 40px;
  text-align: center;
}
.table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
}
.page-info {
  font-size: 13px;
  color: var(--color-text-muted);
}
.page-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.page-btn {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  color: var(--color-text-secondary);
  padding: 4px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.page-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
}
.page-num {
  font-size: 13px;
  color: var(--color-text-secondary);
}
</style>
