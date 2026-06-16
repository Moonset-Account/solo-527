<template>
  <div class="flex flex-wrap items-center gap-3">
    <div v-for="filter in filters" :key="filter.key" class="flex items-center gap-2">
      <label class="text-sm font-medium text-gray-600 whitespace-nowrap">{{ filter.label }}</label>
      <select
        v-if="filter.type === 'select'"
        class="select !w-auto min-w-[140px]"
        :value="modelValue[filter.key]"
        @change="emit('update:filter', { key: filter.key, value: ($event.target as HTMLSelectElement).value })"
      >
        <option value="">全部</option>
        <option v-for="opt in filter.options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <input
        v-else-if="filter.type === 'date'"
        type="date"
        class="input !w-auto"
        :value="modelValue[filter.key]"
        @input="emit('update:filter', { key: filter.key, value: ($event.target as HTMLInputElement).value })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface FilterOption {
  value: string
  label: string
}

interface Filter {
  key: string
  label: string
  type: 'select' | 'date'
  options?: FilterOption[]
}

defineProps<{
  filters: Filter[]
  modelValue: Record<string, string>
}>()

const emit = defineEmits<{
  'update:filter': [payload: { key: string; value: string }]
}>()
</script>
