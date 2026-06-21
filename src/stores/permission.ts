import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePermissionStore = defineStore('permission', () => {
  const pendingReviews = ref([
    { id: 1, userName: '张三', department: '化学系', requestedRole: '危化品管理员', currentRole: '普通用户', reason: '课题需要管理剧毒试剂', date: '2026-06-20', avatar: '' },
    { id: 2, userName: '李四', department: '环境学院', requestedRole: '试剂领用审批人', currentRole: '课题负责人', reason: '需要审批课题组成员领用申请', date: '2026-06-19', avatar: '' },
    { id: 3, userName: '王五', department: '药学系', requestedRole: '系统管理员', currentRole: '危化品管理员', reason: '需要管理系统基础配置', date: '2026-06-18', avatar: '' },
    { id: 4, userName: '赵六', department: '材料学院', requestedRole: '试剂领用审批人', currentRole: '课题负责人', reason: '新课题需要审批权限', date: '2026-06-17', avatar: '' },
  ])

  const selectedIds = ref<number[]>([])
  const commentInput = ref<Record<number, string>>({})

  function approve(id: number) {
    const item = pendingReviews.value.find(r => r.id === id)
    if (item) {
      pendingReviews.value = pendingReviews.value.filter(r => r.id !== id)
    }
  }

  function reject(id: number) {
    const item = pendingReviews.value.find(r => r.id === id)
    if (item) {
      pendingReviews.value = pendingReviews.value.filter(r => r.id !== id)
    }
  }

  function batchApprove() {
    pendingReviews.value = pendingReviews.value.filter(r => !selectedIds.value.includes(r.id))
    selectedIds.value = []
  }

  function batchReject() {
    pendingReviews.value = pendingReviews.value.filter(r => !selectedIds.value.includes(r.id))
    selectedIds.value = []
  }

  function toggleSelect(id: number) {
    const idx = selectedIds.value.indexOf(id)
    if (idx >= 0) selectedIds.value.splice(idx, 1)
    else selectedIds.value.push(id)
  }

  return { pendingReviews, selectedIds, commentInput, approve, reject, batchApprove, batchReject, toggleSelect }
})
