<template>
  <div class="statements-page">
    <div class="page-header">
      <h2>对账单管理</h2>
      <el-button type="primary" v-if="hasPermission('statement.create')" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        生成对账单
      </el-button>
    </div>

    <el-card class="filter-card mb-20">
      <el-form :model="filters" inline>
        <el-form-item label="对账单号">
          <el-input v-model="filters.keyword" placeholder="请输入对账单号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已发送" value="sent" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="statements" style="width: 100%" v-loading="loading">
        <el-table-column prop="statement_no" label="对账单号" width="180" />
        <el-table-column prop="customer_name" label="客户">
          <template #default="{ row }">
            {{ row.customer?.name }}
          </template>
        </el-table-column>
        <el-table-column prop="period" label="对账周期" width="200">
          <template #default="{ row }">
            {{ row.start_date }} 至 {{ row.end_date }}
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="账单金额" width="120">
          <template #default="{ row }">
            ¥{{ row.total_amount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="paid_amount" label="已付金额" width="120">
          <template #default="{ row }">
            ¥{{ row.paid_amount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small">查看</el-button>
            <el-button
              type="success"
              link
              size="small"
              v-if="row.status === 'draft' && hasPermission('statement.confirm')"
              @click="handleConfirm(row)"
            >
              确认
            </el-button>
            <el-button
              type="warning"
              link
              size="small"
              v-if="row.status === 'confirmed' && hasPermission('statement.send')"
              @click="handleSend(row)"
            >
              发送
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

    <el-dialog v-model="showCreateDialog" title="生成对账单" width="500px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="选择客户">
          <el-select v-model="createForm.customer_id" placeholder="请选择客户" filterable>
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期">
          <el-date-picker v-model="createForm.start_date" type="date" placeholder="选择开始日期" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="createForm.end_date" type="date" placeholder="选择结束日期" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const loading = ref(false)
const statements = ref([])
const showCreateDialog = ref(false)

const filters = reactive({
  keyword: '',
  status: '',
})

const createForm = reactive({
  customer_id: null,
  start_date: null,
  end_date: null,
})

const pagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
})

const hasPermission = (p) => userStore.hasPermission(p)

onMounted(() => {
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const response = await request.get('/statements', {
      params: {
        page: pagination.page,
        per_page: pagination.perPage,
        ...filters,
      },
    })
    statements.value = response.data.data
    pagination.total = response.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.status = ''
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

async function handleCreate() {
  if (!createForm.customer_id || !createForm.start_date || !createForm.end_date) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    await request.post('/statements', createForm)
    ElMessage.success('对账单生成成功')
    showCreateDialog.value = false
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

async function handleConfirm(row) {
  try {
    await ElMessageBox.confirm('确认该对账单吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await request.post(`/statements/${row.id}/confirm`)
    ElMessage.success('对账单已确认')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

async function handleSend(row) {
  try {
    await ElMessageBox.confirm('发送该对账单给客户吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await request.post(`/statements/${row.id}/send`)
    ElMessage.success('对账单已发送')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

function getStatusType(status) {
  const map = {
    draft: 'info',
    confirmed: 'primary',
    sent: 'success',
  }
  return map[status] || 'info'
}

function getStatusName(status) {
  const map = {
    draft: '草稿',
    confirmed: '已确认',
    sent: '已发送',
  }
  return map[status] || status
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.statements-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }
  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
