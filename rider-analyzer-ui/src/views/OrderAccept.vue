<template>
  <div class="page-container">
    <div class="filter-bar">
      <el-select v-model="filters.riderId" placeholder="选择骑手" clearable style="width: 160px">
        <el-option v-for="r in riders" :key="r.id" :label="r.name" :value="r.id" />
      </el-select>
      <el-select v-model="filters.stationId" placeholder="选择站点" clearable style="width: 160px">
        <el-option v-for="s in stations" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
      <el-select v-model="filters.status" placeholder="状态筛选" clearable style="width: 140px">
        <el-option label="待接单" value="PENDING" />
        <el-option label="已接单" value="ACCEPTED" />
        <el-option label="配送中" value="DELIVERING" />
        <el-option label="已签收" value="SIGNED" />
      </el-select>
      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>查询
      </el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="orders" stripe v-loading="loading" size="small">
      <el-table-column prop="orderNo" label="订单号" width="170" />
      <el-table-column prop="receiverName" label="收件人" width="100" />
      <el-table-column prop="address" label="地址" show-overflow-tooltip />
      <el-table-column prop="promiseTime" label="承诺时间" width="170" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 'PENDING'" type="primary" size="small" @click="handleAccept(row)">接单</el-button>
          <el-button size="small" @click="goRoute(row.id)">路线</el-button>
          <el-button size="small" @click="goTodo(row.id)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      @current-change="fetchData"
      @size-change="fetchData"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useOrderStore } from '../stores/index'
import { acceptOrder } from '../api/order'
import { getRiderList } from '../api/rider'
import { getStations } from '../api/station'

const router = useRouter()
const orderStore = useOrderStore()
const orders = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const riders = ref([])
const stations = ref([])

const filters = ref({
  riderId: '',
  stationId: '',
  status: ''
})

function statusTagType(status) {
  const map = { PENDING: 'info', ACCEPTED: '', DELIVERING: 'warning', SIGNED: 'success' }
  return map[status] || ''
}

function statusLabel(status) {
  const map = { PENDING: '待接单', ACCEPTED: '已接单', DELIVERING: '配送中', SIGNED: '已签收' }
  return map[status] || status
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...filters.value
    }
    const res = await orderStore.fetchOrders(params)
    orders.value = orderStore.orders
    total.value = orderStore.total
  } catch {
    orders.value = [
      { id: 1, orderNo: 'ORD-20260616001', receiverName: '张三', address: '朝阳区建国路88号', promiseTime: '2026-06-16 14:00', status: 'PENDING' },
      { id: 2, orderNo: 'ORD-20260616002', receiverName: '李四', address: '海淀区中关村大街1号', promiseTime: '2026-06-16 15:00', status: 'PENDING' },
      { id: 3, orderNo: 'ORD-20260616003', receiverName: '王五', address: '西城区金融街10号', promiseTime: '2026-06-16 13:30', status: 'ACCEPTED' },
      { id: 4, orderNo: 'ORD-20260616004', receiverName: '赵六', address: '东城区王府井大街5号', promiseTime: '2026-06-16 16:00', status: 'DELIVERING' },
      { id: 5, orderNo: 'ORD-20260616005', receiverName: '孙七', address: '丰台区南三环西路2号', promiseTime: '2026-06-16 12:00', status: 'SIGNED' }
    ]
    total.value = 5
  } finally {
    loading.value = false
  }
}

async function loadFilters() {
  try {
    const [rRes, sRes] = await Promise.all([getRiderList(), getStations()])
    riders.value = rRes.data?.list || []
    stations.value = sRes.data?.list || []
  } catch {
    riders.value = [
      { id: 1, name: '骑手A' },
      { id: 2, name: '骑手B' },
      { id: 3, name: '骑手C' }
    ]
    stations.value = [
      { id: 1, name: '望京站' },
      { id: 2, name: '中关村站' },
      { id: 3, name: '国贸站' }
    ]
  }
}

async function handleAccept(row) {
  try {
    await ElMessageBox.confirm(`确认接单：${row.orderNo}？`, '接单确认', { type: 'warning' })
    await acceptOrder(row.id)
    ElMessage.success('接单成功')
    orderStore.updateOrderStatus(row.id, 'ACCEPTED')
    row.status = 'ACCEPTED'
  } catch {}
}

function goRoute(id) {
  router.push(`/orders/route/${id}`)
}

function goTodo(id) {
  router.push(`/orders/todo/${id}`)
}

function handleSearch() {
  page.value = 1
  fetchData()
}

function handleReset() {
  filters.value = { riderId: '', stationId: '', status: '' }
  page.value = 1
  fetchData()
}

onMounted(() => {
  fetchData()
  loadFilters()
})
</script>
