<template>
  <div class="order-detail-page">
    <PageHeader title="订单详情" show-back show-demo />

    <div v-loading="loading" class="detail-content">
      <el-card class="status-card">
        <div class="status-header">
          <div class="status-info">
            <h2 class="status-title">{{ statusText }}</h2>
            <p class="status-desc" v-if="statusDescription">{{ statusDescription }}</p>
          </div>
          <el-icon :size="48" :color="statusColor">
            <component :is="statusIcon" />
          </el-icon>
        </div>
        <OrderTimeline v-if="order && order.progress" :progress="order.progress" />
      </el-card>

      <el-row :gutter="24">
        <el-col :span="16">
          <el-card class="info-card">
            <template #header>
              <span class="card-title">设备信息</span>
            </template>
            <div class="info-item">
              <span class="label">设备类型</span>
              <span class="value">{{ order?.deviceType }}</span>
            </div>
            <div class="info-item">
              <span class="label">设备品牌</span>
              <span class="value">{{ order?.deviceBrand }}</span>
            </div>
            <div class="info-item">
              <span class="label">故障描述</span>
              <span class="value">{{ order?.faultDescription }}</span>
            </div>
            <div v-if="order?.faultImages && order.faultImages.length > 0" class="info-item">
              <span class="label">故障照片</span>
              <div class="image-list">
                <el-image
                  v-for="(img, index) in order.faultImages"
                  :key="index"
                  :src="img"
                  :preview-src-list="order.faultImages"
                  :initial-index="index"
                  fit="cover"
                  class="fault-image"
                />
              </div>
            </div>
          </el-card>

          <el-card class="info-card">
            <template #header>
              <span class="card-title">服务信息</span>
            </template>
            <div class="info-item">
              <span class="label">预约时间</span>
              <span class="value">{{ order?.appointmentTime ? formatDateTime(order.appointmentTime) : '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">服务地址</span>
              <span class="value">{{ order?.address }}</span>
            </div>
            <div class="info-item">
              <span class="label">联系人</span>
              <span class="value">{{ order?.contactName }}（{{ order?.contactPhone }}）</span>
            </div>
          </el-card>

          <el-card v-if="order?.technician" class="info-card">
            <template #header>
              <span class="card-title">服务师傅</span>
            </template>
            <div class="technician-info">
              <el-avatar :size="60">
                {{ order.technician.name?.charAt(0) }}
              </el-avatar>
              <div class="tech-details">
                <h3>{{ order.technician.name }}</h3>
                <p class="tech-phone">{{ order.technician.phone }}</p>
                <div class="tech-skills">
                  <el-tag v-for="skill in order.technician.skills" :key="skill" size="small" type="info">
                    {{ skill }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="price-card">
            <template #header>
              <span class="card-title">费用信息</span>
            </template>
            <div class="price-detail">
              <div class="price-item">
                <span>上门费</span>
                <span>¥30.00</span>
              </div>
              <div class="price-item">
                <span>检测费</span>
                <span>¥50.00</span>
              </div>
              <div v-if="order?.price" class="price-item">
                <span>维修费</span>
                <span>¥{{ (order.price - 80).toFixed(2) }}</span>
              </div>
              <div class="price-divider"></div>
              <div class="price-total">
                <span>总计</span>
                <span class="total-price">¥{{ order?.price ? order.price.toFixed(2) : '待报价' }}</span>
              </div>
            </div>
          </el-card>

          <el-card class="action-card">
            <template #header>
              <span class="card-title">订单操作</span>
            </template>
            <div class="action-buttons">
              <el-button v-if="canCancel" type="danger" plain @click="handleCancel">
                取消订单
              </el-button>
              <el-button v-if="canReschedule" type="primary" plain @click="showReschedule = true">
                改约时间
              </el-button>
              <el-button v-if="canReview" type="primary" @click="showReview = true">
                评价服务
              </el-button>
              <el-button v-if="order?.status === 'completed'" @click="goCreateOrder">
                再次下单
              </el-button>
            </div>
          </el-card>

          <el-card v-if="order?.rating" class="review-card">
            <template #header>
              <span class="card-title">我的评价</span>
            </template>
            <div class="review-content">
              <el-rate v-model="order.rating" disabled :size="18" />
              <p v-if="order.review" class="review-text">{{ order.review }}</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-dialog v-model="showReschedule" title="改约时间" width="500px">
      <el-form label-width="80px">
        <el-form-item label="新时间">
          <el-date-picker
            v-model="newAppointmentTime"
            type="datetime"
            placeholder="选择新的预约时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReschedule = false">取消</el-button>
        <el-button type="primary" @click="submitReschedule">确认改约</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReview" title="评价服务" width="500px">
      <el-form label-width="80px">
        <el-form-item label="评分">
          <el-rate v-model="reviewForm.rating" :max="5" />
        </el-form-item>
        <el-form-item label="评价">
          <el-input
            v-model="reviewForm.review"
            type="textarea"
            :rows="4"
            placeholder="请分享您的服务体验"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReview = false">取消</el-button>
        <el-button type="primary" @click="submitReview">提交评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Clock, Check, Warning, Close, Loading
} from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import OrderStatusBadge from '@/components/OrderStatusBadge.vue'
import OrderTimeline from '@/components/OrderTimeline.vue'
import { getOrderDetail, cancelOrder, rescheduleOrder, reviewOrder } from '@/api/order'
import type { Order, OrderProgress } from '@/api/order'
import { formatDateTime } from '@/utils/date'
import { useAppStore } from '@/stores/app'
import { ORDER_STATUS_MAP } from '@/utils/constants'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const loading = ref(false)
const order = ref<Order | null>(null)
const showReschedule = ref(false)
const showReview = ref(false)
const newAppointmentTime = ref('')
const reviewForm = reactive({
  rating: 5,
  review: ''
})

const statusText = computed(() => {
  if (!order.value) return ''
  return ORDER_STATUS_MAP[order.value.status]?.label || order.value.status
})

const statusColor = computed(() => {
  if (!order.value) return '#909399'
  const colorMap: Record<string, string> = {
    pending: '#e6a23c',
    confirmed: '#409eff',
    assigned: '#409eff',
    in_progress: '#67c23a',
    completed: '#67c23a',
    cancelled: '#909399'
  }
  return colorMap[order.value.status] || '#909399'
})

const statusIcon = computed(() => {
  if (!order.value) return Clock
  const iconMap: Record<string, any> = {
    pending: Clock,
    confirmed: Loading,
    assigned: Loading,
    in_progress: Loading,
    completed: Check,
    cancelled: Close
  }
  return iconMap[order.value.status] || Clock
})

const statusDescription = computed(() => {
  if (!order.value) return ''
  const descMap: Record<string, string> = {
    pending: '订单已提交，等待客服确认',
    confirmed: '订单已确认，正在安排师傅',
    assigned: '师傅已接单，正在前往',
    in_progress: '师傅正在服务中',
    completed: '服务已完成',
    cancelled: '订单已取消'
  }
  return descMap[order.value.status] || ''
})

const canCancel = computed(() => {
  if (!order.value) return false
  return ['pending', 'confirmed'].includes(order.value.status)
})

const canReschedule = computed(() => {
  if (!order.value) return false
  return ['pending', 'confirmed', 'assigned'].includes(order.value.status)
})

const canReview = computed(() => {
  if (!order.value) return false
  return order.value.status === 'completed' && !order.value.rating
})

async function fetchOrderDetail() {
  loading.value = true
  
  if (appStore.isDemoMode) {
    setTimeout(() => {
      order.value = generateDemoOrder()
      loading.value = false
    }, 500)
    return
  }

  try {
    const res = await getOrderDetail(route.params.id as string)
    order.value = res.data
  } catch (error) {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}

function generateDemoOrder(): Order {
  const progress: OrderProgress[] = [
    { status: 'pending', statusText: '订单提交', time: '2024-01-15 09:00:00', description: '订单已成功提交' },
    { status: 'confirmed', statusText: '订单确认', time: '2024-01-15 09:30:00', description: '客服已确认订单信息' },
    { status: 'assigned', statusText: '派单成功', time: '2024-01-15 10:00:00', description: '已为您安排李师傅上门服务' },
    { status: 'in_progress', statusText: '服务中', time: '2024-01-15 14:00:00', description: '师傅已到达，正在检修' }
  ]

  return {
    id: Number(route.params.id) || 1,
    orderNo: '202401150001',
    deviceType: '空调',
    deviceBrand: '格力',
    faultDescription: '空调不制冷，开机后只有风没有冷气，并且运行时有异响。已经使用了5年左右，之前没有维修过。',
    faultImages: [
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop'
    ],
    contactName: '张先生',
    contactPhone: '138****8000',
    address: '北京市朝阳区XX小区3号楼2单元501',
    appointmentTime: '2024-01-15 14:00:00',
    status: 'in_progress',
    statusText: '服务中',
    price: undefined,
    technician: {
      id: 1,
      name: '李师傅',
      phone: '139****6666',
      skills: ['空调维修', '冰箱维修', '洗衣机维修'],
      avatar: undefined
    },
    createdAt: '2024-01-15 09:00:00',
    updatedAt: '2024-01-15 14:00:00',
    progress
  }
}

async function handleCancel() {
  try {
    await ElMessageBox.confirm('确定要取消订单吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定取消',
      cancelButtonText: '再想想'
    })
  } catch {
    return
  }

  if (appStore.isDemoMode) {
    ElMessage.success('订单已取消')
    if (order.value) {
      order.value.status = 'cancelled'
    }
    return
  }

  try {
    await cancelOrder(order.value!.id)
    ElMessage.success('订单已取消')
    fetchOrderDetail()
  } catch (error) {
    // error handled by interceptor
  }
}

async function submitReschedule() {
  if (!newAppointmentTime.value) {
    ElMessage.warning('请选择新的预约时间')
    return
  }

  if (appStore.isDemoMode) {
    ElMessage.success('改约成功')
    if (order.value) {
      order.value.appointmentTime = newAppointmentTime.value
    }
    showReschedule.value = false
    return
  }

  try {
    await rescheduleOrder(order.value!.id, newAppointmentTime.value)
    ElMessage.success('改约成功')
    showReschedule.value = false
    fetchOrderDetail()
  } catch (error) {
    // error handled by interceptor
  }
}

async function submitReview() {
  if (!reviewForm.rating) {
    ElMessage.warning('请选择评分')
    return
  }

  if (appStore.isDemoMode) {
    ElMessage.success('评价提交成功')
    if (order.value) {
      order.value.rating = reviewForm.rating
      order.value.review = reviewForm.review
    }
    showReview.value = false
    return
  }

  try {
    await reviewOrder(order.value!.id, reviewForm.rating, reviewForm.review)
    ElMessage.success('评价提交成功')
    showReview.value = false
    fetchOrderDetail()
  } catch (error) {
    // error handled by interceptor
  }
}

function goCreateOrder() {
  router.push('/order/create')
}

onMounted(() => {
  fetchOrderDetail()
})
</script>

<style lang="scss" scoped>
.order-detail-page {
  .detail-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .status-card {
    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .status-info {
        .status-title {
          font-size: 24px;
          margin: 0 0 8px 0;
          color: #303133;
        }

        .status-desc {
          margin: 0;
          color: #909399;
        }
      }
    }
  }

  .info-card {
    margin-bottom: 20px;

    .card-title {
      font-weight: 600;
      font-size: 16px;
    }

    .info-item {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #f5f7fa;

      &:last-child {
        border-bottom: none;
      }

      .label {
        width: 100px;
        color: #909399;
        flex-shrink: 0;
      }

      .value {
        flex: 1;
        color: #303133;
        word-break: break-all;
      }
    }

    .image-list {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;

      .fault-image {
        width: 100px;
        height: 100px;
        border-radius: 6px;
        cursor: pointer;
      }
    }
  }

  .technician-info {
    display: flex;
    gap: 16px;
    align-items: center;

    .tech-details {
      h3 {
        margin: 0 0 6px 0;
        font-size: 18px;
      }

      .tech-phone {
        margin: 0 0 8px 0;
        color: #606266;
      }

      .tech-skills {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
    }
  }

  .price-card {
    margin-bottom: 20px;

    .card-title {
      font-weight: 600;
      font-size: 16px;
    }

    .price-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      color: #606266;
    }

    .price-divider {
      border-top: 1px dashed #ebeef5;
      margin: 12px 0;
    }

    .price-total {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .total-price {
        color: #f56c6c;
        font-size: 24px;
        font-weight: 700;
      }
    }
  }

  .action-card {
    margin-bottom: 20px;

    .card-title {
      font-weight: 600;
      font-size: 16px;
    }

    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .el-button {
        width: 100%;
      }
    }
  }

  .review-card {
    .card-title {
      font-weight: 600;
      font-size: 16px;
    }

    .review-content {
      .review-text {
        margin-top: 10px;
        color: #606266;
        line-height: 1.6;
      }
    }
  }
}

@media (max-width: 900px) {
  .order-detail-page {
    :deep(.el-col) {
      margin-bottom: 20px;
    }
  }
}
</style>
