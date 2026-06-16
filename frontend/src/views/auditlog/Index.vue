<template>
  <div class="auditlog-page">
    <el-card shadow="hover">
      <template #header>
        <span>审计日志</span>
      </template>
      <div class="search-bar">
        <el-select v-model="search.action" placeholder="操作类型" clearable style="width: 180px" @change="fetchData">
          <el-option label="评论无回复" value="COMMENT_NO_REPLY" />
          <el-option label="批量导入" value="BATCH_IMPORT" />
          <el-option label="批量审批" value="BATCH_APPROVE" />
          <el-option label="角色变更" value="ROLE_CHANGE" />
          <el-option label="流程配置" value="PROCESS_CONFIG" />
        </el-select>
        <el-date-picker v-model="search.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" @change="fetchData" />
        <el-input v-model="search.username" placeholder="操作人" clearable style="width: 160px" @clear="fetchData" @keyup.enter="fetchData" />
        <el-button type="primary" @click="fetchData">搜索</el-button>
      </div>
      <el-table :data="tableData" stripe style="width: 100%">
        <el-table-column prop="createdAt" label="操作时间" width="180" />
        <el-table-column prop="username" label="操作人" width="120" />
        <el-table-column label="操作类型" width="140">
          <template #default="{ row }">
            <el-tag :type="actionTypeTagMap[row.actionType] || 'info'" size="small">
              {{ actionTypeLabelMap[row.actionType] || row.actionType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetType" label="目标类型" width="120" />
        <el-table-column prop="targetId" label="目标ID" width="100" />
        <el-table-column label="详情" width="100">
          <template #default="{ row }">
            <el-button v-if="row.detail" type="primary" link size="small" @click="openDetailDialog(row)">查看</el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="ipAddress" label="IP地址" width="140" />
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="操作详情" width="600px">
      <pre class="detail-json">{{ detailContent }}</pre>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getAuditLogs } from '@/api/auditLog'

const tableData = ref([])
const detailDialogVisible = ref(false)
const detailContent = ref('')

const search = ref({
  action: '',
  dateRange: null,
  username: ''
})

const pagination = ref({
  page: 1,
  size: 10,
  total: 0
})

const actionTypeLabelMap = {
  COMMENT_NO_REPLY: '评论无回复',
  BATCH_IMPORT: '批量导入',
  BATCH_APPROVE: '批量审批',
  ROLE_CHANGE: '角色变更',
  PROCESS_CONFIG: '流程配置'
}

const actionTypeTagMap = {
  COMMENT_NO_REPLY: 'warning',
  BATCH_IMPORT: 'primary',
  BATCH_APPROVE: 'success',
  ROLE_CHANGE: 'danger',
  PROCESS_CONFIG: 'info'
}

async function fetchData() {
  try {
    const params = {
      page: pagination.value.page,
      size: pagination.value.size
    }
    if (search.value.action) params.action = search.value.action
    if (search.value.username) params.username = search.value.username
    if (search.value.dateRange && search.value.dateRange.length === 2) {
      params.startDate = search.value.dateRange[0]
      params.endDate = search.value.dateRange[1]
    }
    const res = await getAuditLogs(params)
    tableData.value = res.data?.records || res.data || []
    pagination.value.total = res.data?.total || 0
  } catch (e) {
    console.error(e)
  }
}

function openDetailDialog(row) {
  try {
    const parsed = typeof row.detail === 'string' ? JSON.parse(row.detail) : row.detail
    detailContent.value = JSON.stringify(parsed, null, 2)
  } catch {
    detailContent.value = row.detail
  }
  detailDialogVisible.value = true
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.auditlog-page {
  padding: 20px;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.detail-json {
  margin: 0;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 500px;
  overflow-y: auto;
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
}
</style>
