import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFinanceStore = defineStore('finance', () => {
  const projectBalances = ref([
    { id: 1, name: '新型催化剂合成研究', budget: 150000, spent: 89500, color: '#0D9488' },
    { id: 2, name: '环境水质检测项目', budget: 80000, spent: 62000, color: '#2DD4BF' },
    { id: 3, name: '药物中间体开发', budget: 200000, spent: 178000, color: '#DC2626' },
    { id: 4, name: '纳米材料表征分析', budget: 120000, spent: 45000, color: '#0D9488' },
  ])

  const expenseTrend = ref([
    { month: '1月', amount: 42000 },
    { month: '2月', amount: 38000 },
    { month: '3月', amount: 55000 },
    { month: '4月', amount: 48000 },
    { month: '5月', amount: 62000 },
    { month: '6月', amount: 51000 },
  ])

  const categorySpending = ref([
    { name: '有机溶剂', value: 125000 },
    { name: '无机盐', value: 45000 },
    { name: '酸碱类', value: 68000 },
    { name: '标准品', value: 32000 },
    { name: '生物试剂', value: 85000 },
    { name: '其他', value: 27000 },
  ])

  const showAllocationModal = ref(false)
  const allocationForm = ref({
    projectId: null as number | null,
    amount: 0,
    reason: '',
  })

  return { projectBalances, expenseTrend, categorySpending, showAllocationModal, allocationForm }
})
