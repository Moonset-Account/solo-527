<template>
  <div class="orders-page">
    <div class="page-header">
      <h2>待接单</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="loadOrders">
          🔄 刷新
        </button>
        <button class="btn btn-success" @click="batchAccept" :disabled="selectedIds.length === 0">
          ✅ 批量接单 ({{ selectedIds.length }})
        </button>
      </div>
    </div>

    <div class="pending-stats">
      <div class="stat-item">
        <span class="label">待接单总数</span>
        <span class="value text-warning">{{ totalCount }}</span>
      </div>
      <div class="stat-item">
        <span class="label">加急订单</span>
        <span class="value text-danger">{{ urgencyCount }}</span>
      </div>
      <div class="stat-item">
        <span class="label">冷链订单</span>
        <span class="value text-primary">{{ coldChainCount }}</span>
      </div>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40px;">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll"
              />
            </th>
            <th>订单号</th>
            <th>客户</th>
            <th>类型/优先级</th>
            <th>取货地址</th>
            <th>送货地址</th>
            <th>取货时间窗</th>
            <th>送货时间窗</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orderList" :key="order.id">
            <td>
              <input
                type="checkbox"
                :checked="selectedIds.includes(order.id)"
                @change="toggleSelect(order.id)"
              />
            </td>
            <td class="order-no">{{ order.orderNo }}</td>
            <td>{{ order.customer?.companyName || '-' }}</td>
            <td>
              <div class="type-tags">
                <StatusTag :type="getOrderTypeTag(order.orderType)" size="sm">
                  {{ getOrderTypeLabel(order.orderType) }}
                </StatusTag>
                <StatusTag v-if="order.priority !== 'NORMAL'" :type="getPriorityTag(order.priority)" size="sm">
                  {{ getPriorityLabel(order.priority) }}
                </StatusTag>
              </div>
            </td>
            <td class="address-cell">{{ order.pickupAddress }}</td>
            <td class="address-cell">{{ order.deliveryAddress }}</td>
            <td class="time-cell">
              <div class="time-range">
              <span class="label">取</span>
              {{ formatDate(order.pickupEarliest, 'MM-DD HH:mm') }}
              ~ {{ formatDate(order.pickupLatest, 'HH:mm') }}
            </div>
            </td>
            <td class="time-cell">
              <div class="time-range">
              <span class="label">送</span>
              {{ formatDate(order.deliveryEarliest, 'MM-DD HH:mm') }}
              ~ {{ formatDate(order.deliveryLatest, 'HH:mm') }}
            </div>
            </td>
            <td class="text-secondary text-sm">{{ formatDate(order.createdAt) }}</td>
            <td>
              <button class="btn btn-primary btn-sm" @click="handleAccept(order)">
              接单
            </button>
              <button class="btn btn-text btn-sm" @click="viewDetail(order)">
              详情
            </button>
            </td>
          </tr>
          <tr v-if="!loading && orderList.length === 0">
            <td colspan="10">
              <div class="empty">暂无待接单订单</div>
            </td>
          </tr>
        </tbody>
      </table>

      <AppPagination
        v-model:page="pageInfo.page"
        v-model:page-size="pageInfo.pageSize"
        :total="pageInfo.total"
        @change="loadOrders"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

const { formatDate } = useFormatter()
const { pageInfo, setTotal, reset } = usePagination(10)

const orderList = ref<any[]>([])
const loading = ref(false)
const selectedIds = ref<any[]>([])
const totalCount = ref(0)
const urgencyCount = ref(0)
const coldChainCount = ref(0)

const isAllSelected = computed(() => {
  if (orderList.value.length === 0) return false
  return orderList.value.every(o => selectedIds.value.includes(o.id))
})

const loadOrders = async () => {
  loading.value = true
  try {
    const res: any = await $fetch('/api/orders', {
      query: {
        page: pageInfo.page,
        pageSize: pageInfo.pageSize,
        status: 'PENDING_ACCEPT',
      },
      headers: useRequestHeaders(['cookie'])
    })
    if (res.code === 0) {
      orderList.value = res.data.list
      setTotal(res.data.total)
      totalCount.value = res.data.total

      urgencyCount.value = res.data.list.filter((o: any) => o.priority === 'URGENT' || o.orderType === 'URGENCY').length
      coldChainCount.value = res.data.list.filter((o: any) => o.orderType === 'COLD_CHAIN').length
    }
  } catch (e) {
    console.error('加载订单失败', e)
  } finally {
    loading.value = false
  }
}

const toggleSelect = (id: any) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = orderList.value.map(o => o.id)
  }
}

const viewDetail = (order: any) => {
  navigateTo(`/orders/${order.id}`)
}

const handleAccept = async (order: any) => {
  if (!confirm(`确定要接单【${order.orderNo}】吗？`)) return

  try {
    const res: any = await $fetch(`/api/orders/${order.id}/accept`, {
      method: 'POST',
      headers: useRequestHeaders(['cookie'])
    })
    if (res.code === 0) {
      alert('接单成功')
      loadOrders()
    } else {
      alert(res.message || '接单失败')
    }
  } catch (e: any) {
    alert(e.data?.message || '接单失败')
  }
}

const batchAccept = async () => {
  if (selectedIds.value.length === 0) return
  if (!confirm(`确定要批量接单 ${selectedIds.value.length} 个订单吗？`)) return

  let success = 0
  let fail = 0

  for (const id of selectedIds.value) {
    try {
      const res: any = await $fetch(`/api/orders/${id}/accept`, {
        method: 'POST',
        headers: useRequestHeaders(['cookie'])
      })
      if (res.code === 0) {
        success++
      } else {
        fail++
      }
    } catch {
      fail++
    }
  }

  alert(`批量接单完成：成功 ${success} 个，失败 ${fail} 个`)
  selectedIds.value = []
  loadOrders()
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

onMounted(() => {
  loadOrders()
})
</script>

<style lang="scss" scoped>
.orders-page {
  .pending-stats {
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

  .order-no {
    font-weight: 500;
    color: $primary;
  }

  .type-tags {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .address-cell {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: $text-secondary;
  }

  .time-cell {
    .time-range {
      font-size: 12px;
      color: $text-secondary;
      line-height: 1.5;

      .label {
        display: inline-block;
        width: 16px;
        height: 16px;
        line-height: 16px;
        text-align: center;
        background: $primary;
        color: #fff;
        border-radius: 2px;
        font-size: 10px;
        margin-right: 4px;
      }
    }
  }
}
</style>
