import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useInventoryStore = defineStore('inventory', () => {
  const stats = ref({
    totalReagents: 1247,
    totalValue: 856320,
    warningCount: 38,
    monthlyOut: 156,
    totalTrend: 5.2,
    valueTrend: -2.1,
    warningTrend: 12.5,
    outTrend: 8.3,
  })

  const categoryData = ref([
    { name: '有机溶剂', value: 328 },
    { name: '无机盐', value: 215 },
    { name: '酸碱类', value: 187 },
    { name: '指示剂', value: 142 },
    { name: '标准品', value: 98 },
    { name: '生物试剂', value: 176 },
    { name: '其他', value: 101 },
  ])

  const dangerLevelData = ref([
    { name: '剧毒', value: 23, color: '#DC2626' },
    { name: '高毒', value: 45, color: '#F97316' },
    { name: '中等毒', value: 89, color: '#D97706' },
    { name: '低毒', value: 312, color: '#0D9488' },
    { name: '无毒', value: 778, color: '#334E68' },
  ])

  const monthlyTrend = ref([
    { month: '1月', inbound: 120, outbound: 98 },
    { month: '2月', inbound: 98, outbound: 87 },
    { month: '3月', inbound: 145, outbound: 112 },
    { month: '4月', inbound: 132, outbound: 125 },
    { month: '5月', inbound: 156, outbound: 134 },
    { month: '6月', inbound: 142, outbound: 156 },
  ])

  const warningList = ref([
    { id: 1, name: '浓硫酸', level: '高毒', stock: 2, minStock: 10, location: 'A区-01', expiry: '2026-08-15' },
    { id: 2, name: '丙酮', level: '低毒', stock: 5, minStock: 20, location: 'B区-03', expiry: '2026-07-20' },
    { id: 3, name: '氰化钾', level: '剧毒', stock: 1, minStock: 5, location: 'C区-01', expiry: '2027-01-10' },
    { id: 4, name: '盐酸', level: '中等毒', stock: 8, minStock: 15, location: 'A区-02', expiry: '2026-09-30' },
    { id: 5, name: '无水乙醇', level: '低毒', stock: 3, minStock: 25, location: 'B区-05', expiry: '2026-12-15' },
    { id: 6, name: '甲醛溶液', level: '中等毒', stock: 4, minStock: 12, location: 'A区-04', expiry: '2026-06-30' },
    { id: 7, name: '重铬酸钾', level: '高毒', stock: 6, minStock: 8, location: 'C区-03', expiry: '2027-03-20' },
    { id: 8, name: '三氯甲烷', level: '中等毒', stock: 2, minStock: 10, location: 'B区-01', expiry: '2026-11-05' },
  ])

  const levelTag = computed(() => {
    const map: Record<string, string> = {
      '剧毒': 'tag-danger',
      '高毒': 'tag-warn',
      '中等毒': 'tag-warn',
      '低毒': 'tag-info',
      '无毒': 'tag-success',
    }
    return map
  })

  return { stats, categoryData, dangerLevelData, monthlyTrend, warningList, levelTag }
})
