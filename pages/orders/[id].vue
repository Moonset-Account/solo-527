<template>
  <div class="order-detail-page" v-if="order">
    <div class="page-header">
      <h2>
        <button class="btn btn-text" @click="goBack">← 返回</button>
        订单详情 - {{ order.orderNo }}
      </h2>
      <div class="header-actions">
        <StatusTag :type="getStatusTag(order.status)">
          {{ getStatusLabel(order.status) }}
        </StatusTag>
        <button
          v-if="order.status === 'PENDING_ACCEPT'"
          class="btn btn-primary"
          @click="handleAccept"
        >
          接单
        </button>
        <button
          v-if="order.status === 'ACCEPTED' || order.status === 'ASSIGNED'"
          class="btn btn-success"
          @click="showAssignModal = true"
        >
          分派骑手
        </button>
      </div>
    </div>

    <div class="detail-grid">
      <div class="detail-card">
        <div class="card-title">基本信息</div>
        <div class="info-row">
          <span class="label">订单号</span>
          <span class="value">{{ order.orderNo }}</span>
        </div>
        <div class="info-row">
          <span class="label">订单类型</span>
          <span class="value">
          <StatusTag :type="getOrderTypeTag(order.orderType)">
            {{ getOrderTypeLabel(order.orderType) }}
          </StatusTag>
        </span>
        </div>
        <div class="info-row">
          <span class="label">优先级</span>
          <span class="value">
          <StatusTag :type="getPriorityTag(order.priority)">
            {{ getPriorityLabel(order.priority) }}
          </StatusTag>
        </span>
        </div>
        <div class="info-row">
          <span class="label">客户</span>
          <span class="value">{{ order.customer?.companyName || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">骑手</span>
          <span class="value">{{ order.rider?.realName || '-' }}
            <span v-if="order.rider" class="text-secondary text-sm">
              ({{ order.rider.riderNo }})
            </span>
          </span>
        </div>
        <div class="info-row">
          <span class="label">调度员</span>
          <span class="value">{{ order.dispatcher?.realName || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">来源单号</span>
          <span class="value">{{ order.sourceOrderNo || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">创建时间</span>
          <span class="value">{{ formatDate(order.createdAt) }}</span>
        </div>
      </div>

      <div class="detail-card">
        <div class="card-title">货物信息</div>
        <div class="info-row">
          <span class="label">货物描述</span>
          <span class="value">{{ order.goodsDesc || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">货物重量</span>
          <span class="value">{{ order.goodsWeight || '-' }} kg</span>
        </div>
        <div class="info-row">
          <span class="label">货物体积</span>
          <span class="value">{{ order.goodsVolume || '-' }} m³</span>
        </div>
        <div class="info-row" v-if="order.temperatureRequired">
          <span class="label">温控要求</span>
          <span class="value text-primary">
            {{ order.minTemp }}°C ~ {{ order.maxTemp }}°C
          </span>
        </div>
        <div class="info-row">
          <span class="label">距离</span>
          <span class="value">{{ formatDistance(order.distanceMeters) }}</span>
        </div>
        <div class="info-row">
          <span class="label">预计耗时</span>
          <span class="value">{{ formatDuration(order.estimatedMinutes) }}</span>
        </div>
        <div class="info-row">
          <span class="label">费用金额</span>
          <span class="value text-primary">{{ formatMoney(order.feeAmount) }}</span>
        </div>
        <div class="info-row">
          <span class="label">实付金额</span>
          <span class="value">{{ formatMoney(order.payAmount) }}</span>
        </div>
      </div>

      <div class="detail-card full-width">
        <div class="card-title">取送货信息</div>
        <div class="address-info">
          <div class="address-block pickup">
            <div class="address-icon">📦</div>
            <div class="address-detail">
              <div class="address-title">取货地址</div>
              <div class="address-text">{{ order.pickupAddress }}</div>
              <div class="address-contact">
                联系人：{{ order.pickupContact }} · {{ order.pickupPhone }}
              </div>
              <div class="address-time">
                时间窗：{{ formatDate(order.pickupEarliest, 'MM-DD HH:mm') }} ~ {{ formatDate(order.pickupLatest, 'HH:mm') }}
              </div>
            </div>
          </div>
          <div class="address-arrow">→</div>
          <div class="address-block delivery">
            <div class="address-icon">🏠</div>
            <div class="address-detail">
              <div class="address-title">送货地址</div>
              <div class="address-text">{{ order.deliveryAddress }}</div>
              <div class="address-contact">
                联系人：{{ order.deliveryContact }} · {{ order.deliveryPhone }}
              </div>
              <div class="address-time">
                时间窗：{{ formatDate(order.deliveryEarliest, 'MM-DD HH:mm') }} ~ {{ formatDate(order.deliveryLatest, 'HH:mm') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="detail-card">
        <div class="card-title">时效节点</div>
        <div class="timeline-section">
          <div class="time-node">
            <span class="node-label">取货时间</span>
            <span class="node-value">{{ order.actualPickupAt ? formatDate(order.actualPickupAt) : '-' }}</span>
          </div>
          <div class="time-node">
            <span class="node-label">开始配送</span>
            <span class="node-value">{{ order.inTransitAt ? formatDate(order.inTransitAt) : '-' }}</span>
          </div>
          <div class="time-node">
            <span class="node-label">到达时间</span>
            <span class="node-value">{{ order.actualArrivedAt ? formatDate(order.actualArrivedAt) : '-' }}</span>
          </div>
          <div class="time-node">
            <span class="node-label">送达时间</span>
            <span class="node-value">{{ order.actualDeliveredAt ? formatDate(order.actualDeliveredAt) : '-' }}</span>
          </div>
        </div>
      </div>

      <div class="detail-card">
        <div class="card-title">履约时效记录</div>
        <div class="timeline-list-small">
          <div
            v-for="(item, index) in order.timelines?.slice(0, 5)"
            :key="index"
            class="timeline-item-small"
          >
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-title">{{ getEventLabel(item.eventType) }}</div>
              <div class="timeline-time">{{ formatDate(item.createdAt) }}</div>
              <div v-if="item.remark" class="timeline-desc">{{ item.remark }}</div>
            </div>
          </div>
          <div v-if="!order.timelines?.length" class="empty">暂无时效记录</div>
        </div>
      </div>
    </div>

    <AppModal v-model:visible="showAssignModal" title="分派骑手" width="600px">
      <div class="assign-modal">
        <div class="form-item">
          <label>选择骑手</label>
          <select v-model="selectedRiderId">
            <option value="">请选择骑手</option>
            <option v-for="rider in availableRiders" :key="rider.id" :value="rider.id">
              {{ rider.realName }} ({{ rider.riderNo }}) - {{ getRiderStatusLabel(rider.status) }}
            </option>
          </select>
        </div>
        <div class="form-item">
          <label>分派原因</label>
          <textarea v-model="assignReason" placeholder="请输入分派原因（可选）"></textarea>
        </div>
      </div>
      <template #footer>
        <button class="btn btn-default" @click="showAssignModal = false">取消</button>
        <button class="btn btn-primary" @click="confirmAssign" :disabled="!selectedRiderId">确认分派</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const request = useRequest()

const { formatDate, formatMoney, formatDistance, formatDuration } = useFormatter()

const route = useRoute()
const order = ref<any>(null)
const showAssignModal = ref(false)
const selectedRiderId = ref('')
const assignReason = ref('')
const availableRiders = ref<any[]>([])

const loadOrder = async () => {
  try {
    const res: any = await request(`/orders/${route.params.id}`)
    if (res.code === 0) {
      order.value = res.data
    }
  } catch (e) {
    console.error('加载订单详情失败', e)
  }
}

const loadRiders = async () => {
  try {
    const res: any = await request('/riders', {
      query: { status: 'ONLINE,BUSY' }
    })
    if (res.code === 0) {
      availableRiders.value = res.data.list || []
    }
  } catch (e) {
    console.error('加载骑手列表失败', e)
  }
}

const goBack = () => {
  navigateTo('/orders')
}

const handleAccept = async () => {
  if (!confirm('确定要接单吗？')) return

  try {
    const res: any = await request(`/orders/${order.value.id}/accept`, {
      method: 'POST'
    })
    if (res.code === 0) {
      alert('接单成功')
      loadOrder()
    } else {
      alert(res.message || '接单失败')
    }
  } catch (e: any) {
    alert(e.data?.message || '接单失败')
  }
}

const handleAssign = () => {
  loadRiders()
  showAssignModal.value = true
}

const confirmAssign = async () => {
  if (!selectedRiderId.value) {
    alert('请选择骑手')
    return
  }

  try {
    const res: any = await request(`/dispatch/assign`, {
      method: 'POST',
      body: {
        orderId: order.value.id,
        riderId: selectedRiderId.value,
        reason: assignReason.value,
      }
    })
    if (res.code === 0) {
      alert('分派成功')
      showAssignModal.value = false
      loadOrder()
    } else {
      alert(res.message || '分派失败')
    }
  } catch (e: any) {
    alert(e.data?.message || '分派失败')
  }
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING_ACCEPT: '待接单',
    ACCEPTED: '已接单',
    ASSIGNED: '已分派',
    PICKED_UP: '已取货',
    IN_TRANSIT: '配送中',
    ARRIVED: '已到达',
    DELIVERED: '已送达',
    CANCELLED: '已取消',
    EXCEPTION: '异常',
  }
  return labels[status] || status
}

const getStatusTag = (status: string) => {
  const tags: Record<string, string> = {
    PENDING_ACCEPT: 'warning',
    ACCEPTED: 'primary',
    ASSIGNED: 'info',
    PICKED_UP: 'primary',
    IN_TRANSIT: 'primary',
    ARRIVED: 'info',
    DELIVERED: 'success',
    CANCELLED: 'default',
    EXCEPTION: 'danger',
  }
  return tags[status] || 'default'
}

const getOrderTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    NORMAL: '普通',
    URGENCY: '加急',
    COLD_CHAIN: '冷链',
    FRAGILE: '易碎',
  }
  return labels[type] || type
}

const getOrderTypeTag = (type: string) => {
  const tags: Record<string, string> = {
    NORMAL: 'default',
    URGENCY: 'warning',
    COLD_CHAIN: 'info',
    FRAGILE: 'danger',
  }
  return tags[type] || 'default'
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    LOW: '低',
    NORMAL: '普通',
    HIGH: '高',
    URGENT: '紧急',
  }
  return labels[priority] || priority
}

const getPriorityTag = (priority: string) => {
  const tags: Record<string, string> = {
    LOW: 'default',
    NORMAL: 'default',
    HIGH: 'warning',
    URGENT: 'danger',
  }
  return tags[priority] || 'default'
}

const getEventLabel = (event: string) => {
  const labels: Record<string, string> = {
    CREATE: '创建订单',
    ACCEPT: '接单',
    ASSIGN: '分派',
    PICKUP: '取货',
    IN_TRANSIT: '开始配送',
    ARRIVE: '到达',
    DELIVER: '送达',
    CANCEL: '取消',
    EXCEPTION: '异常',
    REASSIGN: '改派',
    ROUTE_CHANGE: '路线变更',
    TEMPERATURE_ALERT: '温度告警',
    NOTE: '备注',
  }
  return labels[event] || event
}

const getRiderStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    ONLINE: '在线',
    OFFLINE: '离线',
    BUSY: '忙碌',
    REST: '休息',
  }
  return labels[status] || status
}

onMounted(() => {
  loadOrder()
})
</script>

<style lang="scss" scoped>
.order-detail-page {
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .detail-card {
    background: #fff;
    border-radius: $border-radius;
    padding: 20px;
    box-shadow: $shadow-sm;

    &.full-width {
      grid-column: span 2;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid $border-light;
    }
  }

  .info-row {
    display: flex;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #fafafa;

    &:last-child {
      border-bottom: none;
    }

    .label {
      width: 100px;
      color: $text-secondary;
      font-size: 14px;
      flex-shrink: 0;
    }

    .value {
      flex: 1;
      color: $text-primary;
      font-size: 14px;
    }
  }

  .address-info {
    display: flex;
    align-items: stretch;
    gap: 20px;
  }

  .address-block {
    flex: 1;
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #fafafa;
    border-radius: 8px;

    &.pickup {
      border-left: 4px solid $primary;
    }

    &.delivery {
      border-left: 4px solid $success;
    }

    .address-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .address-detail {
      flex: 1;

      .address-title {
        font-size: 14px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 6px;
      }

      .address-text {
        font-size: 14px;
        color: $text-primary;
        margin-bottom: 6px;
      }

      .address-contact,
      .address-time {
        font-size: 12px;
        color: $text-secondary;
        margin-top: 4px;
      }
    }
  }

  .address-arrow {
    display: flex;
    align-items: center;
    font-size: 24px;
    color: $text-tertiary;
  }

  .timeline-section {
    .time-node {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #fafafa;

      &:last-child {
        border-bottom: none;
      }

      .node-label {
        color: $text-secondary;
        font-size: 13px;
      }

      .node-value {
        color: $text-primary;
        font-size: 13px;
        font-weight: 500;
      }
    }
  }

  .timeline-list-small {
    position: relative;
    padding-left: 20px;

    &::before {
      content: '';
      position: absolute;
      left: 5px;
      top: 4px;
      bottom: 4px;
      width: 2px;
      background: $border-light;
    }
  }

  .timeline-item-small {
    position: relative;
    padding-bottom: 12px;

    &:last-child {
      padding-bottom: 0;
    }

    .timeline-dot {
      position: absolute;
      left: -17px;
      top: 4px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: $primary;
    }

    .timeline-title {
      font-size: 13px;
      font-weight: 500;
      color: $text-primary;
    }

    .timeline-time {
      font-size: 11px;
      color: $text-tertiary;
      margin-top: 2px;
    }

    .timeline-desc {
      font-size: 12px;
      color: $text-secondary;
      margin-top: 4px;
    }
  }
}

.assign-modal {
  .form-item {
    margin-bottom: 16px;

    label {
      display: block;
      margin-bottom: 6px;
      color: $text-secondary;
      font-size: 13px;
    }

    select, textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid $border-color;
      border-radius: 4px;
    }

    textarea {
      min-height: 80px;
      resize: vertical;
    }
  }
}
</style>
