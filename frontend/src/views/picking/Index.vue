<template>
  <div class="picking-page">
    <div class="page-header">
      <h2>拣货管理</h2>
    </div>

    <el-card class="filter-card mb-20">
      <el-form :model="filters" inline>
        <el-form-item label="拣货单号">
          <el-input v-model="filters.keyword" placeholder="请输入拣货单号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="待拣货" value="pending" />
            <el-option label="拣货中" value="picking" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="拣货员">
          <el-select v-model="filters.picker_id" placeholder="全部" clearable>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="pickingLists" style="width: 100%" v-loading="loading">
        <el-table-column prop="picking_no" label="拣货单号" width="160" />
        <el-table-column prop="order_no" label="关联订单" width="160">
          <template #default="{ row }">
            {{ row.order?.order_no }}
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" label="客户">
          <template #default="{ row }">
            {{ row.order?.customer?.name }}
          </template>
        </el-table-column>
        <el-table-column prop="picker_name" label="拣货员" width="100">
          <template #default="{ row }">
            {{ row.picker?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.progress || 0" />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goToDetail(row)">
              查看
            </el-button>
            <el-button
              type="success"
              link
              size="small"
              v-if="row.status === 'pending' && hasPermission('picking.start')"
              @click="handleStart(row)"
            >
              开始拣货
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const pickingLists = ref([])

const filters = reactive({
  keyword: '',
  status: '',
  picker_id: '',
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
    const response = await request.get('/picking-lists', {
      params: {
        page: pagination.page,
        per_page: pagination.perPage,
        ...filters,
      },
    })
    pickingLists.value = response.data.data
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
  filters.picker_id = ''
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

function goToDetail(row) {
  router.push(`/picking/${row.id}`)
}

async function handleStart(row) {
  try {
    await ElMessageBox.confirm('确认开始拣货吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await request.post(`/picking-lists/${row.id}/start`)
    ElMessage.success('已开始拣货')
    fetchData()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

function getStatusType(status) {
  const map = {
    pending: 'info',
    picking: 'warning',
    completed: 'success',
    cancelled: 'danger',
  }
  return map[status] || 'info'
}

function getStatusName(status) {
  const map = {
    pending: '待拣货',
    picking: '拣货中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.picking-page {
  .page-header {
    h2 {
      margin: 0 0 20px 0;
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
