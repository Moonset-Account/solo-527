import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface HistoryEntry {
  id: number
  action: string
  operator: string
  target: string
  detail: string
  time: string
  type: 'inbound' | 'outbound' | 'approve' | 'reject' | 'audit' | 'transfer'
  notes: { id: number; content: string; author: string; time: string }[]
}

export const useHistoryStore = defineStore('history', () => {
  const entries = ref<HistoryEntry[]>([
    { id: 1, action: '入库登记', operator: '张三', target: '浓硫酸 B202606001', detail: '入库20瓶，供应商：国药集团', time: '2026-06-20 14:30', type: 'inbound', notes: [] },
    { id: 2, action: '领用出库', operator: '李四', target: '丙酮 B202606002', detail: '领用3瓶，课题：环境水质检测项目', time: '2026-06-20 10:15', type: 'outbound', notes: [{ id: 1, content: '已确认领用，注意通风', author: '李四', time: '2026-06-20 10:20' }] },
    { id: 3, action: '审批通过', operator: '王五', target: '赵六-氢氧化钠申请', detail: '审批同意，数量1瓶', time: '2026-06-19 16:45', type: 'approve', notes: [] },
    { id: 4, action: '审批驳回', operator: '张三', target: '孙八-氰化钾申请', detail: '审批驳回，理由：安全审查未通过', time: '2026-06-19 11:30', type: 'reject', notes: [] },
    { id: 5, action: '安全审查', operator: '李四', target: '氰化钾库存', detail: '完成季度安全审查，结果：待整改', time: '2026-06-18 09:00', type: 'audit', notes: [{ id: 2, content: '需增加双人双锁管理', author: '李四', time: '2026-06-18 09:15' }] },
    { id: 6, action: '调拨转移', operator: '王五', target: '盐酸 B202606004', detail: '从A区-02调拨至实验室304', time: '2026-06-17 15:20', type: 'transfer', notes: [] },
    { id: 7, action: '入库登记', operator: '赵六', target: '无水乙醇 B202606005', detail: '入库40瓶，供应商：西陇科学', time: '2026-06-16 13:00', type: 'inbound', notes: [] },
    { id: 8, action: '领用出库', operator: '钱七', target: '甲醇 B202606008', detail: '领用2瓶，课题：新型催化剂合成研究', time: '2026-06-15 09:45', type: 'outbound', notes: [] },
  ])

  const searchQuery = ref('')
  const filterOperator = ref('')
  const filterActionType = ref('')
  const filterDateStart = ref('')
  const filterDateEnd = ref('')

  const filteredEntries = ref(entries.value)

  const operatorOptions = ['张三', '李四', '王五', '赵六', '钱七', '孙八']
  const actionTypeOptions = [
    { value: 'inbound', label: '入库' },
    { value: 'outbound', label: '出库' },
    { value: 'approve', label: '审批通过' },
    { value: 'reject', label: '审批驳回' },
    { value: 'audit', label: '审查' },
    { value: 'transfer', label: '调拨' },
  ]

  function addNote(entryId: number, content: string) {
    const entry = entries.value.find(e => e.id === entryId)
    if (entry) {
      entry.notes.push({
        id: Date.now(),
        content,
        author: '当前用户',
        time: new Date().toLocaleString('zh-CN'),
      })
    }
  }

  function deleteNote(entryId: number, noteId: number) {
    const entry = entries.value.find(e => e.id === entryId)
    if (entry) {
      entry.notes = entry.notes.filter(n => n.id !== noteId)
    }
  }

  return { entries, searchQuery, filterOperator, filterActionType, filterDateStart, filterDateEnd, filteredEntries, operatorOptions, actionTypeOptions, addNote, deleteNote }
})
