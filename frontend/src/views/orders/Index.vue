<template>
  <div class="orders-page">
    <div class="page-header">
      <h2>订单管理</h2>
      <el-button type="primary" @click="goToCreate" v-if="userStore.hasPermission('order.create')">
        <el-icon><Plus /></el-icon>
        新建订单
      </el-button>
    </div>
    
    <el-card class="filter-card">
      <el-form :model="filters" inline class="filter-form">
        <el-form-item label="订单编号">
          <el-input v-model="filters.keyword" placeholder="请输入订单编号" clearable />
        </el-form-item>
        <el-form-item label="客户">
          <el-input v-model="filters.customer_name" placeholder="客户名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="待确认" value="pending" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="拣货中" value="picking" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="table-card">
      <el-table :data="orders" style="width: 100%" v-loading="loading">
        <el-table-column prop="order_no" label="订单编号" width="160" />
        <el-table-column prop="customer_name" label="客户名称" />
        <el-table-column prop="total_amount" label="订单金额" width="120">
          <template #default="{ row }">
            ¥{{ row.total_amount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payment_status" label="付款状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.payment_status === 'paid' ? 'success' : 'warning'">
              {{ row.payment_status === 'paid' ? '已付款' : '未付款' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="salesperson_name" label="业务员" width="100" />
        <el-table-column prop="created_at" label="下单时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goToDetail(row)">查看</el-button>
            <el-button
              type="success"
              link
              size="small"
              v-if="row.status === 'pending' && userStore.hasPermission('order.confirm')"
              @click="handleConfirm(row)"
            >
              确认
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              v-if="['pending', 'confirmed'].includes(row.status) && userStore.hasPermission('order.cancel')"
              @click="handleCancel(row)"
            >
              取消
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
import { useOrderStore } from '@/stores/order'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const orderStore = useOrderStore()
const userStore = useUserStore()

const dateRange = ref([])
const filters = reactive({
  keyword: '',
  customer_name: '',
  status: '',
})

const orders = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
})

onMounted(() => {
  fetchOrders()
})

async function fetchOrders() {
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
    
    const response = await orderStore.fetchOrders(params)
    orders.value = response.data.data
    pagination.total = response.data.total
  } catch (error) {
    console.error('Fetch orders error:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchOrders()
}

function handleReset() {
  filters.keyword = ''
  filters.customer_name = ''
  filters.status = ''
  dateRange.value = []
  pagination.page = 1
  fetchOrders()
}

function handlePageChange(page) {
  pagination.page = page
  fetchOrders()
}

function handleSizeChange(size) {
  pagination.perPage = size
  pagination.page = 1
  fetchOrders()
}

function goToCreate() {
  router.push('/orders/create')
}

function goToDetail(row) {
  router.push(`/orders/${row.id}`)
}

async function handleConfirm(row) {
  try {
    await ElMessageBox.confirm('确认该订单吗？确认后将锁定库存。', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
    
    await orderStore.confirmOrder(row.id)
    ElMessage.success('订单确认成功')
    fetchOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Confirm order error:', error)
    }
  }
}

async function handleCancel(row) {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入取消原因', '取消订单', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入取消原因',
    })
    
    await orderStore.cancelOrder(row.id, reason)
    ElMessage.success('订单取消成功')
    fetchOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Cancel order error:', error)
    }
  }
}

function getStatusType(status) {
  const map = {
    pending: 'info',
    confirmed: 'primary',
    picking: 'warning',
    shipped: 'success',
    completed: 'success',
    cancelled: 'danger',
  }
  return map[status] || 'info'
}

function getStatusName(status) {
  const map = {
    pending: '待确认',
    confirmed: '已确认',
    picking: '拣货中',
    shipped: '已发货',
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
.orders-page {
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
  
  .filter-card {
    margin-bottom: 20px;
    
    .filter-form {
      .el-form-item {
        margin-bottom: 0;
      }
    }
  }
  
  .table-card {
    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }
}
</style>
