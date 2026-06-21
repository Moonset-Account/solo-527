import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useComplianceStore = defineStore('compliance', () => {
  const filters = ref({
    dangerLevels: [] as string[],
    controlledCategory: '',
    complianceStatus: '',
  })

  const dangerLevelOptions = ['剧毒', '高毒', '中等毒', '低毒', '无毒']
  const controlledCategoryOptions = ['易制毒', '易制爆', '剧毒化学品', '放射性', '无']
  const complianceStatusOptions = ['合规', '待审查', '不合规']

  const reagentList = ref([
    { id: 1, name: '浓硫酸', cas: '7664-93-9', dangerLevel: '高毒', controlled: '易制爆', status: '合规', location: 'A区-01', expiry: '2027-06-15', certNo: 'HYC-2024-001', lastAudit: '2026-05-10' },
    { id: 2, name: '丙酮', cas: '67-64-1', dangerLevel: '低毒', controlled: '易制毒', status: '合规', location: 'B区-03', expiry: '2027-04-20', certNo: 'HYC-2024-002', lastAudit: '2026-04-15' },
    { id: 3, name: '氰化钾', cas: '151-50-8', dangerLevel: '剧毒', controlled: '剧毒化学品', status: '待审查', location: 'C区-01', expiry: '2027-01-10', certNo: 'HYC-2024-003', lastAudit: '2026-02-20' },
    { id: 4, name: '盐酸', cas: '7647-01-0', dangerLevel: '中等毒', controlled: '易制毒', status: '合规', location: 'A区-02', expiry: '2027-03-30', certNo: 'HYC-2024-004', lastAudit: '2026-03-18' },
    { id: 5, name: '硝酸', cas: '7697-37-2', dangerLevel: '高毒', controlled: '易制爆', status: '不合规', location: 'A区-03', expiry: '2026-07-15', certNo: 'HYC-2024-005', lastAudit: '2025-12-10' },
    { id: 6, name: '甲苯', cas: '108-88-3', dangerLevel: '中等毒', controlled: '易制毒', status: '合规', location: 'B区-02', expiry: '2027-08-22', certNo: 'HYC-2024-006', lastAudit: '2026-05-05' },
  ])

  const filteredReagents = computed(() => {
    return reagentList.value.filter(r => {
      if (filters.value.dangerLevels.length && !filters.value.dangerLevels.includes(r.dangerLevel)) return false
      if (filters.value.controlledCategory && r.controlled !== filters.value.controlledCategory) return false
      if (filters.value.complianceStatus && r.status !== filters.value.complianceStatus) return false
      return true
    })
  })

  const selectedFilters = computed(() => {
    const tags: { key: string; label: string; value: string }[] = []
    filters.value.dangerLevels.forEach(l => tags.push({ key: 'danger', label: '危险等级', value: l }))
    if (filters.value.controlledCategory) tags.push({ key: 'controlled', label: '管制类别', value: filters.value.controlledCategory })
    if (filters.value.complianceStatus) tags.push({ key: 'status', label: '合规状态', value: filters.value.complianceStatus })
    return tags
  })

  function removeFilter(key: string, value: string) {
    if (key === 'danger') {
      filters.value.dangerLevels = filters.value.dangerLevels.filter(l => l !== value)
    } else if (key === 'controlled') {
      filters.value.controlledCategory = ''
    } else if (key === 'status') {
      filters.value.complianceStatus = ''
    }
  }

  const auditLog = ref([
    { id: 1, action: '入库审核', operator: '张三', target: '浓硫酸', time: '2026-06-20 14:30', type: 'info' },
    { id: 2, action: '合规检查', operator: '李四', target: '氰化钾', time: '2026-06-19 10:15', type: 'warn' },
    { id: 3, action: '不合规标记', operator: '王五', target: '硝酸', time: '2026-06-18 16:45', type: 'danger' },
    { id: 4, action: '证照更新', operator: '赵六', target: '丙酮', time: '2026-06-17 09:00', type: 'success' },
    { id: 5, action: '安全审查', operator: '张三', target: '甲苯', time: '2026-06-16 11:30', type: 'info' },
  ])

  const drilldownPath = ref([{ label: '全部试剂', id: 'root' }])

  return { filters, dangerLevelOptions, controlledCategoryOptions, complianceStatusOptions, reagentList, filteredReagents, selectedFilters, removeFilter, auditLog, drilldownPath }
})
