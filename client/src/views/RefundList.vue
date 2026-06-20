<template>
  <div class="refund-list">
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="已批准" value="approved" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="已处理" value="processed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>申请退款
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table :data="refundStore.list" v-loading="refundStore.loading" stripe style="width: 100%">
        <el-table-column prop="activityTitle" label="活动名称" min-width="160" />
        <el-table-column prop="userName" label="申请人" width="120" />
        <el-table-column label="退款金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount-text">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="退款原因" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="refundStatusTagType(row.status)" size="small">
              {{ refundStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理说明" prop="processNote" min-width="150" show-overflow-tooltip />
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="success" size="small" @click="handleAction(row, 'approved')">批准</el-button>
              <el-button type="danger" size="small" @click="handleAction(row, 'rejected')">驳回</el-button>
            </template>
            <template v-if="row.status === 'approved'">
              <el-button type="primary" size="small" @click="handleAction(row, 'processed')">处理退款</el-button>
            </template>
            <span v-if="row.status === 'rejected' || row.status === 'processed'" class="handled-text">已完结</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="refundStore.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <el-dialog v-model="createDialogVisible" title="申请退款" width="520">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="活动名称">
          <el-input v-model="createForm.activityTitle" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="退款金额">
          <el-input-number v-model="createForm.amount" :min="0" :precision="2" />
          <span class="fee-unit">元</span>
        </el-form-item>
        <el-form-item label="退款原因">
          <el-input v-model="createForm.reason" type="textarea" :rows="4" placeholder="请输入退款原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="processDialogVisible" :title="processTitle" width="480">
      <el-form :model="processForm" label-width="80px">
        <el-form-item label="处理说明">
          <el-input v-model="processForm.processNote" type="textarea" :rows="3" placeholder="请输入处理说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProcess">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { useRefundStore } from '../stores/refund'

const refundStore = useRefundStore()

const searchForm = reactive({ status: '' })
const pagination = reactive({ page: 1, pageSize: 10 })

const createDialogVisible = ref(false)
const createForm = reactive({
  activityTitle: '',
  amount: 0,
  reason: ''
})

const processDialogVisible = ref(false)
const processTitle = ref('')
const processAction = ref<'approved' | 'rejected' | 'processed'>('approved')
const processForm = reactive({ processNote: '' })
const currentRefundId = ref('')

const statusMap: Record<string, string> = {
  pending: '待审核',
  approved: '已批准',
  rejected: '已驳回',
  processed: '已处理'
}

const tagTypeMap: Record<string, 'warning' | 'success' | 'danger' | ''> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  processed: ''
}

const actionTitleMap: Record<string, string> = {
  approved: '批准退款',
  rejected: '驳回退款',
  processed: '处理退款'
}

const refundStatusLabel = (status: string) => statusMap[status] || status
const refundStatusTagType = (status: string) => tagTypeMap[status] || 'info'

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleSearch = () => {
  refundStore.fetchList({
    status: searchForm.status || undefined,
    page: pagination.page,
    pageSize: pagination.pageSize
  })
}

const handleReset = () => {
  searchForm.status = ''
  pagination.page = 1
  handleSearch()
}

const openCreateDialog = () => {
  createForm.activityTitle = ''
  createForm.amount = 0
  createForm.reason = ''
  createDialogVisible.value = true
}

const submitCreate = async () => {
  if (!createForm.reason) {
    ElMessage.warning('请输入退款原因')
    return
  }
  try {
    await refundStore.create(createForm)
    ElMessage.success('退款申请已提交')
    createDialogVisible.value = false
    handleSearch()
  } catch {}
}

const handleAction = (row: any, action: 'approved' | 'rejected' | 'processed') => {
  currentRefundId.value = row._id
  processAction.value = action
  processTitle.value = actionTitleMap[action]
  processForm.processNote = ''
  processDialogVisible.value = true
}

const submitProcess = async () => {
  try {
    await refundStore.update(currentRefundId.value, {
      status: processAction.value,
      processNote: processForm.processNote
    })
    ElMessage.success('处理成功')
    processDialogVisible.value = false
    handleSearch()
  } catch {}
}

onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.refund-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card :deep(.el-card__body) {
  padding-bottom: 0;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.amount-text {
  color: #e6a23c;
  font-weight: 600;
}

.handled-text {
  color: #909399;
  font-size: 13px;
}

.fee-unit {
  margin-left: 8px;
  color: #909399;
}
</style>
