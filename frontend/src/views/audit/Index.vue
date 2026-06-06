<template>
  <div class="audit-page">
    <div class="page-header">
      <h2>审计日志</h2>
    </div>

    <el-card class="filter-card mb-20">
      <el-form :model="filters" inline>
        <el-form-item label="表名">
          <el-select v-model="filters.table_name" placeholder="全部表" clearable>
            <el-option label="客户" value="customers" />
            <el-option label="商品" value="products" />
            <el-option label="仓位" value="locations" />
            <el-option label="订单" value="orders" />
            <el-option label="拣货单" value="picking_lists" />
            <el-option label="拣货明细" value="picking_items" />
            <el-option label="退货单" value="returns" />
            <el-option label="退货明细" value="return_items" />
            <el-option label="欠款" value="debts" />
            <el-option label="对账单" value="statements" />
            <el-option label="用户" value="users" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="filters.action" placeholder="全部操作" clearable>
            <el-option label="新增" value="create" />
            <el-option label="修改" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="审批通过" value="approve" />
            <el-option label="审批拒绝" value="reject" />
            <el-option label="导入" value="import" />
            <el-option label="导出" value="export" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="filters.user_name" placeholder="操作人姓名" clearable />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="auditLogs" style="width: 100%" v-loading="loading">
        <el-table-column prop="table_name" label="表名" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getTableName(row.table_name) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="record_id" label="记录ID" width="100" />
        <el-table-column prop="action" label="操作" width="80">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)" size="small">{{ getActionName(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="user_name" label="操作人" width="100">
          <template #default="{ row }">
            {{ row.user?.name }}
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="130" />
        <el-table-column prop="created_at" label="操作时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="变更详情" min-width="300">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.perPage"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailDialogVisible" title="变更详情" width="900px">
      <el-descriptions :column="2" border v-if="currentLog">
        <el-descriptions-item label="表名">{{ getTableName(currentLog.table_name) }}</el-descriptions-item>
        <el-descriptions-item label="记录ID">{{ currentLog.record_id }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ getActionName(currentLog.action) }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.user?.name }}</el-descriptions-item>
        <el-descriptions-item label="操作时间" :span="2">{{ formatDate(currentLog.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentLog.remarks || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs v-if="currentLog?.old_values || currentLog?.new_values" class="mt-20">
        <el-tab-pane label="变更前" name="old">
          <pre class="json-preview">{{ JSON.stringify(currentLog.old_values, null, 2) }}</pre>
        </el-tab-pane>
        <el-tab-pane label="变更后" name="new">
          <pre class="json-preview">{{ JSON.stringify(currentLog.new_values, null, 2) }}</pre>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import request from '@/utils/request'

const loading = ref(false)
const auditLogs = ref([])
const detailDialogVisible = ref(false)
const currentLog = ref(null)
const dateRange = ref([])

const filters = reactive({
  table_name: '',
  action: '',
  user_name: '',
})

const pagination = reactive({
  page: 1,
  perPage: 30,
  total: 0,
})

onMounted(() => {
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      per_page: pagination.perPage,
      ...filters,
    }
    if (dateRange.value?.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    const response = await request.get('/audit-trails', { params })
    auditLogs.value = response.data.data
    pagination.total = response.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.table_name = ''
  filters.action = ''
  filters.user_name = ''
  dateRange.value = []
  pagination.page = 1
  fetchData()
}

function handlePageChange(page) {
  pagination.page = page
  fetchData()
}

function handleSizeChange(size) {
  pagination.perPage = size
  pagination.page = 1
  fetchData()
}

function showDetail(row) {
  currentLog.value = row
  detailDialogVisible.value = true
}

function getTableName(name) {
  const map = {
    customers: '客户',
    products: '商品',
    orders: '订单',
    picking_lists: '拣货单',
    return_requests: '退货单',
    debts: '欠款',
    statements: '对账单',
    locations: '仓位',
    users: '用户',
  }
  return map[name] || name
}

function getActionType(action) {
  const map = {
    create: 'success',
    update: 'primary',
    delete: 'danger',
    approve: 'success',
    reject: 'danger',
    import: 'primary',
    export: 'primary',
    view: 'info',
  }
  return map[action] || 'info'
}

function getActionName(action) {
  const map = {
    create: '新增',
    update: '修改',
    delete: '删除',
    approve: '审批通过',
    reject: '审批拒绝',
    import: '导入',
    export: '导出',
    view: '查看',
  }
  return map[action] || action
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<style scoped lang="scss">
.audit-page {
  .page-header h2 {
    margin: 0 0 20px 0;
    font-size: 20px;
    font-weight: 600;
  }
  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
  .json-preview {
    background: #f5f7fa;
    padding: 16px;
    border-radius: 4px;
    font-size: 12px;
    max-height: 400px;
    overflow: auto;
    margin: 0;
  }
  .mt-20 {
    margin-top: 20px;
  }
}
</style>
