<template>
  <div class="order-detail">
    <div class="page-header">
      <h2>订单详情</h2>
      <div>
        <el-button @click="goBack">返回</el-button>
        <el-button
          type="success"
          v-if="order?.status === 'pending' && hasPermission('order.confirm')"
          @click="handleConfirm"
        >
          确认订单
        </el-button>
        <el-button
          type="danger"
          v-if="['pending', 'confirmed'].includes(order?.status) && hasPermission('order.cancel')"
          @click="handleCancel"
        >
          取消订单
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" v-if="order">
      <el-col :span="16">
        <el-card class="mb-20">
          <template #header>
            <div class="card-header">
              <span>订单信息</span>
              <el-tag :type="getStatusType(order.status)" size="large">
                {{ getStatusName(order.status) }}
              </el-tag>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单编号">{{ order.order_no }}</el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ formatDate(order.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="客户名称">{{ order.customer?.name }}</el-descriptions-item>
            <el-descriptions-item label="客户编码">{{ order.customer?.customer_code }}</el-descriptions-item>
            <el-descriptions-item label="业务员">{{ order.salesperson?.name }}</el-descriptions-item>
            <el-descriptions-item label="付款状态">
              <el-tag :type="order.payment_status === 'paid' ? 'success' : 'warning'">
                {{ order.payment_status === 'paid' ? '已付款' : '未付款' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="付款方式">{{ order.payment_method }}</el-descriptions-item>
            <el-descriptions-item label="配送方式">{{ order.delivery_method }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ order.remarks || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="mb-20">
          <template #header>
            <span>订单商品</span>
          </template>
          <el-table :data="order.items" style="width: 100%">
            <el-table-column prop="product_name" label="商品名称" min-width="180" />
            <el-table-column prop="sku" label="SKU" width="120" />
            <el-table-column prop="specification" label="规格" width="100" />
            <el-table-column prop="price" label="单价" width="100">
              <template #default="{ row }">
                ¥{{ row.price?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column label="小计" width="120">
              <template #default="{ row }">
                ¥{{ (row.price * row.quantity)?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="已拣数量" width="100">
              <template #default="{ row }">
                {{ row.picked_quantity || 0 }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.picked_quantity >= row.quantity" type="success">已完成</el-tag>
                <el-tag v-else type="warning">待拣货</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="mb-20" v-if="order.picking_lists?.length">
          <template #header>
            <span>拣货单</span>
          </template>
          <el-table :data="order.picking_lists" style="width: 100%">
            <el-table-column prop="picking_no" label="拣货单号" width="160" />
            <el-table-column prop="picker_name" label="拣货员" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getPickingStatusType(row.status)">{{ getPickingStatusName(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="进度" width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.progress || 0" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="goToPicking(row)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="mb-20">
          <template #header>
            <span>金额明细</span>
          </template>
          <div class="amount-summary">
            <div class="amount-item">
              <span>商品金额:</span>
              <span>¥{{ order.subtotal_amount?.toFixed(2) }}</span>
            </div>
            <div class="amount-item">
              <span>运费:</span>
              <span>¥{{ order.shipping_fee?.toFixed(2) }}</span>
            </div>
            <div class="amount-item">
              <span>优惠:</span>
              <span>-¥{{ order.discount?.toFixed(2) }}</span>
            </div>
            <el-divider />
            <div class="amount-item total">
              <span>订单总额:</span>
              <span class="text-primary">¥{{ order.total_amount?.toFixed(2) }}</span>
            </div>
          </div>
        </el-card>

        <el-card class="mb-20" v-if="order.debt">
          <template #header>
            <span>欠款信息</span>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="欠款编号">{{ order.debt.debt_no }}</el-descriptions-item>
            <el-descriptions-item label="欠款金额">¥{{ order.debt.amount }}</el-descriptions-item>
            <el-descriptions-item label="剩余欠款">
              <span class="text-danger">¥{{ order.debt.remaining_amount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="到期日期">{{ order.debt.due_date }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="order.debt.status === 'paid' ? 'success' : 'warning'">
                {{ order.debt.status === 'paid' ? '已结清' : '未结清' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card>
          <template #header>
            <span>操作记录</span>
          </template>
          <div class="timeline">
            <el-timeline>
              <el-timeline-item
                v-for="log in auditLogs"
                :key="log.id"
                :timestamp="formatDate(log.created_at)"
                type="primary"
              >
                <div>
                  <strong>{{ log.user?.name }}</strong>
                  <span class="text-muted">{{ getActionText(log.action) }}</span>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-else description="加载中..." />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const order = ref(null)
const auditLogs = ref([])

const hasPermission = (permission) => userStore.hasPermission(permission)

onMounted(() => {
  fetchOrderDetail()
  fetchAuditLogs()
})

async function fetchOrderDetail() {
  try {
    const response = await request.get(`/orders/${route.params.id}`)
    order.value = response.data
  } catch (e) {
    console.error(e)
  }
}

async function fetchAuditLogs() {
  try {
    const response = await request.get(`/audit-trails/orders/${route.params.id}`)
    auditLogs.value = response.data
  } catch (e) {
    console.error(e)
  }
}

async function handleConfirm() {
  try {
    await ElMessageBox.confirm('确认该订单吗？确认后将锁定库存。', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await request.post(`/orders/${order.value.id}/confirm`)
    ElMessage.success('订单确认成功')
    fetchOrderDetail()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

async function handleCancel() {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入取消原因', '取消订单', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入取消原因',
    })
    await request.post(`/orders/${order.value.id}/cancel`, { reason })
    ElMessage.success('订单取消成功')
    fetchOrderDetail()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

function goToPicking(picking) {
  router.push(`/picking/${picking.id}`)
}

function goBack() {
  router.back()
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

function getPickingStatusType(status) {
  const map = {
    pending: 'info',
    picking: 'warning',
    completed: 'success',
    cancelled: 'danger',
  }
  return map[status] || 'info'
}

function getPickingStatusName(status) {
  const map = {
    pending: '待拣货',
    picking: '拣货中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

function getActionText(action) {
  const map = {
    CREATE: '创建了订单',
    UPDATE: '更新了订单',
    DELETE: '删除了订单',
  }
  return map[action] || action
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.order-detail {
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

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .amount-summary {
    .amount-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;

      &.total {
        font-size: 18px;
        font-weight: 600;
      }
    }
  }

  .text-primary {
    color: #409EFF;
  }

  .text-danger {
    color: #F56C6C;
  }

  .text-muted {
    color: #909399;
    margin-left: 8px;
  }
}
</style>
