<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">邮件草稿</h2>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        新建草稿
      </el-button>
    </div>

    <DataTable
      :data="tableData"
      :loading="loading"
      :total="total"
      :show-selection="true"
      :show-search="true"
      search-placeholder="搜索主题、收件人..."
      @search="handleSearch"
      @refresh="fetchData"
      @page-change="handlePageChange"
    >
      <template #toolbar>
        <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 140px" @change="fetchData">
          <el-option label="草稿" value="draft" />
          <el-option label="待复核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
          <el-option label="已发送" value="sent" />
        </el-select>
      </template>

      <el-table-column prop="subject" label="主题" min-width="200">
        <template #default="{ row }">
          <div class="subject-cell">
            <span class="subject-text" @click="handleEdit(row)">{{ row.subject || '(无主题)' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="recipient" label="收件人" min-width="180" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="versionCount" label="版本" width="80" align="center" />
      <el-table-column prop="updatedAt" label="更新时间" width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.updatedAt || row.updated_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="primary" link size="small" @click="handleViewHistory(row)">
            <el-icon><Clock /></el-icon>
            版本
          </el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import DataTable from '@/components/DataTable.vue'
import { formatDateTime, getStatusText, getStatusType } from '@/utils/format'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const filterStatus = ref('')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const mockData = [
  { id: 1, subject: '关于Q2季度产品报价的回复', recipient: 'client@example.com', status: 'draft', versionCount: 3, updatedAt: new Date() },
  { id: 2, subject: '合作意向确认邮件', recipient: 'partner@company.com', status: 'pending', versionCount: 5, updatedAt: new Date(Date.now() - 3600000) },
  { id: 3, subject: '项目进度周报', recipient: 'team@company.com', status: 'approved', versionCount: 2, updatedAt: new Date(Date.now() - 86400000) },
  { id: 4, subject: '客户投诉处理跟进', recipient: 'support@example.com', status: 'rejected', versionCount: 4, updatedAt: new Date(Date.now() - 2 * 86400000) },
  { id: 5, subject: '年度合作续约邀请', recipient: 'vip@client.com', status: 'sent', versionCount: 1, updatedAt: new Date(Date.now() - 3 * 86400000) },
  { id: 6, subject: '新产品发布通知', recipient: 'all@company.com', status: 'draft', versionCount: 2, updatedAt: new Date(Date.now() - 4 * 86400000) },
  { id: 7, subject: '会议纪要发送', recipient: 'meeting@company.com', status: 'pending', versionCount: 1, updatedAt: new Date(Date.now() - 5 * 86400000) },
  { id: 8, subject: '合同条款确认', recipient: 'legal@partner.com', status: 'approved', versionCount: 6, updatedAt: new Date(Date.now() - 6 * 86400000) }
]

function fetchData() {
  loading.value = true
  setTimeout(() => {
    let data = [...mockData]
    if (filterStatus.value) {
      data = data.filter(item => item.status === filterStatus.value)
    }
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      data = data.filter(item =>
        item.subject.toLowerCase().includes(keyword) ||
        item.recipient.toLowerCase().includes(keyword)
      )
    }
    total.value = data.length
    const start = (currentPage.value - 1) * pageSize.value
    tableData.value = data.slice(start, start + pageSize.value)
    loading.value = false
  }, 300)
}

function handleSearch(keyword) {
  searchKeyword.value = keyword
  currentPage.value = 1
  fetchData()
}

function handlePageChange({ page, size }) {
  currentPage.value = page
  pageSize.value = size
  fetchData()
}

function handleCreate() {
  router.push('/drafts/new')
}

function handleEdit(row) {
  router.push(`/drafts/${row.id}/edit`)
}

function handleViewHistory(row) {
  router.push(`/drafts/${row.id}/edit`)
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除草稿「${row.subject || '无主题'}」吗？`, '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) {
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.subject-cell {
  .subject-text {
    cursor: pointer;
    color: #409eff;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
