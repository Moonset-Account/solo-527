<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">调用日志</h2>
      <div>
        <el-button type="primary" plain @click="handleExport">
          <el-icon><Download /></el-icon>
          导出日志
        </el-button>
        <el-button type="danger" plain :disabled="!selectedRows.length" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="用户">
          <el-input v-model="filterForm.user" placeholder="用户名" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="filterForm.type" placeholder="全部类型" clearable style="width: 160px">
            <el-option label="登录" value="login" />
            <el-option label="登出" value="logout" />
            <el-option label="创建草稿" value="create_draft" />
            <el-option label="编辑草稿" value="edit_draft" />
            <el-option label="发送邮件" value="send_email" />
            <el-option label="AI生成" value="ai_generate" />
            <el-option label="提交复核" value="submit_review" />
            <el-option label="复核通过" value="review_approve" />
            <el-option label="复核驳回" value="review_reject" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <DataTable
      :data="tableData"
      :loading="loading"
      :total="total"
      :show-selection="true"
      @selection-change="handleSelectionChange"
      @refresh="fetchData"
      @page-change="handlePageChange"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="user" label="用户" width="100" />
      <el-table-column prop="type" label="操作类型" width="130">
        <template #default="{ row }">
          <el-tag :type="getTypeTagType(row.type)" size="small">
            {{ getTypeLabel(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="操作描述" min-width="250" show-overflow-tooltip />
      <el-table-column prop="ip" label="IP地址" width="140" />
      <el-table-column prop="duration" label="耗时" width="100" align="right">
        <template #default="{ row }">
          {{ row.duration }}ms
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small" effect="plain">
            {{ row.status === 'success' ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="操作时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">
            <el-icon><View /></el-icon>
            详情
          </el-button>
        </template>
      </el-table-column>
    </DataTable>

    <el-dialog v-model="detailDialogVisible" title="日志详情" width="640px">
      <el-descriptions v-if="currentLog" :column="1" border>
        <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="操作用户">{{ currentLog.user }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">{{ getTypeLabel(currentLog.type) }}</el-descriptions-item>
        <el-descriptions-item label="操作描述">{{ currentLog.description }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ip }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ currentLog.duration }}ms</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentLog.status === 'success' ? 'success' : 'danger'" size="small">
            {{ currentLog.status === 'success' ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ formatDateTime(currentLog.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="User Agent">{{ currentLog.userAgent }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" v-if="currentLog.requestParams">
          <pre class="params-json">{{ currentLog.requestParams }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" v-if="currentLog.error">
          <div class="error-message">{{ currentLog.error }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Delete, Search, RefreshLeft, View } from '@element-plus/icons-vue'
import DataTable from '@/components/DataTable.vue'
import { formatDateTime } from '@/utils/format'

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const detailDialogVisible = ref(false)
const currentLog = ref(null)

const filterForm = reactive({
  user: '',
  type: '',
  status: '',
  dateRange: []
})

const typeLabels = {
  login: '登录',
  logout: '登出',
  create_draft: '创建草稿',
  edit_draft: '编辑草稿',
  send_email: '发送邮件',
  ai_generate: 'AI生成',
  submit_review: '提交复核',
  review_approve: '复核通过',
  review_reject: '复核驳回'
}

const typeTagTypes = {
  login: '',
  logout: 'info',
  create_draft: 'primary',
  edit_draft: 'warning',
  send_email: 'success',
  ai_generate: '',
  submit_review: 'warning',
  review_approve: 'success',
  review_reject: 'danger'
}

const mockLogs = []
const types = Object.keys(typeLabels)
const users = ['张三', '李四', '王五', '赵六', '孙七', 'demo_sales', 'demo_admin']
const statuses = ['success', 'failed']

for (let i = 1; i <= 100; i++) {
  const type = types[Math.floor(Math.random() * types.length)]
  mockLogs.push({
    id: i,
    user: users[Math.floor(Math.random() * users.length)],
    type,
    description: `${typeLabels[type]} - ${type === 'create_draft' ? '新建了邮件草稿' : type === 'send_email' ? '发送了邮件' : '执行了操作'}`,
    ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    duration: Math.floor(Math.random() * 5000) + 50,
    status: Math.random() > 0.1 ? 'success' : 'failed',
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 3600 * 1000),
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    requestParams: JSON.stringify({ test: 'data', id: i }, null, 2),
    error: Math.random() > 0.1 ? null : '连接超时，请稍后重试'
  })
}

function fetchData() {
  loading.value = true
  setTimeout(() => {
    let data = [...mockLogs]
    if (filterForm.user) {
      data = data.filter(item => item.user.includes(filterForm.user))
    }
    if (filterForm.type) {
      data = data.filter(item => item.type === filterForm.type)
    }
    if (filterForm.status) {
      data = data.filter(item => item.status === filterForm.status)
    }
    total.value = data.length
    const start = (currentPage.value - 1) * pageSize.value
    tableData.value = data.slice(start, start + pageSize.value)
    loading.value = false
  }, 300)
}

function handlePageChange({ page, size }) {
  currentPage.value = page
  pageSize.value = size
  fetchData()
}

function handleReset() {
  filterForm.user = ''
  filterForm.type = ''
  filterForm.status = ''
  filterForm.dateRange = []
  currentPage.value = 1
  fetchData()
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

function handleView(row) {
  currentLog.value = row
  detailDialogVisible.value = true
}

function handleExport() {
  ElMessage.success('日志导出成功')
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条日志吗？`, '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success(`已删除 ${selectedRows.value.length} 条日志`)
    fetchData()
  } catch (e) {
  }
}

function getTypeLabel(type) {
  return typeLabels[type] || type
}

function getTypeTagType(type) {
  return typeTagTypes[type] || ''
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.filter-card {
  margin-bottom: 16px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.params-json {
  margin: 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  max-height: 200px;
  overflow-y: auto;
  color: #606266;
}

.error-message {
  color: #f56c6c;
  padding: 8px;
  background: #fef0f0;
  border-radius: 4px;
  line-height: 1.6;
}
</style>
