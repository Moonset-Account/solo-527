import { ref } from 'vue'
import { adminApi } from '@/api'

export interface DictOption {
  label: string
  value: string
}

const defaultDepartments: DictOption[] = [
  { label: '技术部', value: 'tech' },
  { label: '产品部', value: 'product' },
  { label: '设计部', value: 'design' },
  { label: '市场部', value: 'marketing' },
]

const defaultPriorities: DictOption[] = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' },
]

const defaultTypes: DictOption[] = [
  { label: '新功能', value: 'feature' },
  { label: 'Bug修复', value: 'bugfix' },
  { label: '优化', value: 'optimization' },
  { label: '重构', value: 'refactor' },
]

export function useDictionaries() {
  const departments = ref<DictOption[]>([...defaultDepartments])
  const priorities = ref<DictOption[]>([...defaultPriorities])
  const requirementTypes = ref<DictOption[]>([...defaultTypes])
  const isLoading = ref(false)

  async function fetchAll() {
    isLoading.value = true
    try {
      const [deptRes, prioRes, typeRes] = await Promise.all([
        adminApi.dictionaries.list('department'),
        adminApi.dictionaries.list('priority'),
        adminApi.dictionaries.list('requirement_type'),
      ])
      const deptDicts = deptRes.data
      const prioDicts = prioRes.data
      const typeDicts = typeRes.data
      if (deptDicts.length > 0) {
        departments.value = deptDicts.map((d: any) => ({ label: d.label, value: d.value }))
      }
      if (prioDicts.length > 0) {
        priorities.value = prioDicts.map((d: any) => ({ label: d.label, value: d.value }))
      }
      if (typeDicts.length > 0) {
        requirementTypes.value = typeDicts.map((d: any) => ({ label: d.label, value: d.value }))
      }
    } finally {
      isLoading.value = false
    }
  }

  return { departments, priorities, requirementTypes, isLoading, fetchAll }
}
