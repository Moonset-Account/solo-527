<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { ElMessage } from 'element-plus'

const { get, post } = useApi()

const activeTab = ref('all')

interface ApprovalItem {
  id: number
  requesterName: string
  targetName: string
  accessLevel: string
  reason: string
  status: string
  reviewerName: string
  reviewComment: string
  createdAt: string
  reviewedAt: string
  expiresAt: string
}

const allItems = ref<ApprovalItem[]>([])
const reviewDialogVisible = ref(false)
const reviewAction = ref<'approve' | 'reject'>('approve')
const reviewTarget = ref<ApprovalItem | null>(null)
const reviewForm = ref({ comment: '', expiresAt: '' })

const filteredItems = computed(() => {
  if (activeTab.value === 'all') return allItems.value
  if (activeTab.value === 'pending') return allItems.value.filter(i => i.status === 'pending')
  if (activeTab.value === 'approved') return allItems.value.filter(i => i.status === 'approved')
  if (activeTab.value === 'rejected') return allItems.value.filter(i => i.status === 'rejected')
  return allItems.value
})

onMounted(() => { fetchData() })

async function fetchData() {
  const data = await get<any[]>('/api/approvals')
  if (data) {
    allItems.value = data
  }
}

function statusType(s: string) {
  return s === 'pending' ? 'warning' : s === 'approved' ? 'success' : 'danger'
}

function statusLabel(s: string) {
  return s === 'pending' ? '待审批' : s === 'approved' ? '已通过' : '已拒绝'
}

function openReviewDialog(item: ApprovalItem, action: 'approve' | 'reject') {
  reviewTarget.value = item
  reviewAction.value = action
  reviewForm.value = { comment: '', expiresAt: '' }
  reviewDialogVisible.value = true
}

async function submitReview() {
  if (!reviewTarget.value) return
  const url = `/api/approvals/${reviewTarget.value.id}/${reviewAction.value}`
  const body: any = { reviewComment: reviewForm.value.comment }
  if (reviewAction.value === 'approve' && reviewForm.value.expiresAt) {
    body.expiresAt = reviewForm.value.expiresAt
  }
  const ok = await post(url, body)
  if (ok !== null) {
    ElMessage.success(reviewAction.value === 'approve' ? '审批通过' : '已拒绝')
    reviewDialogVisible.value = false
    fetchData()
  }
}
</script>

<template>
  <div class="space-y-4">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane label="待审批" name="pending" />
      <el-tab-pane label="已通过" name="approved" />
      <el-tab-pane label="已拒绝" name="rejected" />
    </el-tabs>

    <el-table :data="filteredItems" stripe>
      <el-table-column prop="requesterName" label="申请人" width="120" />
      <el-table-column prop="targetName" label="申请资源" min-width="160" />
      <el-table-column prop="accessLevel" label="访问级别" width="100" />
      <el-table-column prop="reason" label="原因" min-width="160">
        <template #default="{ row }">
          <span class="text-sm" style="color: var(--color-text-secondary)">{{ row.reason || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="申请时间" width="170">
        <template #default="{ row }">
          <span class="text-xs" style="color: var(--color-text-muted)">{{ row.createdAt }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <template v-if="row.status === 'pending'">
            <el-button type="success" size="small" @click="openReviewDialog(row, 'approve')">通过</el-button>
            <el-button type="danger" size="small" @click="openReviewDialog(row, 'reject')">拒绝</el-button>
          </template>
          <template v-else>
            <span class="text-xs" style="color: var(--color-text-secondary)">
              {{ row.reviewerName }}: {{ row.reviewComment || '-' }}
            </span>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="reviewDialogVisible" :title="reviewAction === 'approve' ? '审批通过' : '拒绝申请'" width="480px">
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="审批意见">
          <el-input v-model="reviewForm.comment" type="textarea" :rows="3" placeholder="请输入审批意见" />
        </el-form-item>
        <el-form-item v-if="reviewAction === 'approve'" label="过期时间">
          <el-date-picker v-model="reviewForm.expiresAt" type="datetime" placeholder="选择过期时间" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button :type="reviewAction === 'approve' ? 'success' : 'danger'" @click="submitReview">
          {{ reviewAction === 'approve' ? '确认通过' : '确认拒绝' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
