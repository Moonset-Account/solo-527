<template>
  <div class="dispatch-page">
    <div class="page-header">
      <h2>调度中心</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="loadData">
          🔄 刷新
        </button>
      </div>
    </div>

    <div class="dispatch-stats">
      <div class="stat-item">
        <span class="label">待分派</span>
        <span class="value text-warning">{{ stats.pending || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="label">已分派</span>
        <span class="value text-primary">{{ stats.assigned || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="label">配送中</span>
        <span class="value text-info">{{ stats.inTransit || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="label">在线骑手</span>
        <span class="value text-success">{{ stats.onlineRiders || 0 }}</span>
      </div>
    </div>

    <div class="dispatch-content">
      <div class="order-panel">
        <div class="panel-header">
          <h3>待处理订单</h3>
          <div class="tabs">
            <button
              v-for="tab in statusTabs"
              :key="tab.value"
              :class="['tab', { active: activeTab === tab.value }]"
              @click="activeTab = tab.value"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>
        <div class="order-list">
          <div
            v-for="order in orderList"
            :key="order.id"
            :class="['order-card', { selected: selectedOrder?.id === order.id }]"
            @click="selectOrder(order)"
          >
            <div class="order-header">
              <span class="order-no">{{ order.orderNo }}</span>
              <StatusTag :type="getStatusTag(order.status)">
                {{ getStatusLabel(order.status) }}
              </StatusTag>
            </div>
            <div class="order-body">
              <div class="order-info">
                <span class="label">客户：</span>
                <span class="value">{{ order.customer?.companyName || '-' }}</span>
              </div>
              <div class="order-info">
                <span class="label">骑手：</span>
                <span class="value">{{ order.rider?.realName || '未分派' }}</span>
              </div>
              <div class="order-address">
                <span class="icon">📦</span>
                <span class="text">{{ order.pickupAddress }}</span>
              </div>
              <div class="order-address">
                <span class="icon">🏠</span>
                <span class="text">{{ order.deliveryAddress }}</span>
              </div>
            </div>
            <div class="order-footer">
              <span class="time">{{ formatDate(order.createdAt, 'HH:mm') }}</span>
              <button
                v-if="order.status === 'ACCEPTED' || order.status === 'ASSIGNED'"
                class="btn btn-primary btn-sm"
                @click.stop="openAssignModal(order)"
              >
                {{ order.rider ? '改派' : '分派' }}
              </button>
            </div>
          </div>

          <div v-if="orderList.length === 0" class="empty">
            暂无订单
          </div>
        </div>

        <AppPagination
          v-model:page="pageInfo.page"
          v-model:page-size="pageInfo.pageSize"
          :total="pageInfo.total"
          @change="loadOrders"
        />
      </div>

      <div class="rider-panel">
        <div class="panel-header">
          <h3>在线骑手</h3>
          <button class="btn btn-text" @click="loadRiders">刷新</button>
        </div>
        <div class="rider-list">
          <div
            v-for="rider in riderList"
            :key="rider.id"
            :class="['rider-card', { selected: selectedRider?.id === rider.id }]"
            @click="selectRider(rider)"
          >
            <div class="rider-avatar">
              {{ rider.realName?.charAt(0) || 'R' }}
            </div>
            <div class="rider-info">
              <div class="rider-name">
                {{ rider.realName }}
                <StatusTag v-if="rider.status" :type="getRiderStatusTag(rider.status)" size="sm">
                  {{ getRiderStatusLabel(rider.status) }}
                </StatusTag>
              </div>
              <div class="rider-no">{{ rider.riderNo }}</div>
              <div class="rider-vehicle">{{ getVehicleTypeLabel(rider.vehicleType) }}</div>
            </div>
          </div>

          <div v-if="riderList.length === 0" class="empty">
            暂无在线骑手
          </div>
        </div>
      </div>
    </div>

    <AppModal v-model:visible="assignModalVisible" :title="assignModalTitle" width="500px">
      <div class="assign-form">
        <div class="form-item">
          <label>当前订单</label>
          <div class="order-info-display">
            {{ selectedOrder?.orderNo }} - {{ selectedOrder?.pickupAddress }}
          </div>
        </div>
        <div class="form-item">
          <label>选择骑手</label>
          <select v-model="selectedRiderId">
            <option value="">请选择骑手</option>
            <option v-for="rider in riderList" :key="rider.id" :value="String(rider.id)">
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
        <button class="btn btn-default" @click="assignModalVisible = false">取消</button>
        <button class="btn btn-primary" @click="confirmAssign" :disabled="!selectedRiderId">
          确认{{ selectedOrder?.rider ? '改派' : '分派' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'

const { formatDate } = useFormatter()
const { pageInfo, setTotal, reset } = usePagination(10)

const orderList = ref<any[]>([])
const riderList = ref<any[]>([])
const selectedOrder = ref<any>(null)
const selectedRider = ref<any>(null)
const activeTab = ref('all')
const stats = reactive({
  pending: 0,
  assigned: 0,
  inTransit: 0,
  onlineRiders: 0,
})

const assignModalVisible = ref(false)
const selectedRiderId = ref('')
const assignReason = ref('')

const statusTabs = [
  { label: '全部', value: 'all' },
  { label: '待分派', value: 'ACCEPTED' },
  { label: '已分派', value: 'ASSIGNED' },
  { label: '配送中', value: 'IN_TRANSIT' },
]

const assignModalTitle = computed(() => {
  return selectedOrder?.rider ? '改派骑手' : '分派骑手'
})

const loadOrders = async () => {
  try {
    const params: any = {
      page: pageInfo.page,
      pageSize: pageInfo.pageSize,
    }
    if (activeTab.value !== 'all') {
      params.status = activeTab.value
    }

    const res: any = await $fetch('/api/dispatch/orders', {
      query: params,
      headers: useRequestHeaders(['cookie'])
    })
    if (res.code === 0) {
      orderList.value = res.data.list
      setTotal(res.data.total)
    }
  } catch (e) {
    console.error('加载订单失败', e)
  }
}

const loadRiders = async () => {
  try {
    const res: any = await $fetch('/api/riders', {
      query: { status: 'ONLINE,BUSY,REST', pageSize: 50 },
      headers: useRequestHeaders(['cookie'])
    })
    if (res.code === 0) {
      riderList.value = res.data.list
      stats.onlineRiders = res.data.list.filter((r: any) => r.status === 'ONLINE').length
    }
  } catch (e) {
    console.error('加载骑手失败', e)
  }
}

const loadStats = async () => {
  try {
    const res: any = await $fetch('/api/dashboard/stats', {
      headers: useRequestHeaders(['cookie'])
    })
    if (res.code === 0) {
      stats.pending = res.data.pendingOrders
      stats.assigned = res.data.inTransitOrders
      stats.inTransit = res.data.inTransitOrders
    }
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

const loadData = () => {
  loadOrders()
  loadRiders()
  loadStats()
}

const selectOrder = (order: any) => {
  selectedOrder.value = order
}

const selectRider = (rider: any) => {
  selectedRider.value = rider
}

const openAssignModal = (order: any) => {
  selectedOrder.value = order
  selectedRiderId.value = order.riderId ? String(order.riderId) : ''
  assignReason.value = ''
  assignModalVisible.value = true
}

const confirmAssign = async () => {
  if (!selectedRiderId.value) {
    alert('请选择骑手')
    return
  }

  try {
    const res: any = await $fetch('/api/dispatch/assign', {
      method: 'POST',
      body: {
        orderId: selectedOrder.value.id,
        riderId: selectedRiderId.value,
        reason: assignReason.value,
      },
      headers: useRequestHeaders(['cookie'])
    })
    if (res.code === 0) {
      alert('操作成功')
      assignModalVisible.value = false
      loadOrders()
    } else {
      alert(res.message || '操作失败')
    }
  } catch (e: any) {
    alert(e.data?.message || '操作失败')
  }
}

watch(activeTab, () => {
  reset()
  loadOrders()
})

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

const getRiderStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    ONLINE: '在线',
    OFFLINE: '离线',
    BUSY: '忙碌',
    REST: '休息',
  }
  return labels[status] || status
}

const getRiderStatusTag = (status: string) => {
  const tags: Record<string, string> = {
    ONLINE: 'success',
    OFFLINE: 'default',
    BUSY: 'warning',
    REST: 'info',
  }
  return tags[status] || 'default'
}

const getVehicleTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    MOTORCYCLE: '摩托车',
    ELECTRIC_BIKE: '电动车',
    VAN: '面包车',
  }
  return labels[type] || type
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.dispatch-page {
  .dispatch-stats {
    display: flex;
    gap: 24px;
    padding: 16px 20px;
    background: #fff;
    border-radius: $border-radius;
    margin-bottom: 16px;

    .stat-item {
      display: flex;
      align-items: baseline;
      gap: 8px;

      .label {
        font-size: 14px;
        color: $text-secondary;
      }

      .value {
        font-size: 24px;
        font-weight: 700;
      }
    }
  }

  .dispatch-content {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 16px;
  }

  .order-panel,
  .rider-panel {
    background: #fff;
    border-radius: $border-radius;
    box-shadow: $shadow-sm;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 200px);
  }

  .panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid $border-light;
    display: flex;
    align-items: center;
    justify-content: space-between;

    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }

    .tabs {
      display: flex;
      gap: 4px;

      .tab {
        padding: 6px 12px;
        border: none;
        background: transparent;
        color: $text-secondary;
        font-size: 13px;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s;

        &.active {
          background: rgba($primary, 0.1);
          color: $primary;
          font-weight: 500;
        }

        &:hover {
          background: $bg-hover;
        }
      }
    }
  }

  .order-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .order-card {
    padding: 12px 16px;
    border: 1px solid $border-light;
    border-radius: 6px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: $primary;
      background: rgba($primary, 0.02);
    }

    &.selected {
      border-color: $primary;
      background: rgba($primary, 0.05);
      box-shadow: 0 0 0 2px rgba($primary, 0.1);
    }

    .order-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;

      .order-no {
        font-weight: 600;
        color: $primary;
        font-size: 14px;
      }
    }

    .order-body {
      .order-info {
        font-size: 13px;
        margin-bottom: 4px;

        .label {
          color: $text-tertiary;
        }

        .value {
          color: $text-primary;
        }
      }

      .order-address {
        display: flex;
        gap: 6px;
        font-size: 12px;
        color: $text-secondary;
        margin-top: 6px;

        .icon {
          flex-shrink: 0;
        }

        .text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    .order-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid $border-light;

      .time {
        font-size: 12px;
        color: $text-tertiary;
      }
    }
  }

  .rider-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .rider-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border: 1px solid $border-light;
    border-radius: 6px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: $primary;
      background: rgba($primary, 0.02);
    }

    &.selected {
      border-color: $primary;
      background: rgba($primary, 0.05);
    }

    .rider-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: $primary;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      flex-shrink: 0;
    }

    .rider-info {
      flex: 1;
      min-width: 0;

      .rider-name {
        font-size: 14px;
        font-weight: 500;
        color: $text-primary;
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 2px;
      }

      .rider-no,
      .rider-vehicle {
        font-size: 12px;
        color: $text-tertiary;
      }
    }
  }
}

.assign-form {
  .form-item {
    margin-bottom: 16px;

    label {
      display: block;
      margin-bottom: 6px;
      color: $text-secondary;
      font-size: 13px;
    }

    select, textarea, .order-info-display {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid $border-color;
      border-radius: 4px;
      font-size: 14px;
    }

    .order-info-display {
      background: #fafafa;
      color: $text-primary;
    }

    textarea {
      min-height: 80px;
      resize: vertical;
    }
  }
}
</style>
