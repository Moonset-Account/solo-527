<template>
  <div class="orders-page">
    <div class="page-header">
      <h2>订单管理</h2>
      <div class="header-actions">
        <button class="btn btn-primary" @click="refreshList">
          🔄 刷新
        </button>
      </div>
    </div>

    <SearchBar @search="handleSearch" @reset="handleReset">
      <div class="form-item">
        <label>订单号</label>
        <input v-model="searchForm.keyword" placeholder="请输入订单号/地址" />
      </div>
      <div class="form-item">
        <label>订单状态</label>
        <select v-model="searchForm.status">
          <option value="">全部</option>
          <option value="PENDING_ACCEPT">待接单</option>
          <option value="ACCEPTED">已接单</option>
          <option value="ASSIGNED">已分派</option>
          <option value="PICKED_UP">已取货</option>
          <option value="IN_TRANSIT">配送中</option>
          <option value="ARRIVED">已到达</option>
          <option value="DELIVERED">已送达</option>
          <option value="CANCELLED">已取消</option>
          <option value="EXCEPTION">异常</option>
        </select>
      </div>
      <div class="form-item">
        <label>订单类型</label>
        <select v-model="searchForm.orderType">
          <option value="">全部</option>
          <option value="NORMAL">普通</option>
          <option value="URGENCY">加急</option>
          <option value="COLD_CHAIN">冷链</option>
          <option value="FRAGILE">易碎</option>
        </select>
      </div>
      <div class="form-item">
        <label>优先级</label>
        <select v-model="searchForm.priority">
          <option value="">全部</option>
          <option value="LOW">低</option>
          <option value="NORMAL">普通</option>
          <option value="HIGH">高</option>
          <option value="URGENT">紧急</option>
        </select>
      </div>
    </SearchBar>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>客户</th>
            <th>类型</th>
            <th>优先级</th>
            <th>取货地址</th>
            <th>送货地址</th>
            <th>骑手</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orderList" :key="order.id">
            <td class="order-no">{{ order.orderNo }}</td>
            <td>{{ order.customer?.companyName || '-' }}</td>
            <td>
              <StatusTag :type="getOrderTypeTag(order.orderType)">
                {{ getOrderTypeLabel(order.orderType) }}
              </StatusTag>
            </td>
            <td>
              <StatusTag :type="getPriorityTag(order.priority)">
                {{ getPriorityLabel(order.priority) }}
              </StatusTag>
            </td>
            <td class="address-cell">{{ order.pickupAddress }}</td>
            <td class="address-cell">{{ order.deliveryAddress }}</td>
            <td>{{ order.rider?.realName || '-' }}</td>
            <td>
              <StatusTag :type="getStatusTag(order.status)">
                {{ getStatusLabel(order.status) }}
              </StatusTag>
            </td>
            <td class="text-secondary text-sm">{{ formatDate(order.createdAt) }}</td>
            <td>
              <button class="btn btn-text btn-sm" @click="viewDetail(order)">
                详情
              </button>
              <button
                v-if="order.status === 'PENDING_ACCEPT'"
                class="btn btn-text btn-sm text-primary"
                @click="handleAccept(order)"
              >
                接单
              </button>
            </td>
          </tr>
          <tr v-if="!loading && orderList.length === 0">
            <td colspan="10">
              <div class="empty">暂无数据</div>
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
import { ref, reactive, onMounted } from 'vue'

const { formatDate } = useFormatter()
const { pageInfo, setTotal, reset } = usePagination(10)

const orderList = ref<any[]>([])
const loading = ref(false)

const searchForm = reactive({
  keyword: '',
  status: '',
  orderType: '',
  priority: '',
})

const loadOrders = async () => {
  loading.value = true
  try {
    const res: any = await $fetch('/api/orders', {
      query: {
        page: pageInfo.page,
        pageSize: pageInfo.pageSize,
        ...searchForm,
      },
      headers: useRequestHeaders(['cookie'])
    })
    if (res.code === 0) {
      orderList.value = res.data.list
      setTotal(res.data.total)
    }
  } catch (e) {
    console.error('加载订单失败', e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  reset()
  loadOrders()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.orderType = ''
  searchForm.priority = ''
  reset()
  loadOrders()
}

const refreshList = () => {
  loadOrders()
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

onMounted(() => {
  loadOrders()
})
</script>

<style lang="scss" scoped>
.orders-page {
  .order-no {
    font-weight: 500;
    color: $primary;
  }

  .address-cell {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: $text-secondary;
  }
}
</style>
