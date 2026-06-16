<script setup lang="ts">
import { NButton, NDropdown } from 'naive-ui'
import type { DropdownOption } from 'naive-ui'
import type { ExportModule, ExportFormat } from '~/types'

const props = defineProps<{
  module: ExportModule
  filters?: Record<string, any>
}>()

const exporting = ref(false)

const formatOptions: DropdownOption[] = [
  { label: '导出 Excel (.xlsx)', key: 'xlsx' },
  { label: '导出 CSV (.csv)', key: 'csv' },
]

async function handleExport(format: string) {
  exporting.value = true
  try {
    const api = useApi()
    await api.exportFile({
      module: props.module,
      format: format as ExportFormat,
      filters: props.filters ?? {},
    })
  } catch (e) {
    console.error('Export failed', e)
  } finally {
    exporting.value = false
  }
}

function handleDropdownSelect(key: string) {
  handleExport(key)
}
</script>

<template>
  <NDropdown :options="formatOptions" @select="handleDropdownSelect">
    <NButton :loading="exporting" secondary>
      导出
    </NButton>
  </NDropdown>
</template>
