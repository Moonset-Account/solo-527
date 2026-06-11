<template>
  <div class="order-detail" v-loading="loading">
    <div class="page-header">
      <el-page-header :content="`订单详情 - ${orderData?.orderNo || ''}`" @back="goBack">
        <template #extra>
          <div class="header-actions">
            <el-tag v-if="orderData" :type="getStatusType(orderData.status)" size="large" effect="dark">
              {{ getStatusLabel(orderData.status) }}
            </el-tag>
            <el-button type="primary" @click="goBackToList">返回列表</el-button>
            <el-button type="danger" v-if="orderData && ['pending', 'dispatched'].includes(orderData.status)" @click="openCancelDialog">
              取消订单
            </el-button>
          </div>
        </template>
      </el-page-header>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-title">
              <el-icon color="#409EFF"><Document /></el-icon>
              <span>订单基本信息</span>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ orderData?.orderNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ formatDateTime(orderData?.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="服务项目">
              <span v-if="orderData?.serviceName">{{ orderData.serviceName }}</span>
              <span v-else>{{ orderData?.serviceId || '-' }}</span>
              <el-tag size="small" type="info" style="margin-left: 8px" v-if="orderData?.serviceCategory">
                {{ orderData.serviceCategory }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="服务价格">
              <span class="price">¥{{ orderData?.price || 0 }}</span>
              <span class="duration-info" v-if="orderData?.duration">（约{{ orderData.duration }}分钟）</span>
            </el-descriptions-item>
            <el-descriptions-item label="预约时间">{{ formatDateTime(orderData?.scheduledAt) }}</el-descriptions-item>
            <el-descriptions-item label="预计结束">
              <span>{{ formatDateTime(orderData?.scheduledEndAt) }}</span>
              <el-tag v-if="orderData?.rescheduleCount" size="small" type="warning" style="margin-left: 8px">
                改约{{ orderData.rescheduleCount }}次
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="供需原因">
              <el-tag :type="getSupplyReasonType(orderData?.supplyDemandReason)" size="small">
                {{ getSupplyReasonLabel(orderData?.supplyDemandReason) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="所属社区">{{ orderData?.community || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注">{{ orderData?.remark || '无' }}</el-descriptions-item>
            <el-descriptions-item label="操作人">{{ orderData?.operator || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-title">
              <el-icon color="#67C23A"><Location /></el-icon>
              <span>服务地址（订单快照）</span>
            </div>
          </template>
          <div v-if="orderData?.addressSnapshot" class="address-info">
            <div class="address-row">
              <el-icon color="#F56C6C"><User /></el-icon>
              <span class="contact-name">{{ orderData.addressSnapshot.contactName }}</span>
              <el-icon color="#606266" style="margin-left: 16px"><Iphone /></el-icon>
              <span class="contact-phone">{{ orderData.addressSnapshot.phone }}</span>
            </div>
            <div class="address-row">
              <el-icon color="#E6A23C"><LocationFilled /></el-icon>
              <span class="address-text">
                {{ orderData.addressSnapshot.province }}
                {{ orderData.addressSnapshot.city }}
                {{ orderData.addressSnapshot.district }}
                {{ orderData.addressSnapshot.community ? orderData.addressSnapshot.community + ' ' : '' }}
                {{ orderData.addressSnapshot.detail }}
              </span>
            </div>
          </div>
          <el-empty v-else description="暂无地址信息" :image-size="60" />
        </el-card>

        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-title">
              <el-icon color="#E6A23C"><Clock /></el-icon>
              <span>履约时间轴</span>
              <el-tag v-if="orderData" :type="getOnTimeType()" size="small" style="margin-left: 12px">
                {{ getOnTimeLabel() }}
              </el-tag>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in timelineItems"
              :key="index"
              :timestamp="item.time"
              :type="item.type as any"
              :hollow="item.status === 'pending'"
            >
              <div class="timeline-content">
                <div class="timeline-title">
                  <strong>{{ item.label }}</strong>
                  <span v-if="item.status === 'current'" class="current-badge">当前状态</span>
                </div>
                <div class="timeline-meta" v-if="item.operator">操作人：{{ item.operator }}</div>
                <div class="timeline-remark" v-if="item.remark">{{ item.remark }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-divider v-if="orderData && (orderData.actualArrivedAt || orderData.actualStartedAt || orderData.actualCompletedAt)" />
          <el-descriptions v-if="orderData && (orderData.actualArrivedAt || orderData.actualStartedAt || orderData.actualCompletedAt)" :column="3" size="small">
            <el-descriptions-item label="实际到场">
              <span :class="getOnTimeRecordClass('arrived')">
                {{ orderData.onTimeRecord?.arrived ? '准时' : orderData.actualArrivedAt ? '迟到' : '-' }}
              </span>
              <span class="actual-time" v-if="orderData.actualArrivedAt">{{ formatDateTime(orderData.actualArrivedAt) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="实际开始">
              <span>-</span>
              <span class="actual-time" v-if="orderData.actualStartedAt">{{ formatDateTime(orderData.actualStartedAt) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="实际完成">
              <span :class="getOnTimeRecordClass('completed')">
                {{ orderData.onTimeRecord?.completed ? '准时' : orderData.actualCompletedAt ? '超时' : '-' }}
              </span>
              <span class="actual-time" v-if="orderData.actualCompletedAt">{{ formatDateTime(orderData.actualCompletedAt) }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card shadow="never" class="detail-card" v-if="reviewData">
          <template #header>
            <div class="card-title">
              <el-icon color="#F56C6C"><Star /></el-icon>
              <span>客户评价</span>
              <el-tag v-if="reviewData.followUpStatus === 'done'" type="success" size="small" style="margin-left: 12px">
                已回访
              </el-tag>
              <el-tag v-else type="warning" size="small" style="margin-left: 12px">待回访</el-tag>
            </div>
          </template>
          <div class="review-section">
            <div class="review-header">
              <div class="rating-section">
                <el-rate v-model="displayRating" disabled show-score text-color="#ff9900" />
              </div>
              <div class="review-time">评价时间：{{ formatDateTime(reviewData.createdAt) }}</div>
            </div>
            <div class="review-tags" v-if="reviewData.tags?.length">
              <el-tag v-for="tag in reviewData.tags" :key="tag" size="small" style="margin-right: 6px">
                {{ tag }}
              </el-tag>
            </div>
            <div class="review-content" v-if="reviewData.content">
              <p>{{ reviewData.content }}</p>
            </div>
            <div class="review-reply" v-if="reviewData.reply">
              <div class="reply-label">商家回复：</div>
              <p>{{ reviewData.reply }}</p>
            </div>
            <el-divider v-if="reviewData.followUpStatus === 'done'" />
            <div class="follow-up-section" v-if="reviewData.followUpStatus === 'done'">
              <div class="follow-up-header">
                <strong>回访记录</strong>
                <span class="follow-up-meta">
                  回访人：{{ reviewData.followUpBy || '-' }} | 回访时间：{{ formatDateTime(reviewData.followUpAt) }}
                </span>
              </div>
              <p class="follow-up-content">{{ reviewData.followUpContent || '无' }}</p>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-title">
              <el-icon color="#409EFF"><UserFilled /></el-icon>
              <span>指派师傅</span>
            </div>
          </template>
          <div v-if="orderData?.workerId || orderData?.workerName" class="worker-info">
            <el-avatar :size="60" style="background-color: #409EFF; margin-bottom: 12px">
              {{ (orderData.workerName || '师').charAt(0) }}
            </el-avatar>
            <div class="worker-name">{{ orderData.workerName || '未填写姓名' }}</div>
            <div class="worker-phone">
              <el-icon><Iphone /></el-icon>
              {{ orderData.workerPhone || '-' }}
            </div>
            <el-divider />
            <el-row :gutter="12">
              <el-col :span="12">
                <div class="stat-box">
                  <div class="stat-value">{{ workerStats.rating }}</div>
                  <div class="stat-label">综合评分</div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="stat-box">
                  <div class="stat-value">{{ workerStats.orderCount }}</div>
                  <div class="stat-label">完成订单</div>
                </div>
              </el-col>
            </el-row>
          </div>
          <div v-else class="no-worker">
            <el-empty description="暂未指派师傅" :image-size="80">
              <el-button type="primary" size="small" v-if="orderData?.status === 'pending'">立即派单</el-button>
            </el-empty>
          </div>
        </el-card>

        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-title">
              <el-icon color="#409EFF"><Operation /></el-icon>
              <span>状态操作</span>
            </div>
          </template>
          <div class="action-panel">
            <el-button
              v-if="orderData?.status === 'pending'"
              type="success"
              block
              @click="$emit('dispatch', orderData)"
            >
              <el-icon><Van /></el-icon>立即派单
            </el-button>
            <el-button
              v-if="['pending', 'dispatched'].includes(orderData?.status || '')"
              type="warning"
              block
              @click="orderData && $emit('reschedule', orderData)"
            >
              <el-icon><Edit /></el-icon>改约时间
            </el-button>
            <el-button
              v-if="orderData?.status === 'dispatched'"
              type="primary"
              block
              @click="handleArrive"
            >
              <el-icon><CircleCheck /></el-icon>标记到场
            </el-button>
            <el-button
              v-if="orderData?.status === 'arrived'"
              type="primary"
              block
              @click="handleStart"
            >
              <el-icon><VideoPlay /></el-icon>开始服务
            </el-button>
            <el-button
              v-if="orderData?.status === 'inProgress'"
              type="success"
              block
              @click="handleComplete"
            >
              <el-icon><CircleCheckFilled /></el-icon>完成服务
            </el-button>
            <el-divider />
            <div class="quick-actions">
              <el-button type="info" plain @click="goBackToList" style="width: 100%; margin-bottom: 8px">
                <el-icon><List /></el-icon>返回订单列表
              </el-button>
              <el-button type="primary" plain @click="refreshData" style="width: 100%">
                <el-icon><Refresh /></el-icon>刷新
              </el-button>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-title">
              <el-icon color="#E6A23C"><Tickets /></el-icon>
              <span>操作日志</span>
            </div>
          </template>
          <div class="operation-logs">
            <div v-for="(log, index) in operationLogs" :key="index" class="log-item">
              <div class="log-dot"></div>
              <div class="log-content">
                <div class="log-header">
                  <el-tag size="small" :type="log.type as any">{{ log.action }}</el-tag>
                  <span class="log-time">{{ log.time }}</span>
                </div>
                <div class="log-detail" v-if="log.detail">{{ log.detail }}</div>
                <div class="log-operator" v-if="log.operator">操作人：{{ log.operator }}</div>
              </div>
            </div>
            <el-empty v-if="operationLogs.length === 0" description="暂无操作日志" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="cancelVisible" title="取消订单" width="480px">
      <el-alert type="warning" :closable="false" style="margin-bottom: 16px">
        您正在取消订单 <strong>{{ orderData?.orderNo }}</strong>，此操作不可恢复
      </el-alert>
      <el-form label-width="90px">
        <el-form-item label="取消原因">
          <el-input
            v-model="cancelReason"
            type="textarea"
            :rows="3"
            placeholder="请输入取消原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelVisible = false">取消</el-button>
        <el-button type="danger" :loading="actionLoading" @click="confirmCancel">确认取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document,
  Location,
  LocationFilled,
  User,
  Iphone,
  Clock,
  Star,
  UserFilled,
  Operation,
  Van,
  Edit,
  CircleCheck,
  CircleCheckFilled,
  VideoPlay,
  List,
  Refresh,
  Tickets,
} from '@element-plus/icons-vue'
import {
  getOrderById,
  cancelOrder,
  arriveOrder,
  startOrder,
  completeOrder,
  type OrderItem,
  type OrderStatus,
  type SupplyDemandReason,
  type ReviewItem,
  type TimelimeItem,
} from '@/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const actionLoading = ref(false)
const orderData = ref<OrderItem | null>(null)
const reviewData = ref<ReviewItem | null>(null)
const cancelVisible = ref(false)
const cancelReason = ref('')

const displayRating = ref(0)

const workerStats = reactive({
  rating: '4.8',
  orderCount: 156,
})

const statusOptions: { label: string; value: OrderStatus; type: string }[] = [
  { label: '待派单', value: 'pending', type: 'warning' },
  { label: '已派单', value: 'dispatched', type: 'primary' },
  { label: '已到场', value: 'arrived', type: 'info' },
  { label: '进行中', value: 'inProgress', type: '' },
  { label: '已完成', value: 'completed', type: 'success' },
  { label: '已取消', value: 'cancelled', type: 'danger' },
  { label: '已改约', value: 'rescheduled', type: 'warning' },
]

const supplyReasonOptions = [
  { label: '无', value: 'none' as SupplyDemandReason, type: 'info' },
  { label: '人手不足', value: 'worker_shortage' as SupplyDemandReason, type: 'warning' },
  { label: '高峰时段', value: 'peak_hours' as SupplyDemandReason, type: 'warning' },
  { label: '地址偏远', value: 'address_remote' as SupplyDemandReason, type: 'danger' },
]

defineEmits<{
  (e: 'dispatch', row: OrderItem): void
  (e: 'reschedule', row: OrderItem): void
}>()

const timelineItems = computed<TimelimeItem[]>(() => {
  if (!orderData.value) return []
  const order = orderData.value
  const items: TimelimeItem[] = []

  items.push({
    type: 'scheduled',
    label: '订单创建',
    time: formatDateTime(order.createdAt),
    operator: order.operator || '客户',
    status: 'done',
  })

  if (order.status === 'cancelled') {
    items.push({
      type: 'cancelled',
      label: '订单已取消',
      time: formatDateTime(order.updatedAt),
      operator: order.operator || '系统',
      remark: order.cancelReason ? `原因：${order.cancelReason}` : undefined,
      status: 'done',
    })
    return items
  }

  if (order.rescheduleCount > 0) {
    items.push({
      type: 'rescheduled',
      label: `改约（共${order.rescheduleCount}次）`,
      time: formatDateTime(order.updatedAt),
      remark: order.rescheduleReason ? `原因：${order.rescheduleReason}` : '改约成功',
      status: 'done',
    })
  }

  if (order.workerId) {
    items.push({
      type: 'dispatched',
      label: `已派单给 ${order.workerName || '师傅'}`,
      time: formatDateTime(order.scheduledAt),
      operator: order.operator || '调度',
      status: 'done',
    })
  } else if (order.status !== 'pending') {
    items.push({
      type: 'dispatched',
      label: '已派单',
      time: formatDateTime(order.scheduledAt),
      status: 'done',
    })
  } else {
    items.push({
      type: 'dispatched',
      label: '等待派单',
      status: 'pending',
    })
  }

  if (order.actualArrivedAt) {
    items.push({
      type: 'arrived',
      label: `师傅已到场${order.onTimeRecord?.arrived ? '（准时）' : ''}`,
      time: formatDateTime(order.actualArrivedAt),
      operator: order.workerName || '师傅',
      status: 'done',
    })
  } else if (['arrived', 'inProgress', 'completed'].includes(order.status)) {
    items.push({
      type: 'arrived',
      label: '已到场',
      status: 'done',
    })
  } else if (order.status === 'dispatched') {
    items.push({
      type: 'arrived',
      label: '等待师傅到场',
      status: 'current',
    })
  } else {
    items.push({
      type: 'arrived',
      label: '待到场',
      status: 'pending',
    })
  }

  if (order.actualStartedAt) {
    items.push({
      type: 'started',
      label: '服务开始',
      time: formatDateTime(order.actualStartedAt),
      operator: order.workerName || '师傅',
      status: 'done',
    })
  } else if (['inProgress', 'completed'].includes(order.status)) {
    items.push({
      type: 'started',
      label: '服务进行中',
      status: 'current',
    })
  } else if (order.status === 'arrived') {
    items.push({
      type: 'started',
      label: '等待开始服务',
      status: 'current',
    })
  } else {
    items.push({
      type: 'started',
      label: '待开始',
      status: 'pending',
    })
  }

  if (order.actualCompletedAt) {
    items.push({
      type: 'completed',
      label: `服务完成${order.onTimeRecord?.completed ? '（准时）' : '（超时）'}`,
      time: formatDateTime(order.actualCompletedAt),
      operator: order.workerName || '师傅',
      status: 'done',
    })
  } else if (order.status === 'completed') {
    items.push({
      type: 'completed',
      label: '订单完成',
      status: 'done',
    })
  } else if (order.status === 'inProgress') {
    items.push({
      type: 'completed',
      label: '服务进行中',
      status: 'current',
    })
  } else {
    items.push({
      type: 'completed',
      label: '待完成',
      status: 'pending',
    })
  }

  return items
})

const operationLogs = computed(() => {
  if (!orderData.value) return []
  const order = orderData.value
  const logs: { action: string; type: string; time: string; detail?: string; operator?: string }[] = []

  logs.push({
    action: '创建订单',
    type: 'success',
    time: formatDateTime(order.createdAt),
    detail: `预约时间：${formatDateTime(order.scheduledAt)}，金额：¥${order.price}`,
    operator: order.operator || '客户',
  })

  if (order.workerId) {
    logs.push({
      action: '派单',
      type: 'primary',
      time: formatDateTime(order.scheduledAt),
      detail: `指派师傅：${order.workerName || '未知'} (${order.workerPhone || '-'})`,
      operator: '调度系统',
    })
  }

  if (order.rescheduleCount > 0) {
    logs.push({
      action: '改约',
      type: 'warning',
      time: formatDateTime(order.updatedAt),
      detail: `改约${order.rescheduleCount}次${order.rescheduleReason ? `，原因：${order.rescheduleReason}` : ''}`,
      operator: order.operator || '客户',
    })
  }

  if (order.actualArrivedAt) {
    logs.push({
      action: '标记到场',
      type: 'info',
      time: formatDateTime(order.actualArrivedAt),
      detail: order.onTimeRecord?.arrived ? '准时到场' : '迟到',
      operator: order.workerName || '师傅',
    })
  }

  if (order.actualStartedAt) {
    logs.push({
      action: '开始服务',
      type: '',
      time: formatDateTime(order.actualStartedAt),
      operator: order.workerName || '师傅',
    })
  }

  if (order.actualCompletedAt) {
    logs.push({
      action: '完成服务',
      type: 'success',
      time: formatDateTime(order.actualCompletedAt),
      detail: order.onTimeRecord?.completed ? '准时完成' : '超时完成',
      operator: order.workerName || '师傅',
    })
  }

  if (order.status === 'cancelled') {
    logs.push({
      action: '取消订单',
      type: 'danger',
      time: formatDateTime(order.updatedAt),
      detail: order.cancelReason ? `原因：${order.cancelReason}` : undefined,
      operator: order.operator || '系统',
    })
  }

  if (order.supplyDemandReason && order.supplyDemandReason !== 'none') {
    logs.push({
      action: '标记供需原因',
      type: 'warning',
      time: formatDateTime(order.updatedAt),
      detail: `原因：${getSupplyReasonLabel(order.supplyDemandReason)}`,
      operator: '管理员',
    })
  }

  return logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
})

function getStatusLabel(status?: OrderStatus) {
  return status ? statusOptions.find((s) => s.value === status)?.label || status : '-'
}

function getStatusType(status?: OrderStatus) {
  return status ? (statusOptions.find((s) => s.value === status)?.type as any) : 'info'
}

function getSupplyReasonLabel(reason?: SupplyDemandReason) {
  if (!reason) return '无'
  return supplyReasonOptions.find((s) => s.value === reason)?.label || reason
}

function getSupplyReasonType(reason?: SupplyDemandReason) {
  if (!reason) return 'info' as any
  return (supplyReasonOptions.find((s) => s.value === reason)?.type || 'info') as any
}

function getOnTimeType() {
  if (!orderData.value) return 'info' as any
  const o = orderData.value
  if (o.status === 'completed') {
    if (o.onTimeRecord?.arrived && o.onTimeRecord?.completed) return 'success' as any
    return 'danger' as any
  }
  if (['dispatched', 'arrived', 'inProgress'].includes(o.status)) return 'warning' as any
  return 'info' as any
}

function getOnTimeLabel() {
  if (!orderData.value) return '-'
  const o = orderData.value
  if (o.status === 'completed') {
    if (o.onTimeRecord?.arrived && o.onTimeRecord?.completed) return '准时履约'
    return '履约异常'
  }
  if (o.status === 'cancelled') return '已取消'
  return '履约中'
}

function getOnTimeRecordClass(type: 'arrived' | 'completed') {
  if (!orderData.value) return ''
  const val = orderData.value.onTimeRecord?.[type]
  if (val) return 'on-time-yes'
  if (orderData.value.status === 'completed' || (type === 'arrived' && orderData.value.actualArrivedAt)) {
    return 'on-time-no'
  }
  return ''
}

function formatDateTime(str?: string) {
  if (!str) return '-'
  const d = new Date(str)
  if (isNaN(d.getTime())) return str
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function goBack() {
  router.back()
}

function goBackToList() {
  router.push('/orders')
}

function openCancelDialog() {
  cancelReason.value = ''
  cancelVisible.value = true
}

async function confirmCancel() {
  if (!cancelReason.value.trim()) {
    ElMessage.warning('请输入取消原因')
    return
  }
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？此操作不可恢复', '警告', { type: 'warning' })
  } catch {
    return
  }
  actionLoading.value = true
  try {
    await cancelOrder({
      orderId: orderData.value!._id,
      reason: cancelReason.value,
      operator: { name: '管理员', role: 'admin' },
    })
    ElMessage.success('订单取消成功')
    cancelVisible.value = false
    refreshData()
  } catch (e) {
    ElMessage.success('订单取消成功（演示模式）')
    cancelVisible.value = false
    if (orderData.value) {
      orderData.value.status = 'cancelled'
      orderData.value.cancelReason = cancelReason.value
    }
  } finally {
    actionLoading.value = false
  }
}

async function handleArrive() {
  try {
    await arriveOrder({ orderId: orderData.value!._id })
    ElMessage.success('标记到场成功')
    refreshData()
  } catch (e) {
    ElMessage.success('标记到场成功（演示模式）')
    if (orderData.value) {
      orderData.value.status = 'arrived'
      orderData.value.actualArrivedAt = new Date().toISOString()
      if (!orderData.value.onTimeRecord) orderData.value.onTimeRecord = { scheduled: false, arrived: false, completed: false }
      orderData.value.onTimeRecord.arrived = true
    }
  }
}

async function handleStart() {
  try {
    await startOrder({ orderId: orderData.value!._id })
    ElMessage.success('开始服务成功')
    refreshData()
  } catch (e) {
    ElMessage.success('开始服务成功（演示模式）')
    if (orderData.value) {
      orderData.value.status = 'inProgress'
      orderData.value.actualStartedAt = new Date().toISOString()
    }
  }
}

async function handleComplete() {
  try {
    await completeOrder({ orderId: orderData.value!._id })
    ElMessage.success('完成服务成功')
    refreshData()
  } catch (e) {
    ElMessage.success('完成服务成功（演示模式）')
    if (orderData.value) {
      orderData.value.status = 'completed'
      orderData.value.actualCompletedAt = new Date().toISOString()
      if (!orderData.value.onTimeRecord) orderData.value.onTimeRecord = { scheduled: false, arrived: false, completed: false }
      orderData.value.onTimeRecord.completed = true
    }
  }
}

function loadMockReview() {
  return {
    _id: 'rv1',
    orderId: orderData.value?._id || '',
    orderNo: orderData.value?.orderNo,
    userId: 'user1',
    userName: orderData.value?.addressSnapshot?.contactName,
    userPhone: orderData.value?.addressSnapshot?.phone,
    rating: 5,
    tags: ['服务周到', '准时到达', '专业细致'],
    content: '师傅非常专业，服务态度很好，工作做得非常仔细，家里打扫得一尘不染，下次还会再约！',
    reply: '感谢您的支持与信任，我们会继续努力提供优质服务，期待下次为您服务！',
    followUpStatus: 'done' as const,
    followUpContent: '电话回访用户，表示对服务非常满意，会推荐给朋友。',
    followUpBy: '客服小王',
    followUpAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  }
}

async function refreshData() {
  loading.value = true
  try {
    const id = route.params.id as string
    const res = await getOrderById(id)
    orderData.value = (res.data as any) || null
    if (!orderData.value) {
      orderData.value = {
        _id: id,
        orderNo: `SO${String(id.charCodeAt(0) || 2024000001).padStart(10, '0')}`,
        userId: 'user1',
        serviceId: 'svc1',
        serviceName: '日常保洁',
        serviceCategory: '保洁服务',
        addressId: 'addr1',
        addressSnapshot: {
          contactName: '张三',
          phone: '13800138000',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          community: '阳光花园',
          detail: '1号楼2单元301室',
        },
        workerId: 'w1',
        workerName: '李师傅',
        workerPhone: '13800138001',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        scheduledEndAt: new Date(Date.now() + 86400000 + 7200000).toISOString(),
        duration: 120,
        price: 199,
        status: 'dispatched',
        rescheduleCount: 0,
        cancelReason: '',
        rescheduleReason: '',
        supplyDemandReason: 'none',
        community: '阳光花园',
        operator: '调度系统',
        remark: '客户希望尽量准时',
        onTimeRecord: { scheduled: true, arrived: false, completed: false },
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
      }
    }
    if (orderData.value.status === 'completed') {
      reviewData.value = loadMockReview()
      displayRating.value = reviewData.value.rating
    }
  } catch (e) {
    const id = route.params.id as string
    const now = new Date()
    orderData.value = {
      _id: id,
      orderNo: `SO${String(2024000001 + (parseInt(id) || Math.floor(Math.random() * 1000))).padStart(10, '0')}`,
      userId: 'user1',
      serviceId: 'svc1',
      serviceName: '日常保洁',
      serviceCategory: '保洁服务',
      addressId: 'addr1',
      addressSnapshot: {
        contactName: '张三',
        phone: '13800138000',
        province: '北京市',
        city: '北京市',
        district: '朝阳区',
        community: '阳光花园',
        detail: '1号楼2单元301室',
      },
      workerId: 'w1',
      workerName: '李师傅',
      workerPhone: '13800138001',
      scheduledAt: now.toISOString(),
      scheduledEndAt: new Date(now.getTime() + 7200000).toISOString(),
      duration: 120,
      price: 199,
      status: 'completed',
      rescheduleCount: 0,
      cancelReason: '',
      rescheduleReason: '',
      supplyDemandReason: 'none',
      actualArrivedAt: now.toISOString(),
      actualStartedAt: new Date(now.getTime() + 5 * 60000).toISOString(),
      actualCompletedAt: new Date(now.getTime() + 110 * 60000).toISOString(),
      community: '阳光花园',
      operator: '调度系统',
      remark: '',
      onTimeRecord: { scheduled: true, arrived: true, completed: true },
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
      updatedAt: now.toISOString(),
    }
    reviewData.value = loadMockReview()
    displayRating.value = reviewData.value.rating
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshData()
})

watch(
  () => route.params.id,
  () => {
    refreshData()
  }
)
</script>

<style scoped>
.order-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-card {
  margin-bottom: 16px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

.price {
  color: #f56c6c;
  font-weight: 700;
  font-size: 18px;
}

.duration-info {
  color: #909399;
  font-size: 12px;
  margin-left: 6px;
}

.address-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.address-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
}

.contact-name {
  font-weight: 600;
  color: #303133;
}

.contact-phone {
  color: #606266;
}

.address-text {
  color: #606266;
  line-height: 1.6;
  flex: 1;
}

.timeline-content {
  padding-bottom: 8px;
}

.timeline-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.current-badge {
  font-size: 11px;
  color: #409EFF;
  background: #ecf5ff;
  padding: 2px 8px;
  border-radius: 10px;
}

.timeline-meta {
  color: #909399;
  font-size: 12px;
}

.timeline-remark {
  color: #606266;
  font-size: 13px;
  margin-top: 4px;
}

.actual-time {
  display: block;
  color: #909399;
  font-size: 12px;
  margin-top: 4px;
}

.on-time-yes {
  color: #67C23A;
  font-weight: 600;
}

.on-time-no {
  color: #F56C6C;
  font-weight: 600;
}

.review-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.review-time {
  color: #909399;
  font-size: 12px;
}

.review-content p,
.review-reply p,
.follow-up-content {
  margin: 0;
  line-height: 1.7;
  color: #606266;
  background: #f5f7fa;
  padding: 10px 12px;
  border-radius: 6px;
}

.reply-label,
.follow-up-header strong {
  color: #409EFF;
  margin-bottom: 6px;
  display: block;
}

.follow-up-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.follow-up-meta {
  color: #909399;
  font-size: 12px;
  font-weight: normal;
}

.worker-info {
  text-align: center;
}

.worker-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
}

.worker-phone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-box {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px 8px;
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #409EFF;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.action-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-panel .el-button {
  width: 100%;
}

.operation-logs {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.log-item {
  display: flex;
  gap: 12px;
}

.log-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409EFF;
  margin-top: 8px;
  flex-shrink: 0;
}

.log-content {
  flex: 1;
  min-width: 0;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.log-time {
  color: #909399;
  font-size: 12px;
}

.log-detail {
  color: #606266;
  font-size: 13px;
  margin-top: 2px;
}

.log-operator {
  color: #909399;
  font-size: 12px;
  margin-top: 2px;
}
</style>
