import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Transaction, BudgetItem, Subscription, CashFlowPoint, CategoryBreakdownItem, DataMeta } from '@/types'
import {
  fetchFilteredTransactions,
  fetchBudgetProgress,
  fetchCategoryBreakdown,
  fetchCashFlow,
  fetchAbnormalSamples,
  fetchSubscriptions,
  fetchDataMeta,
} from '@/data/api'
import { useFilterStore } from './filter'

export const useDataStore = defineStore('data', () => {
  const transactions = ref<Transaction[]>([])
  const budgetProgress = ref<BudgetItem[]>([])
  const categoryBreakdown = ref<CategoryBreakdownItem[]>([])
  const cashFlow = ref<CashFlowPoint[]>([])
  const abnormalSamples = ref<Transaction[]>([])
  const subscriptions = ref<Subscription[]>([])
  const dataMeta = ref<DataMeta | null>(null)
  const isLoading = ref(false)

  const sampleSize = computed(() => transactions.value.length)
  const totalExpense = computed(() =>
    transactions.value
      .filter(t => t.type !== 'income')
      .reduce((s, t) => s + t.amount, 0)
  )
  const totalIncome = computed(() =>
    transactions.value
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0)
  )

  async function refreshAll() {
    isLoading.value = true
    try {
      const filterStore = useFilterStore()
      const filter = filterStore.filterState

      const [txResult, budget, category, cf, abn, subs] = await Promise.all([
        fetchFilteredTransactions(filter),
        fetchBudgetProgress(filter),
        fetchCategoryBreakdown(filter),
        fetchCashFlow(filter),
        fetchAbnormalSamples(filter),
        fetchSubscriptions(),
      ])

      transactions.value = txResult.data
      budgetProgress.value = budget
      categoryBreakdown.value = category
      cashFlow.value = cf
      abnormalSamples.value = abn
      subscriptions.value = subs
      dataMeta.value = fetchDataMeta(txResult.meta.updatedAt, filter, txResult.meta.sampleSize)
    } catch (e) {
      console.error('refreshAll failed:', e)
    } finally {
      isLoading.value = false
    }
  }

  async function toggleSubscription(id: string) {
    const { toggleSubscriptionHandled } = await import('@/data/api')
    await toggleSubscriptionHandled(id)
    const sub = subscriptions.value.find(s => s.id === id)
    if (sub) sub.isHandled = !sub.isHandled
  }

  return {
    transactions,
    budgetProgress,
    categoryBreakdown,
    cashFlow,
    abnormalSamples,
    subscriptions,
    dataMeta,
    isLoading,
    sampleSize,
    totalExpense,
    totalIncome,
    refreshAll,
    toggleSubscription,
  }
})
