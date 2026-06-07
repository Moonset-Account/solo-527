<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useDataStore } from '@/stores/data'
import { useFilterStore } from '@/stores/filter'
import FilterBar from '@/components/FilterBar.vue'
import BudgetProgress from '@/components/BudgetProgress.vue'
import CategoryChart from '@/components/CategoryChart.vue'
import CashFlowChart from '@/components/CashFlowChart.vue'
import SubscriptionPanel from '@/components/SubscriptionPanel.vue'
import AbnormalPanel from '@/components/AbnormalPanel.vue'
import DataStatusBar from '@/components/DataStatusBar.vue'
import ExportButton from '@/components/ExportButton.vue'
import { RouterLink } from 'vue-router'
import { Settings } from 'lucide-vue-next'

const dataStore = useDataStore()
const filterStore = useFilterStore()

onMounted(() => {
  dataStore.refreshAll()
})

watch(
  () => filterStore.filterState,
  () => {
    dataStore.refreshAll()
  },
  { deep: true }
)
</script>

<template>
  <div class="min-h-screen bg-base-900 flex flex-col pb-12">
    <header class="sticky top-0 z-50 bg-base-900/95 backdrop-blur border-b border-surface-border">
      <div class="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <div class="w-4 h-4 rounded bg-accent"></div>
          </div>
          <h1 class="font-display text-xl text-white tracking-wide">家庭预算分析工作台</h1>
        </div>
        <div class="flex items-center gap-4">
          <ExportButton />
          <RouterLink
            to="/rules"
            class="btn-ghost text-sm flex items-center gap-1.5"
          >
            <Settings :size="14" />
            分类规则
          </RouterLink>
        </div>
      </div>
    </header>

    <FilterBar />

    <main class="flex-1 max-w-[1600px] mx-auto w-full px-6 py-5 space-y-5">
      <div v-if="dataStore.isLoading" class="flex items-center justify-center py-20">
        <div class="flex items-center gap-3 text-accent">
          <div class="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin"></div>
          <span class="text-sm">数据加载中...</span>
        </div>
      </div>

      <template v-else>
        <div class="grid grid-cols-4 gap-4">
          <div class="card flex flex-col items-center justify-center py-4">
            <span class="text-xs text-base-500 mb-1">总收入</span>
            <span class="font-display text-2xl text-accent">
              ¥{{ dataStore.totalIncome.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}
            </span>
          </div>
          <div class="card flex flex-col items-center justify-center py-4">
            <span class="text-xs text-base-500 mb-1">总支出</span>
            <span class="font-display text-2xl text-warn">
              ¥{{ dataStore.totalExpense.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}
            </span>
          </div>
          <div class="card flex flex-col items-center justify-center py-4">
            <span class="text-xs text-base-500 mb-1">净现金流</span>
            <span
              class="font-display text-2xl"
              :class="dataStore.totalIncome - dataStore.totalExpense >= 0 ? 'text-info' : 'text-danger'"
            >
              ¥{{ (dataStore.totalIncome - dataStore.totalExpense).toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}
            </span>
          </div>
          <div class="card flex flex-col items-center justify-center py-4">
            <span class="text-xs text-base-500 mb-1">有效样本</span>
            <span class="font-display text-2xl text-white">
              {{ dataStore.sampleSize }}
              <span class="text-sm text-base-500">条</span>
            </span>
          </div>
        </div>

        <BudgetProgress />

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div class="lg:col-span-2">
            <CategoryChart />
          </div>
          <div class="lg:col-span-3">
            <CashFlowChart />
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SubscriptionPanel />
          <AbnormalPanel />
        </div>
      </template>
    </main>

    <DataStatusBar />
  </div>
</template>
