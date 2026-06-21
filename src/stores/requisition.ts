import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRequisitionStore = defineStore('requisition', () => {
  const activeTab = ref<'form' | 'records'>('form')

  const projects = ref([
    { id: 1, name: '新型催化剂合成研究' },
    { id: 2, name: '环境水质检测项目' },
    { id: 3, name: '药物中间体开发' },
    { id: 4, name: '纳米材料表征分析' },
  ])

  const reagentSearch = ref('')
  const searchResults = ref([
    { id: 1, name: '浓硫酸', spec: 'AR 500mL', stock: 12 },
    { id: 2, name: '丙酮', spec: 'AR 500mL', stock: 28 },
    { id: 3, name: '无水乙醇', spec: 'AR 500mL', stock: 45 },
    { id: 4, name: '盐酸', spec: 'AR 500mL', stock: 18 },
  ])

  const formData = ref({
    reagentId: null as number | null,
    reagentName: '',
    quantity: 1,
    projectId: null as number | null,
    purpose: '',
  })

  const pendingItems = ref([
    { id: 1, applicant: '张三', reagent: '浓硫酸', quantity: 2, project: '新型催化剂合成研究', date: '2026-06-18', status: 'pending' },
    { id: 2, applicant: '李四', reagent: '丙酮', quantity: 3, project: '环境水质检测项目', date: '2026-06-19', status: 'pending' },
    { id: 3, applicant: '王五', reagent: '氰化钾', quantity: 1, project: '药物中间体开发', date: '2026-06-20', status: 'pending' },
  ])

  const approvalSteps = ref([
    { step: 1, label: '提交申请', status: 'done' },
    { step: 2, label: '课题负责人审批', status: 'active' },
    { step: 3, label: '安全主管审批', status: 'waiting' },
    { step: 4, label: '仓库确认出库', status: 'waiting' },
  ])

  const records = ref([
    { id: 1, applicant: '张三', reagent: '盐酸', quantity: 2, project: '新型催化剂合成研究', date: '2026-06-10', status: 'approved' },
    { id: 2, applicant: '李四', reagent: '无水乙醇', quantity: 5, project: '环境水质检测项目', date: '2026-06-11', status: 'approved' },
    { id: 3, applicant: '王五', reagent: '氢氧化钠', quantity: 1, project: '药物中间体开发', date: '2026-06-12', status: 'rejected' },
    { id: 4, applicant: '赵六', reagent: '丙酮', quantity: 3, project: '纳米材料表征分析', date: '2026-06-13', status: 'approved' },
    { id: 5, applicant: '钱七', reagent: '甲醇', quantity: 2, project: '新型催化剂合成研究', date: '2026-06-14', status: 'approved' },
    { id: 6, applicant: '孙八', reagent: '乙酸乙酯', quantity: 4, project: '药物中间体开发', date: '2026-06-15', status: 'approved' },
  ])

  function approveItem(id: number) {
    const item = pendingItems.value.find(i => i.id === id)
    if (item) item.status = 'approved'
  }

  function rejectItem(id: number) {
    const item = pendingItems.value.find(i => i.id === id)
    if (item) item.status = 'rejected'
  }

  return { activeTab, projects, reagentSearch, searchResults, formData, pendingItems, approvalSteps, records, approveItem, rejectItem }
})
