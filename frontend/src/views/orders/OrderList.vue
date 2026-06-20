<template>
  <div>
    <div class="filter-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="订单号/客户姓名/电话"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="待支付" value="pending_payment" />
            <el-option label="待确认" value="pending_confirmation" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="退款中" value="refund_pending" />
            <el-option label="已退款" value="refunded" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <div class="flex-between mb-16">
        <div class="section-title" style="margin-bottom: 0">订单列表</div>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="订单号" width="160" />
        <el-table-column label="客户信息" width="160">
          <template #default="{ row }">
            <div>{{ row.customerName }}</div>
            <div style="color: #909399; font-size: 12px">{{ row.customerPhone }}</div>
          </template>
        </el-table-column>
        <el-table-column label="商品信息" min-width="200">
          <template #default="{ row }">
            <div v-for="item in row.items?.slice(0, 2)" :key="item.id" class="order-item">
              {{ item.tour?.name || item.tourName }} - {{ item.tourDate }} {{ item.startTime }}
              <span class="qty">x{{ item.quantity }}</span>
            </div>
            <div v-if="row.items?.length > 2" style="color: #909399; font-size: 12px">
              等 {{ row.items.length }} 项
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <div style="font-weight: 500; color: #f56c6c">¥{{ Number(row.totalAmount).toFixed(2) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="确认人" width="100">
          <template #default="{ row }">
            {{ row.confirmer?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleDetail(row.id)">
              详情
            </el-button>
            <el-button
              v-if="row.status === 'pending_confirmation'"
              text
              type="success"
              @click="handleConfirm(row)"
            >
              确认
            </el-button>
            <el-button
              v-if="['confirmed', 'in_progress'].includes(row.status)"
              text
              type="warning"
              @click="handleRefund(row)"
            >
              退款
            </el-button>
            <el-button
              v-if="['pending_payment', 'pending_confirmation'].includes(row.status)"
              text
              type="danger"
              @click="handleCancel(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getOrders, confirmOrder, refundOrder, cancelOrder } from '@/api/orders'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const searchForm = reactive({
  keyword: '',
  status: ''
})

const dateRange = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      startDate: dateRange.value?.[0]?.toISOString().split('T')[0],
      endDate: dateRange.value?.[1]?.toISOString().split('T')[0]
    }
    const res = await getOrders(params)
    tableData.value = res.list
    pagination.total = res.total
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  dateRange.value = []
  pagination.page = 1
  fetchData()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

const handleDetail = (id) => {
  router.push(`/orders/${id}`)
}

const handleConfirm = async (row) => {
  try {
    await ElMessageBox.confirm(`确定确认订单"${row.orderNo}"吗？`, '提示', {
      type: 'warning'
    })
    await confirmOrder(row.id)
    ElMessage.success('确认成功')
    fetchData()
  } catch (e) {
    // cancelled
  }
}

const handleRefund = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入退款原因', '退款确认', {
      confirmButtonText: '确定退款',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入退款原因',
      type: 'warning'
    })
    await refundOrder(row.id, value)
    ElMessage.success('退款成功')
    fetchData()
  } catch (e) {
    // cancelled
  }
}

const handleCancel = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入取消原因', '取消订单', {
      confirmButtonText: '确定取消',
      cancelButtonText: '返回',
      inputType: 'textarea',
      inputPlaceholder: '请输入取消原因',
      type: 'warning'
    })
    await cancelOrder(row.id, value)
    ElMessage.success('取消成功')
    fetchData()
  } catch (e) {
    // cancelled
  }
}

const formatStatus = (status) => {
  const map = {
    pending_payment: '待支付',
    pending_confirmation: '待确认',
    confirmed: '已确认',
    in_progress: '进行中',
    completed: '已完成',
    refund_pending: '退款中',
    refunded: '已退款',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    pending_payment: 'info',
    pending_confirmation: 'warning',
    confirmed: 'primary',
    in_progress: '',
    completed: 'success',
    refund_pending: 'warning',
    refunded: 'info',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const formatDateTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.order-item {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.order-item .qty {
  color: #909399;
}
</style>
