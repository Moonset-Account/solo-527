<template>
  <div class="requirement-list">
    <el-card shadow="never" class="search-card">
      <el-row :gutter="16" align="middle">
        <el-col :span="6">
          <el-select v-model="query.status" placeholder="状态筛选" clearable @change="handleSearch">
            <el-option label="草稿" value="DRAFT" />
            <el-option label="已提交" value="SUBMITTED" />
            <el-option label="进行中" value="IN_PROGRESS" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="延期" value="DELAYED" />
            <el-option label="已关闭" value="CLOSED" />
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-input v-model="query.keyword" placeholder="关键词搜索" clearable @keyup.enter="handleSearch" />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-col>
        <el-col :span="6" style="text-align: right">
          <el-button type="success" :disabled="!selectedIds.length" @click="handleBatchApprove">
            批量审批 ({{ selectedIds.length }})
          </el-button>
          <el-button type="primary" @click="$router.push('/requirements/create')">新建需求</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never">
      <el-table
        :data="tableData"
        stripe
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityTag(row.priority)" size="small">{{ priorityLabel[row.priority] || row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">{{ statusLabel[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitterId" label="提交人" width="100" />
        <el-table-column prop="assigneeId" label="负责人" width="100" />
        <el-table-column prop="deadline" label="截止日期" width="120">
          <template #default="{ row }">{{ formatDate(row.deadline) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="$router.push(`/requirements/${row.id}`)">查看</el-button>
            <el-button link type="primary" size="small" @click="$router.push(`/requirements/${row.id}/edit`)">编辑</el-button>
            <el-button
              link
              type="success"
              size="small"
              :disabled="row.status === 'COMPLETED'"
              @click="handleComplete(row)"
            >完成</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </el-card>

    <el-dialog v-model="completeVisible" title="完成需求" width="400px">
      <el-form label-width="80px">
        <el-form-item label="完成结论">
          <el-select v-model="completeConclusion" placeholder="请选择结论">
            <el-option label="按时完成" value="ON_TIME" />
            <el-option label="延期完成" value="DELAYED" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmComplete">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pageRequirements, completeRequirement, batchApprove } from '@/api/requirement'
import { formatDate, getPriorityTag, getStatusTag } from '@/utils'

const query = reactive({
  page: 1,
  size: 20,
  status: '',
  keyword: ''
})

const tableData = ref([])
const total = ref(0)
const selectedIds = ref([])
const completeVisible = ref(false)
const completeId = ref(null)
const completeConclusion = ref('ON_TIME')

const priorityLabel = {
  URGENT: '紧急',
  HIGH: '高',
  MEDIUM: '中',
  LOW: '低'
}

const statusLabel = {
  DRAFT: '草稿',
  SUBMITTED: '已提交',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  DELAYED: '延期',
  CLOSED: '已关闭'
}

async function fetchData() {
  const params = { page: query.page, size: query.size }
  if (query.status) params.status = query.status
  if (query.keyword) params.keyword = query.keyword
  const res = await pageRequirements(params)
  tableData.value = res.data?.records || []
  total.value = res.data?.total || 0
}

function handleSearch() {
  query.page = 1
  fetchData()
}

function handleSelectionChange(rows) {
  selectedIds.value = rows.map(r => r.id)
}

async function handleBatchApprove() {
  try {
    await ElMessageBox.confirm(`确认批量审批选中的 ${selectedIds.value.length} 条需求？`, '提示', { type: 'warning' })
    await batchApprove(selectedIds.value)
    ElMessage.success('批量审批成功')
    fetchData()
  } catch (e) { /* cancelled */ }
}

function handleComplete(row) {
  completeId.value = row.id
  completeConclusion.value = 'ON_TIME'
  completeVisible.value = true
}

async function confirmComplete() {
  if (!completeConclusion.value) {
    ElMessage.warning('请选择完成结论')
    return
  }
  await completeRequirement(completeId.value)
  completeVisible.value = false
  ElMessage.success('操作成功')
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.requirement-list {
  padding: 20px;
}

.search-card {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
