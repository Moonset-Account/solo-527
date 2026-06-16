<script setup lang="ts">
import { useAnalyticsStore } from '@/stores/analytics'
import DataTable from '@/components/common/DataTable.vue'

const analyticsStore = useAnalyticsStore()

const columns = [
  { key: 'consultantName', label: '顾问', sortable: true },
  { key: 'month', label: '月份', sortable: true },
  { key: 'totalAppointments', label: '服务次数', sortable: true },
  { key: 'totalRevenue', label: '营收总额', sortable: true },
  { key: 'commissionRate', label: '提成比例', sortable: true },
  { key: 'commissionAmount', label: '提成金额', sortable: true },
]
</script>

<template>
  <DataTable :columns="columns" :data="analyticsStore.commissions" searchable search-placeholder="搜索顾问...">
    <template #cell-consultantName="{ value }">
      <span class="font-medium text-gray-800">{{ value }}</span>
    </template>
    <template #cell-totalRevenue="{ value }">
      <span class="text-gray-800">¥{{ value.toLocaleString() }}</span>
    </template>
    <template #cell-commissionRate="{ value }">
      <span class="text-rosegold">{{ (value * 100).toFixed(0) }}%</span>
    </template>
    <template #cell-commissionAmount="{ value }">
      <span class="font-medium text-mint">¥{{ value.toLocaleString() }}</span>
    </template>
  </DataTable>
</template>
