<template>
  <div class="report-list">
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已驳回" value="rejected" />
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
            <el-icon><Plus /></el-icon>新建举报
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table :data="reportStore.list" v-loading="reportStore.loading" stripe style="width: 100%">
        <el-table-column prop="activityTitle" label="活动名称" min-width="160" />
        <el-table-column prop="reporterName" label="举报人" width="120" />
        <el-table-column prop="reason" label="举报原因" min-width="150" />
        <el-table-column prop="description" label="详细描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="reportStatusTagType(row.status)" size="small">
              {{ reportStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处理说明" prop="resolveNote" min-width="150" show-overflow-tooltip />
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="success" size="small" @click="handleResolve(row)">解决</el-button>
              <el-button type="danger" size="small" @click="handleReject(row)">驳回</el-button>
            </template>
            <span v-else class="handled-text">已处理</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="reportStore.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>

    <el-dialog v-model="createDialogVisible" title="新建举报" width="520">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="活动名称">
          <el-input v-model="createForm.activityTitle" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="举报原因">
          <el-input v-model="createForm.reason" placeholder="请输入举报原因" />
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input v-model="createForm.description" type="textarea" :rows="4" placeholder="请详细描述举报内容" />
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
          <el-input v-model="processForm.resolveNote" type="textarea" :rows="3" placeholder="请输入处理说明" />
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
import { useReportStore } from '../stores/report'

const reportStore = useReportStore()

const searchForm = reactive({ status: '' })
const pagination = reactive({ page: 1, pageSize: 10 })

const createDialogVisible = ref(false)
const createForm = reactive({
  activityTitle: '',
  reason: '',
  description: ''
})

const processDialogVisible = ref(false)
const processTitle = ref('')
const processAction = ref<'resolved' | 'rejected'>('resolved')
const processForm = reactive({ resolveNote: '' })
const currentReportId = ref('')

const statusMap: Record<string, string> = {
  pending: '待处理',
  resolved: '已解决',
  rejected: '已驳回'
}

const tagTypeMap: Record<string, 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  resolved: 'success',
  rejected: 'danger'
}

const reportStatusLabel = (status: string) => statusMap[status] || status
const reportStatusTagType = (status: string) => tagTypeMap[status] || 'info'

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleSearch = () => {
  reportStore.fetchList({
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
  createForm.reason = ''
  createForm.description = ''
  createDialogVisible.value = true
}

const submitCreate = async () => {
  if (!createForm.reason) {
    ElMessage.warning('请输入举报原因')
    return
  }
  try {
    await reportStore.create(createForm)
    ElMessage.success('举报已提交')
    createDialogVisible.value = false
    handleSearch()
  } catch {}
}

const handleResolve = (row: any) => {
  currentReportId.value = row._id
  processTitle.value = '解决举报'
  processAction.value = 'resolved'
  processForm.resolveNote = ''
  processDialogVisible.value = true
}

const handleReject = (row: any) => {
  currentReportId.value = row._id
  processTitle.value = '驳回举报'
  processAction.value = 'rejected'
  processForm.resolveNote = ''
  processDialogVisible.value = true
}

const submitProcess = async () => {
  try {
    await reportStore.update(currentReportId.value, {
      status: processAction.value,
      resolveNote: processForm.resolveNote
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
.report-list {
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

.handled-text {
  color: #909399;
  font-size: 13px;
}
</style>
