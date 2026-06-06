<template>
  <div class="import-export-page">
    <div class="page-header">
      <h2>导入导出</h2>
    </div>

    <el-card class="mb-20">
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="module-card">
            <el-icon class="module-icon"><User /></el-icon>
            <h3>客户数据</h3>
            <div class="module-actions">
              <el-upload
                :action="uploadUrl"
                :headers="uploadHeaders"
                :data="{ module: 'customers' }"
                :show-file-list="false"
                :before-upload="beforeUpload"
                accept=".xlsx,.xls,.csv"
              >
                <el-button type="primary" size="small">
                  <el-icon><Upload /></el-icon>
                  导入
                </el-button>
              </el-upload>
              <el-button size="small" @click="handleExport('customers')">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="module-card">
            <el-icon class="module-icon"><Goods /></el-icon>
            <h3>商品数据</h3>
            <div class="module-actions">
              <el-upload
                :action="uploadUrl"
                :headers="uploadHeaders"
                :data="{ module: 'products' }"
                :show-file-list="false"
                :before-upload="beforeUpload"
                accept=".xlsx,.xls,.csv"
              >
                <el-button type="primary" size="small">
                  <el-icon><Upload /></el-icon>
                  导入
                </el-button>
              </el-upload>
              <el-button size="small" @click="handleExport('products')">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="module-card">
            <el-icon class="module-icon"><Document /></el-icon>
            <h3>订单数据</h3>
            <div class="module-actions">
              <el-upload
                :action="uploadUrl"
                :headers="uploadHeaders"
                :data="{ module: 'orders' }"
                :show-file-list="false"
                :before-upload="beforeUpload"
                accept=".xlsx,.xls,.csv"
              >
                <el-button type="primary" size="small">
                  <el-icon><Upload /></el-icon>
                  导入
                </el-button>
              </el-upload>
              <el-button size="small" @click="handleExport('orders')">
                <el-icon><Download /></el-icon>
                导出
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>任务列表</span>
          <el-button link size="small" @click="fetchTasks">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <el-table :data="tasks" style="width: 100%" v-loading="loading">
        <el-table-column prop="task_no" label="任务编号" width="180" />
        <el-table-column prop="type" label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'import' ? 'primary' : 'success'" size="small">
              {{ row.type === 'import' ? '导入' : '导出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="100">
          <template #default="{ row }">
            {{ getModuleName(row.module) }}
          </template>
        </el-table-column>
        <el-table-column prop="original_file_name" label="文件名" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="150">
          <template #default="{ row }">
            <span v-if="row.status === 'processing'">处理中...</span>
            <span v-else-if="row.status === 'completed'">
              成功: {{ row.success_count || 0 }}
              <span v-if="row.failed_count > 0" class="text-danger">
                失败: {{ row.failed_count }}
              </span>
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              :disabled="row.status !== 'completed'"
              @click="handleDownload(row)"
            >
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.perPage"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const loading = ref(false)
const tasks = ref([])

const pagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
})

const uploadUrl = computed(() => '/api/import-export/import')
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`,
}))

onMounted(() => {
  fetchTasks()
})

async function fetchTasks() {
  loading.value = true
  try {
    const response = await request.get('/import-export/tasks', {
      params: {
        page: pagination.page,
        per_page: pagination.perPage,
      },
    })
    tasks.value = response.data.data
    pagination.total = response.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function beforeUpload(file) {
  const isExcel = ['xlsx', 'xls', 'csv'].includes(file.name.split('.').pop().toLowerCase())
  if (!isExcel) {
    ElMessage.error('只能上传 Excel/CSV 文件!')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB!')
    return false
  }
  ElMessage.success('文件上传成功，正在后台处理...')
  setTimeout(fetchTasks, 1000)
  return true
}

async function handleExport(module) {
  try {
    await request.post(`/import-export/export/${module}`)
    ElMessage.success('导出任务已创建，请在任务列表中查看进度')
    fetchTasks()
  } catch (e) {
    console.error(e)
  }
}

async function handleDownload(row) {
  try {
    window.open(`/api/import-export/download/${row.id}`, '_blank')
  } catch (e) {
    console.error(e)
  }
}

function handlePageChange(page) {
  pagination.page = page
  fetchTasks()
}

function handleSizeChange(size) {
  pagination.perPage = size
  pagination.page = 1
  fetchTasks()
}

function getModuleName(module) {
  const map = {
    customers: '客户',
    products: '商品',
    orders: '订单',
    inventories: '库存',
    debts: '欠款',
    statements: '对账单',
  }
  return map[module] || module
}

function getStatusType(status) {
  const map = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger',
  }
  return map[status] || 'info'
}

function getStatusName(status) {
  const map = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
  }
  return map[status] || status
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.import-export-page {
  .page-header h2 {
    margin: 0 0 20px 0;
    font-size: 20px;
    font-weight: 600;
  }
  .module-card {
    text-align: center;
    padding: 30px 20px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    transition: all 0.3s;
    &:hover {
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    }
    .module-icon {
      font-size: 48px;
      color: #409EFF;
      margin-bottom: 16px;
    }
    h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
    }
    .module-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
    }
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .text-danger {
    color: #F56C6C;
    margin-left: 8px;
  }
  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
