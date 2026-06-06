<template>
  <div class="borrowing-manage">
    <div class="page-header">
      <h2>借阅管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新建借阅
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出Excel
        </el-button>
      </div>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters" @submit.prevent>
        <el-form-item label="借阅状态">
          <el-select v-model="filters.status" placeholder="全部" clearable @change="loadRecords">
            <el-option label="已预约" value="reserved" />
            <el-option label="已取书" value="picked_up" />
            <el-option label="借阅中" value="borrowed" />
            <el-option label="已逾期" value="overdue" />
            <el-option label="已归还" value="returned" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已丢失" value="lost" />
          </el-select>
        </el-form-item>

        <el-form-item label="家庭名称">
          <el-input v-model="filters.family_name" placeholder="请输入" clearable @keyup.enter="loadRecords" />
        </el-form-item>

        <el-form-item label="绘本名称">
          <el-input v-model="filters.book_title" placeholder="请输入" clearable @keyup.enter="loadRecords" />
        </el-form-item>

        <el-form-item label="仅逾期">
          <el-switch v-model="filters.only_overdue" @change="loadRecords" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="loadRecords">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilters">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="records" stripe v-loading="loading" @row-click="goToDetail" row-key="id">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="绘本信息" min-width="200">
        <template #default="{ row }">
          <div class="book-info-cell">
            <div class="book-title">{{ row.book_title }}</div>
            <div class="text-sm text-gray">条码: {{ row.book_copy_barcode }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="family_name" label="借阅家庭" width="120" />
      <el-table-column prop="borrower" label="借阅人" width="100" />
      <el-table-column prop="status_display" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ row.status_display }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reserved_at" label="预约时间" width="160">
        <template #default="{ row }">{{ formatDateTime(row.reserved_at) }}</template>
      </el-table-column>
      <el-table-column prop="picked_up_at" label="取书时间" width="160">
        <template #default="{ row }">{{ formatDateTime(row.picked_up_at) }}</template>
      </el-table-column>
      <el-table-column prop="due_date" label="应还日期" width="120">
        <template #default="{ row }">
          <span :class="{ 'text-danger': isOverdue(row) }">{{ formatDate(row.due_date) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="returned_at" label="归还时间" width="160">
        <template #default="{ row }">{{ formatDateTime(row.returned_at) }}</template>
      </el-table-column>
      <el-table-column prop="overdue_fine" label="逾期罚款" width="100">
        <template #default="{ row }">
          <span v-if="row.overdue_fine > 0" class="text-danger">¥{{ row.overdue_fine }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="renew_count" label="续借" width="60" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 'reserved'">
            <el-button type="success" size="small" link @click.stop="handlePickup(row)">取书</el-button>
            <el-button type="info" size="small" link @click.stop="handleCancel(row)">取消</el-button>
          </template>
          <template v-else-if="row.status === 'picked_up' || row.status === 'borrowed'">
            <el-button type="success" size="small" link @click.stop="handleReturn(row)">归还</el-button>
            <el-button v-if="canRenew(row)" type="primary" size="small" link @click.stop="handleRenew(row)">续借</el-button>
          </template>
          <template v-else-if="row.status === 'overdue'">
            <el-button type="success" size="small" link @click.stop="handleReturn(row)">归还</el-button>
          </template>
          <el-button type="primary" size="small" link @click.stop="viewStatusLogs(row)">状态日志</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="loadRecords"
      @current-change="loadRecords"
      class="pagination"
    />

    <el-dialog v-model="showCreateDialog" title="新建借阅" width="500px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="选择家庭">
          <el-select v-model="createForm.family_id" placeholder="请选择家庭" filterable>
            <el-option
              v-for="family in families"
              :key="family.id"
              :label="family.name"
              :value="family.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择绘本">
          <el-select v-model="createForm.book_copy_id" placeholder="请选择可借绘本" filterable>
            <el-option
              v-for="copy in availableCopies"
              :key="copy.id"
              :label="`${copy.book_title} - ${copy.barcode}`"
              :value="copy.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showStatusLogsDialog" title="状态流转日志" width="700px">
      <el-timeline v-if="statusLogs.length > 0">
        <el-timeline-item
          v-for="log in statusLogs"
          :key="log.id"
          :timestamp="formatDateTime(log.created_at)"
          type="primary"
        >
          <div class="log-item">
            <div class="log-header">
              <el-tag size="small">{{ log.from_status_display }}</el-tag>
              <el-icon><ArrowRight /></el-icon>
              <el-tag type="success" size="small">{{ log.to_status_display }}</el-tag>
            </div>
            <div class="log-meta">
              <span>操作人: {{ log.operator_name || '系统' }}</span>
            </div>
            <div v-if="log.notes" class="log-notes">备注: {{ log.notes }}</div>
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无日志" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Search, Refresh, ArrowRight } from '@element-plus/icons-vue'
import { api } from '@/api'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const records = ref([])
const families = ref([])
const availableCopies = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showStatusLogsDialog = ref(false)
const statusLogs = ref([])
const selectedRecord = ref(null)

const filters = reactive({
  status: '',
  family_name: '',
  book_title: '',
  only_overdue: false
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const createForm = reactive({
  family_id: null,
  book_copy_id: null
})

function initFiltersFromQuery() {
  const query = route.query
  if (query.status) filters.status = query.status
  if (query.family_name) filters.family_name = query.family_name
  if (query.book_title) filters.book_title = query.book_title
  if (query.only_overdue) filters.only_overdue = query.only_overdue === 'true'
  if (query.page) pagination.page = parseInt(query.page)
  if (query.pageSize) pagination.pageSize = parseInt(query.pageSize)
}

function updateQueryParams() {
  const query = {
    ...filters,
    page: pagination.page,
    pageSize: pagination.pageSize
  }
  Object.keys(query).forEach(key => {
    if (!query[key] || query[key] === false) delete query[key]
  })
  router.replace({ query })
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

function formatDateTime(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

function getStatusType(status) {
  const map = {
    reserved: 'primary',
    picked_up: 'warning',
    borrowed: 'primary',
    overdue: 'danger',
    returned: 'success',
    cancelled: 'info',
    lost: 'danger'
  }
  return map[status] || 'info'
}

function isOverdue(row) {
  if (!row.due_date) return false
  return row.status === 'overdue' || (row.status === 'borrowed' && dayjs(row.due_date).isBefore(dayjs(), 'day'))
}

function canRenew(row) {
  if (!['borrowed', 'overdue'].includes(row.status)) return false
  const maxRenew = row.max_renew_count || 1
  return row.renew_count < maxRenew
}

async function loadRecords() {
  loading.value = true
  try {
    updateQueryParams()
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v && v !== false))
    }
    if (filters.only_overdue) {
      params.status = 'overdue'
    }
    const data = await api.borrowing.list(params)
    records.value = data.results || data
    pagination.total = data.count || data.length
  } catch (error) {
    ElMessage.error('加载借阅记录失败')
  } finally {
    loading.value = false
  }
}

function goToDetail(row) {
  const query = { ...route.query }
  router.push({ path: `/admin/borrowing/${row.id}`, query })
}

function resetFilters() {
  filters.status = ''
  filters.family_name = ''
  filters.book_title = ''
  filters.only_overdue = false
  pagination.page = 1
  loadRecords()
}

async function loadFamilies() {
  try {
    const data = await api.accounts.families()
    families.value = data.results || data
  } catch (error) {}
}

async function loadAvailableCopies() {
  try {
    const data = await api.books.copies({ status: 'available' })
    availableCopies.value = (data.results || data).map(copy => ({
      ...copy,
      book_title: copy.book?.title || copy.book_id
    }))
  } catch (error) {}
}

function goToDetail(row) {
  router.push({
    path: `/admin/borrowing/${row.id}`,
    query: { ...route.query }
  })
}

async function handlePickup(row) {
  try {
    await api.borrowing.transition(row.id, { new_status: 'picked_up' })
    ElMessage.success('取书成功')
    loadRecords()
  } catch (error) {}
}

async function handleReturn(row) {
  try {
    await ElMessageBox.confirm('确认归还该绘本吗？', '确认归还', { type: 'info' })
    await api.borrowing.transition(row.id, { new_status: 'returned' })
    ElMessage.success('归还成功')
    loadRecords()
  } catch (error) {}
}

async function handleCancel(row) {
  try {
    await ElMessageBox.confirm('确认取消该预约吗？', '确认取消', { type: 'warning' })
    await api.borrowing.transition(row.id, { new_status: 'cancelled' })
    ElMessage.success('已取消')
    loadRecords()
  } catch (error) {}
}

async function handleRenew(row) {
  try {
    await api.borrowing.renew(row.id)
    ElMessage.success('续借成功')
    loadRecords()
  } catch (error) {}
}

function viewStatusLogs(row) {
  selectedRecord.value = row
  statusLogs.value = row.status_logs || []
  showStatusLogsDialog.value = true
}

async function submitCreate() {
  if (!createForm.family_id || !createForm.book_copy_id) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    await api.borrowing.create(createForm)
    ElMessage.success('创建成功')
    showCreateDialog.value = false
    loadRecords()
  } catch (error) {}
}

function handleExport() {
  const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
  api.borrowing.export(params).then(blob => {
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `借阅记录_${dayjs().format('YYYYMMDD')}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('导出成功')
  }).catch(() => {
    ElMessage.error('导出失败')
  })
}

onMounted(() => {
  initFiltersFromQuery()
  loadFamilies()
  loadAvailableCopies()
  loadRecords()
})
</script>

<style scoped>
.borrowing-manage {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-bar {
  background: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.book-info-cell {
  line-height: 1.5;
}

.book-title {
  font-weight: 500;
  color: #303133;
}

.text-sm {
  font-size: 12px;
}

.text-gray {
  color: #909399;
}

.text-danger {
  color: #f56c6c;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.log-item {
  padding: 8px 0;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.log-meta {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.log-notes {
  font-size: 13px;
  color: #606266;
}
</style>
