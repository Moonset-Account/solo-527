<template>
  <div class="export-panel">
    <button class="btn btn-secondary export-toggle" @click="showMenu = !showMenu">
      导出 ▾
    </button>
    <div v-if="showMenu" class="export-menu">
      <button class="export-item" @click="handleExport('csv')" :disabled="exporting">
        📄 导出 CSV
      </button>
      <button class="export-item" @click="handleExport('pdf')" :disabled="exporting">
        📋 导出 PDF
      </button>
      <button class="export-item" @click="handleExport('screenshot')" :disabled="exporting">
        🖼 导出截图
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useExport } from '../composables/useExport'

const props = defineProps({
  data: { type: Array, default: () => [] },
  elementId: { type: String, default: '' },
  filename: { type: String, default: 'cold-chain-export' }
})

const { exporting, exportCSV, exportPDF, exportScreenshot } = useExport()
const showMenu = ref(false)

async function handleExport(type) {
  showMenu.value = false
  if (type === 'csv' && props.data.length) {
    await exportCSV(props.data, props.filename)
  } else if (type === 'pdf' && props.elementId) {
    await exportPDF(props.elementId, props.filename)
  } else if (type === 'screenshot' && props.elementId) {
    await exportScreenshot(props.elementId, props.filename)
  }
}
</script>
