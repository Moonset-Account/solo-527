<template>
  <div class="page-container">
    <div class="filter-bar">
      <el-select v-model="filters.riderId" placeholder="选择骑手" clearable style="width: 160px">
        <el-option v-for="r in riderList" :key="r.id" :label="r.name" :value="r.id" />
      </el-select>
      <el-select v-model="filters.stationId" placeholder="选择站点" clearable style="width: 160px">
        <el-option v-for="s in stationList" :key="s.id" :label="s.name" :value="s.id" />
      </el-select>
      <el-select v-model="filters.status" placeholder="订单状态" clearable style="width: 140px">
        <el-option label="待接单" value="PENDING" />
        <el-option label="已接单" value="ACCEPTED" />
        <el-option label="已取货" value="PICKED_UP" />
        <el-option label="配送中" value="DELIVERING" />
        <el-option label="已签收" value="SIGNED" />
        <el-option label="异常" value="EXCEPTION" />
      </el-select>
      <el-button type="primary" @click="handleSearch">
        <el-icon><Search /></el-icon>查询
      </el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table :data="orderList" stripe v-loading="loading" size="small">
      <el-table-column prop="orderNo" label="订单号" width="190" />
      <el-table-column prop="receiverName" label="收件人" width="90" />
      <el-table-column prop="receiverAddress" label="地址" show-overflow-tooltip />
      <el-table-column prop="stationName" label="站点" width="100" />
      <el-table-column prop="riderName" label="骑手" width="90" />
      <el-table-column label="承诺时间" width="170">
        <template #default="{ row }">
          {{ formatTime(row.promiseTime) }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ row.statusLabel }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 'PENDING'" type="primary" size="small" link @click="handleAccept(row)">接单</el-button>
          <el-button type="primary" size="small" link @click="goRoute(row)">路线</el-button>
          <el-button type="primary" size="small" link @click="goDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      @current-change="fetchOrders"
      @size-change="fetchOrders"
    />

    <el-dialog v-model="acceptDialogVisible" title="确认接单" width="400px">
      <p>确认要接单 <b>{{ selectedOrder?.orderNo }}</b> 吗？</p>
      <el-form label-width="80px" style="margin-top: 16px">
        <el-form-item label="骑手">
          <el-select v-model="selectedRiderId" placeholder="请选择骑手" style="width: 100%">
            <el-option v-for="r in riderList" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="acceptDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="accepting" @click="confirmAccept">确认接单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getOrderList, acceptOrder } from '../api/order'
import { getRiderList } from '../api/rider'
import { getStations } from '../api/station'
import dayjs from 'dayjs'

const router = useRouter()
const loading = ref(false)
const accepting = ref(false)
const orderList = ref([])
const riderList = ref([])
const stationList = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const acceptDialogVisible = ref(false)
const selectedOrder = ref(null)
const selectedRiderId = ref(null)

const filters = reactive({
  riderId: null,
  stationId: null,
  status: ''
})

function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

function statusTagType(status) {
  const map = {
    PENDING: 'info',
    ACCEPTED: '',
    PICKED_UP: 'warning',
    DELIVERING: 'primary',
    SIGNED: 'success',
    EXCEPTION: 'danger'
  }
  return map[status] || ''
}

async function fetchOrders() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      riderId: filters.riderId,
      stationId: filters.stationId,
      status: filters.status || undefined
    }
    const res = await getOrderList(params)
    orderList.value = res.data.list || []
    total.value = res.data.total || 0
  } finally {
    loading.value = false
  }
}

async function fetchRiders() {
  try {
    const res = await getRiderList({ status: 'ONLINE' })
    riderList.value = res.data || []
  } catch (e) {
    console.error('骑手列表加载失败', e)
  }
}

async function fetchStations() {
  try {
    const res = await getStations()
    stationList.value = res.data || []
  } catch (e) {
    console.error('站点列表加载失败', e)
  }
}

function handleAccept(row) {
  selectedOrder.value = row
  selectedRiderId.value = row.riderId || null
  acceptDialogVisible.value = true
}

async function confirmAccept() {
  if (!selectedRiderId.value) {
    ElMessage.warning('请选择骑手')
    return
  }
  accepting.value = true
  try {
    await acceptOrder({ orderId: selectedOrder.value.id, riderId: selectedRiderId.value })
    ElMessage.success('接单成功')
    acceptDialogVisible.value = false
    fetchOrders()
  } finally {
    accepting.value = false
  }
}

function goRoute(row) {
  router.push(`/orders/route/${row.id}`)
}

function goDetail(row) {
  router.push(`/orders/todo/${row.id}`)
}

function handleSearch() {
  page.value = 1
  fetchOrders()
}

function handleReset() {
  filters.riderId = null
  filters.stationId = null
  filters.status = ''
  page.value = 1
  fetchOrders()
}

onMounted(() => {
  fetchOrders()
  fetchRiders()
  fetchStations()
})
</script>

<style scoped>
.page-container {
  padding: 16px;
}
.filter-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.el-pagination {
  margin-top: 16px;
  justify-content: flex-end;
  display: flex;
}
</style>
