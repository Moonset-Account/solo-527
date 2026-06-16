<script setup lang="ts">
import { NButton, NDropdown } from 'naive-ui'
import type { DropdownOption } from 'naive-ui'

const props = defineProps<{
  module: string
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
    const blob = await api.export({ module: props.module, format: format as 'xlsx' | 'csv', filters: props.filters ?? {} })
    const url = window.URL.createObjectURL(blob as unknown as Blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${props.module}_${new Date().toISOString().slice(0, 10)}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
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
