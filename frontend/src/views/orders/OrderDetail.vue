<template>
  <div v-loading="loading">
    <div class="page-header">
      <div>
        <el-button text @click="goBack" style="padding-left: 0">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title">
          订单详情
          <el-tag :type="getStatusType(order?.status)" style="margin-left: 12px">
            {{ formatStatus(order?.status) }}
          </el-tag>
        </h2>
      </div>
      <div>
        <el-button
          v-if="order?.status === 'pending_confirmation'"
          type="success"
          @click="handleConfirm"
        >
          <el-icon><Check /></el-icon>
          确认订单
        </el-button>
        <el-button
          v-if="['confirmed', 'in_progress'].includes(order?.status)"
          type="warning"
          @click="handleRefund"
        >
          <el-icon><Refund /></el-icon>
          申请退款
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <div class="card mb-20">
          <div class="section-title">基本信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ order?.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="订单来源">
              {{ order?.source === 'direct' ? '直客' : order?.source }}
            </el-descriptions-item>
            <el-descriptions-item label="下单时间">
              {{ formatDateTime(order?.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="支付时间">
              {{ order?.paidAt ? formatDateTime(order?.paidAt) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="支付方式">
              {{ formatPaymentMethod(order?.paymentMethod) }}
            </el-descriptions-item>
            <el-descriptions-item label="确认人">
              {{ order?.confirmer?.name || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="card mb-20">
          <div class="section-title">客户信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="客户姓名">{{ order?.customerName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ order?.customerPhone }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="card mb-20">
          <div class="section-title">商品明细</div>
          <el-table :data="order?.items || []" border>
            <el-table-column label="路线名称" min-width="160">
              <template #default="{ row }">
                {{ row.tour?.name || row.tourName }}
              </template>
            </el-table-column>
            <el-table-column label="出行日期" width="120">
              <template #default="{ row }">
                {{ row.tourDate }} {{ row.startTime }}
              </template>
            </el-table-column>
            <el-table-column label="单价" width="100">
              <template #default="{ row }">
                ¥{{ Number(row.unitPrice).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column label="小计" width="120">
              <template #default="{ row }">
                ¥{{ Number(row.subtotal).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ formatItemStatus(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="card mb-20" v-if="order?.remark">
          <div class="section-title">备注</div>
          <p>{{ order?.remark }}</p>
        </div>

        <div class="card" v-if="order?.refundReason">
          <div class="section-title">退款信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="退款金额">
              <span style="color: #f56c6c">¥{{ Number(order?.refundAmount).toFixed(2) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="退款时间">
              {{ formatDateTime(order?.refundedAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="退款原因" :span="2">
              {{ order?.refundReason }}
            </el-descriptions-item>
            <el-descriptions-item label="操作人">
              {{ order?.refunder?.name || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="card mb-20">
          <div class="section-title">费用汇总</div>
          <div class="fee-summary">
            <div class="fee-row">
              <span>订单总额</span>
              <span>¥{{ Number(order?.totalAmount || 0).toFixed(2) }}</span>
            </div>
            <div class="fee-row">
              <span>已付金额</span>
              <span>¥{{ Number(order?.paidAmount || 0).toFixed(2) }}</span>
            </div>
            <div class="fee-row refund" v-if="order?.refundAmount > 0">
              <span>退款金额</span>
              <span>-¥{{ Number(order?.refundAmount || 0).toFixed(2) }}</span>
            </div>
            <div class="fee-row total">
              <span>实收金额</span>
              <span>¥{{ Number((order?.paidAmount || 0) - (order?.refundAmount || 0)).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="section-title">订单轨迹</div>
          <el-timeline>
            <el-timeline-item
              v-for="(item, idx) in timeline"
              :key="idx"
              :timestamp="item.time"
              :type="item.type"
            >
              {{ item.label }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOrder, confirmOrder, refundOrder } from '@/api/orders'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const order = ref(null)

const timeline = computed(() => {
  const list = []
  if (!order.value) return list

  list.push({
    label: '订单创建',
    time: order.value.createdAt,
    type: 'primary'
  })

  if (order.value.paidAt) {
    list.push({
      label: '支付成功',
      time: order.value.paidAt,
      type: 'success'
    })
  }

  if (order.value.confirmedAt) {
    list.push({
      label: `订单已确认（${order.value.confirmer?.name || '系统'}）`,
      time: order.value.confirmedAt,
      type: 'success'
    })
  }

  if (order.value.completedAt) {
    list.push({
      label: '订单完成',
      time: order.value.completedAt,
      type: 'success'
    })
  }

  if (order.value.refundedAt) {
    list.push({
      label: `已退款（${order.value.refunder?.name || '系统'}）`,
      time: order.value.refundedAt,
      type: 'warning'
    })
  }

  if (order.value.cancelledAt) {
    list.push({
      label: '订单取消',
      time: order.value.cancelledAt,
      type: 'danger'
    })
  }

  return list
})

const fetchData = async () => {
  loading.value = true
  try {
    order.value = await getOrder(route.params.id)
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const handleConfirm = async () => {
  try {
    await ElMessageBox.confirm('确定确认此订单吗？', '提示', { type: 'warning' })
    await confirmOrder(order.value.id)
    ElMessage.success('确认成功')
    fetchData()
  } catch (e) {
    // cancelled
  }
}

const handleRefund = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入退款原因', '退款确认', {
      confirmButtonText: '确定退款',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入退款原因',
      type: 'warning'
    })
    await refundOrder(order.value.id, value)
    ElMessage.success('退款成功')
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

const formatItemStatus = (status) => {
  const map = {
    pending: '待确认',
    confirmed: '已确认',
    used: '已使用',
    refunded: '已退款',
    cancelled: '已取消'
  }
  return map[status] || status
}

const formatPaymentMethod = (method) => {
  const map = { wechat: '微信支付', alipay: '支付宝', cash: '现金' }
  return map[method] || method || '未支付'
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
.fee-summary {
  padding: 10px 0;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;
  font-size: 14px;
  color: #606266;
}

.fee-row:last-child {
  border-bottom: none;
}

.fee-row.refund {
  color: #f56c6c;
}

.fee-row.total {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  padding-top: 16px;
}
</style>
