<template>
  <div class="export-panel">
    <div class="export-label">导出报告</div>
    <div class="export-buttons">
      <button class="btn-export btn-csv" @click="handleExportCSV">
        <span class="btn-icon">📊</span>
        <span>CSV 数据</span>
      </button>
      <button class="btn-export btn-pdf" @click="handleExportPDF">
        <span class="btn-icon">📄</span>
        <span>PDF 报告</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDataStore } from '@/stores/dataStore.js'
import { exportFaultsCSV } from '@/utils/exportCSV.js'
import { exportDashboardReport } from '@/utils/exportPDF.js'

const store = useDataStore()

const summaryData = computed(() => ({
  '可用率': (store.availabilityStats.rate * 100).toFixed(1) + '%',
  '故障总数': store.filteredFaults.length,
  '平均修复时长': store.avgRepairStats.avg + 'h',
  '重复报修率': (store.duplicateStats.rate * 100).toFixed(1) + '%'
}))

function handleExportCSV() {
  exportFaultsCSV(
    store.filteredFaults,
    store.filteredRepairs,
    store.stations,
    store.activeFiltersDesc
  )
}

async function handleExportPDF() {
  await exportDashboardReport(
    '充电桩故障分析报告',
    summaryData.value,
    'dashboard-content'
  )
}
</script>

<style lang="scss" scoped>
.export-panel {
  display: flex;
  align-items: center;
  gap: 12px;
}

.export-label {
  font-size: 13px;
  color: $text-secondary;
}

.export-buttons {
  display: flex;
  gap: 8px;
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: $radius-md;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid $border-color;
  background: $bg-card;
  color: $text-primary;
  transition: all $transition-fast;
  
  &:hover {
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &.btn-csv {
    &:hover {
      border-color: $success;
      color: $success;
      background: rgba(82, 196, 26, 0.1);
    }
  }
  
  &.btn-pdf {
    &:hover {
      border-color: $danger;
      color: $danger;
      background: rgba(255, 77, 79, 0.1);
    }
  }
}

.btn-icon {
  font-size: 14px;
}
</style>
