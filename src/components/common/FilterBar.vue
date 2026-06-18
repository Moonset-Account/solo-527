<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'

interface FilterOption {
  label: string
  value: string | number
}

interface FilterField {
  key: string
  label: string
  type: 'select' | 'dateRange'
  options?: FilterOption[]
}

const props = defineProps<{
  fields: FilterField[]
  modelValue: Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, unknown>): void
  (e: 'search'): void
  (e: 'reset'): void
}>()

function updateField(key: string, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function reset() {
  const cleared: Record<string, unknown> = {}
  props.fields.forEach((f) => {
    cleared[f.key] = f.type === 'dateRange' ? [] : ''
  })
  emit('update:modelValue', cleared)
  emit('reset')
}
</script>

<template>
  <div class="bg-white rounded-lg border border-slate-200 p-4 mb-4">
    <div class="flex flex-wrap items-end gap-4">
      <template v-for="field in fields" :key="field.key">
        <div v-if="field.type === 'select'" class="flex flex-col gap-1">
          <label class="text-xs text-slate-500">{{ field.label }}</label>
          <select
            class="h-9 px-3 rounded-md border border-slate-300 text-sm text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            :value="modelValue[field.key] || ''"
            @change="updateField(field.key, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">全部</option>
            <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div v-else-if="field.type === 'dateRange'" class="flex flex-col gap-1">
          <label class="text-xs text-slate-500">{{ field.label }}</label>
          <div class="flex items-center gap-2">
            <input
              type="date"
              class="h-9 px-3 rounded-md border border-slate-300 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              :value="(modelValue[field.key] as string[])?.[0] || ''"
              @input="updateField(field.key, [($event.target as HTMLInputElement).value, (modelValue[field.key] as string[])?.[1] || ''])"
            />
            <span class="text-slate-400 text-sm">至</span>
            <input
              type="date"
              class="h-9 px-3 rounded-md border border-slate-300 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
              :value="(modelValue[field.key] as string[])?.[1] || ''"
              @input="updateField(field.key, [(modelValue[field.key] as string[])?.[0] || '', ($event.target as HTMLInputElement).value])"
            />
          </div>
        </div>
      </template>

      <div class="flex items-center gap-2">
        <button
          class="h-9 px-4 bg-amber-500 text-white text-sm rounded-md hover:bg-amber-600 transition-colors flex items-center gap-1"
          @click="emit('search')"
        >
          <Search class="w-4 h-4" />
          查询
        </button>
        <button
          class="h-9 px-4 bg-white text-slate-600 text-sm rounded-md border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-1"
          @click="reset"
        >
          <X class="w-4 h-4" />
          重置
        </button>
      </div>
    </div>
  </div>
</template>
