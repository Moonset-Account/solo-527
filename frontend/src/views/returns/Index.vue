<template>
  <div class="returns-page">
    <div class="page-header">
      <h2>退货管理</h2>
      <el-button type="primary" v-if="hasPermission('return.create')" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建退货
      </el-button>
    </div>

    <el-card class="filter-card mb-20">
      <el-form :model="filters" inline>
        <el-form-item label="退货单号">
          <el-input v-model="filters.keyword" placeholder="请输入退货单号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已收货" value="received" />
            <el-option label="已入库" value="restocked" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table :data="returns" style="width: 100%" v-loading="loading">
        <el-table-column prop="return_no" label="退货单号" width="160" />
        <el-table-column prop="order_no" label="关联订单" width="160">
          <template #default="{ row }">
            {{ row.order?.order_no }}
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" label="客户">
          <template #default="{ row }">
            {{ row.customer?.name }}
          </template>
        </el-table-column>
        <el-table-column prop="return_amount" label="退款金额" width="120">
          <template #default="{ row }">
            ¥{{ row.return_amount?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goToDetail(row)">
              查看
            </el-button>
            <el-button
              type="success"
              link
              size="small"
              v-if="row.status === 'pending' && hasPermission('return.approve')"
              @click="handleApprove(row)"
            >
              审批
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

    <el-dialog v-model="showCreateDialog" title="新建退货申请" width="900px">
      <el-form :model="returnForm" label-width="100px">
        <el-form-item label="关联订单" required>
          <el-input
            v-model="orderSearchKeyword"
            placeholder="输入订单编号后按回车搜索"
            clearable
            @keyup.enter="searchOrder"
          >
            <template #append>
              <el-button @click="searchOrder" :loading="orderSearching">搜索</el-button>
            </template>
          </el-input>
        </el-form-item>

        <el-card v-if="selectedOrder" class="order-card mb-20" shadow="never">
          <template #header>
            <div class="order-header">
              <span>订单信息</span>
              <el-tag size="small">{{ getStatusName(selectedOrder.status) }}</el-tag>
            </div>
          </template>
          <el-descriptions :column="3" size="small" border>
            <el-descriptions-item label="订单编号">{{ selectedOrder.order_no }}</el-descriptions-item>
            <el-descriptions-item label="客户">{{ selectedOrder.customer?.name }}</el-descriptions-item>
            <el-descriptions-item label="金额">¥{{ selectedOrder.total_amount?.toFixed(2) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-form-item label="退货类型" required v-if="selectedOrder">
          <el-radio-group v-model="returnForm.return_type">
            <el-radio value="quality">质量问题</el-radio>
            <el-radio value="wrong">发错商品</el-radio>
            <el-radio value="damage">运输破损</el-radio>
            <el-radio value="other">其他</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="退货商品" required v-if="selectedOrder">
          <el-table :data="selectedOrder.items || []" style="width: 100%" size="small">
            <el-table-column prop="product_name" label="商品" min-width="150">
              <template #default="{ row }">
                {{ row.product?.name || row.product_name }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="订购数量" width="100" />
            <el-table-column label="可退数量" width="100">
              <template #default="{ row }">
                {{ (row.can_return_quantity ?? row.quantity) - (row.returned_quantity || 0) }}
              </template>
            </el-table-column>
            <el-table-column label="退货数量" width="150">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.return_quantity_input"
                  :min="0"
                  :max="(row.can_return_quantity ?? row.quantity) - (row.returned_quantity || 0)"
                  size="small"
                  controls-position="right"
                  @change="updateReturnItems(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="单品原因" min-width="150">
              <template #default="{ row }">
                <el-input
                  v-model="row.item_reason"
                  placeholder="可选"
                  size="small"
                  clearable
                />
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>

        <el-form-item label="总体原因" v-if="selectedOrder">
          <el-input
            v-model="returnForm.reason"
            type="textarea"
            :rows="2"
            placeholder="请输入总体退货原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetCreateDialog">取消</el-button>
        <el-button type="primary" @click="handleCreateReturn" :disabled="!canSubmit">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const returns = ref([])
const showCreateDialog = ref(false)
const orderSearching = ref(false)
const orderSearchKeyword = ref('')
const selectedOrder = ref(null)

const filters = reactive({
  keyword: '',
  status: '',
})

const returnForm = reactive({
  order_id: null,
  return_type: 'quality',
  reason: '',
})

const pagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
})

const hasPermission = (p) => userStore.hasPermission(p)

const canSubmit = computed(() => {
  if (!selectedOrder.value || !returnForm.return_type) return false
  const hasItems = selectedOrder.value.items?.some(
    (item) => item.return_quantity_input > 0
  )
  return hasItems
})

onMounted(() => {
  fetchData()
})

async function fetchData() {
  loading.value = true
  try {
    const response = await request.get('/returns', {
      params: {
        page: pagination.page,
        per_page: pagination.perPage,
        ...filters,
      },
    })
    returns.value = response.data.data
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

function goToDetail(row) {
  router.push(`/returns/${row.id}`)
}

async function handleApprove(row) {
  router.push(`/returns/${row.id}`)
}

async function searchOrder() {
  if (!orderSearchKeyword.value.trim()) {
    ElMessage.warning('请输入订单编号')
    return
  }
  orderSearching.value = true
  try {
    const response = await request.get('/orders', {
      params: { keyword: orderSearchKeyword.value.trim() },
    })
    const orders = response.data.data
    if (orders.length === 0) {
      ElMessage.warning('未找到该订单')
      selectedOrder.value = null
      return
    }
    const order = orders[0]
    const detailResponse = await request.get(`/orders/${order.id}`)
    selectedOrder.value = detailResponse.data
    selectedOrder.value.items = selectedOrder.value.items?.map((item) => ({
      ...item,
      return_quantity_input: 0,
      item_reason: '',
      returned_quantity: 0,
    }))
    returnForm.order_id = order.id
    ElMessage.success('订单已找到，请选择退货商品')
  } catch (e) {
    console.error(e)
    ElMessage.error('搜索订单失败')
  } finally {
    orderSearching.value = false
  }
}

function updateReturnItems(row) {
}

function resetCreateDialog() {
  showCreateDialog.value = false
  orderSearchKeyword.value = ''
  selectedOrder.value = null
  returnForm.order_id = null
  returnForm.return_type = 'quality'
  returnForm.reason = ''
}

async function handleCreateReturn() {
  if (!canSubmit.value) {
    ElMessage.warning('请选择订单和退货商品')
    return
  }
  const items = selectedOrder.value.items
    .filter((item) => item.return_quantity_input > 0)
    .map((item) => ({
      order_item_id: item.id,
      quantity: item.return_quantity_input,
      reason: item.item_reason || null,
    }))

  try {
    await request.post('/returns', {
      order_id: returnForm.order_id,
      return_type: returnForm.return_type,
      reason: returnForm.reason,
      items,
    })
    ElMessage.success('退货申请已提交')
    resetCreateDialog()
    fetchData()
  } catch (e) {
    console.error(e)
  }
}

function getStatusType(status) {
  const map = {
    pending: 'warning',
    approved: 'primary',
    rejected: 'danger',
    received: 'info',
    restocked: 'success',
    completed: 'success',
  }
  return map[status] || 'info'
}

function getStatusName(status) {
  const map = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    received: '已收货',
    restocked: '已入库',
    completed: '已完成',
  }
  return map[status] || status
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.returns-page {
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
  .order-card {
    border: 1px solid #ebeef5;
    margin-bottom: 20px;
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
  .mb-20 {
    margin-bottom: 20px;
  }
}
</style>
