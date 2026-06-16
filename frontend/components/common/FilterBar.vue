<script setup lang="ts">
import { NDatePicker, NSelect, NButton, NSpace } from 'naive-ui'
import type { SelectOption } from 'naive-ui'

const props = defineProps<{
  responsibleOptions?: SelectOption[]
  statusOptions?: SelectOption[]
  showDateRange?: boolean
  showResponsible?: boolean
  showStatus?: boolean
}>()

const emit = defineEmits<{
  filter: [filters: { dateRange: [number, number] | null; responsible: string | null; status: string | null }]
  reset: []
}>()

const dateRange = ref<[number, number] | null>(null)
const responsible = ref<string | null>(null)
const status = ref<string | null>(null)

function handleFilter() {
  emit('filter', {
    dateRange: dateRange.value,
    responsible: responsible.value,
    status: status.value,
  })
}

function handleReset() {
  dateRange.value = null
  responsible.value = null
  status.value = null
  emit('reset')
}
</script>

<template>
  <NSpace align="center" :wrap="false" style="margin-bottom: 16px">
    <NDatePicker
      v-if="showDateRange !== false"
      v-model:value="dateRange"
      type="daterange"
      clearable
      placeholder="选择日期范围"
      style="width: 280px"
    />
    <NSelect
      v-if="showResponsible !== false"
      v-model:value="responsible"
      :options="responsibleOptions ?? []"
      clearable
      placeholder="负责人"
      style="width: 160px"
    />
    <NSelect
      v-if="showStatus !== false"
      v-model:value="status"
      :options="statusOptions ?? []"
      clearable
      placeholder="状态"
      style="width: 140px"
    />
    <slot />
    <NButton type="primary" @click="handleFilter">查询</NButton>
    <NButton @click="handleReset">重置</NButton>
  </NSpace>
</template>
