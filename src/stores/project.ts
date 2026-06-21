import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProjectStore = defineStore('project', () => {
  const selectedProject = ref(1)

  const projects = ref([
    { id: 1, name: '新型催化剂合成研究', budget: 150000, spent: 89500 },
    { id: 2, name: '环境水质检测项目', budget: 80000, spent: 62000 },
    { id: 3, name: '药物中间体开发', budget: 200000, spent: 178000 },
    { id: 4, name: '纳米材料表征分析', budget: 120000, spent: 45000 },
  ])

  const consumptionData = ref([
    { name: '浓硫酸', value: 12500 },
    { name: '丙酮', value: 9800 },
    { name: '无水乙醇', value: 15200 },
    { name: '盐酸', value: 6300 },
    { name: '氢氧化钠', value: 4100 },
    { name: '甲醇', value: 8700 },
    { name: '乙酸乙酯', value: 5600 },
    { name: '其他', value: 27300 },
  ])

  const budgetComparison = ref([
    { name: '1月', budget: 12500, spent: 11200 },
    { name: '2月', budget: 12500, spent: 9800 },
    { name: '3月', budget: 12500, spent: 14500 },
    { name: '4月', budget: 12500, spent: 13200 },
    { name: '5月', budget: 12500, spent: 15800 },
    { name: '6月', budget: 12500, spent: 25000 },
  ])

  const monthlySpending = ref([
    { month: '1月', amount: 11200 },
    { month: '2月', amount: 9800 },
    { month: '3月', amount: 14500 },
    { month: '4月', amount: 13200 },
    { month: '5月', amount: 15800 },
    { month: '6月', amount: 25000 },
  ])

  return { selectedProject, projects, consumptionData, budgetComparison, monthlySpending }
})
