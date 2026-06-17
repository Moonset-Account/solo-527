<template>
  <div class="orders-page">
    <div class="page-header">
      <h2>订单管理</h2>
    </div>

    <el-card class="filter-card">
      <el-form :model="filterForm" inline @submit.prevent>
        <el-form-item label="订单号">
          <el-input v-model="filterForm.keyword" placeholder="请输入订单号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option label="待确认" value="pending" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已派单" value="assigned" />
            <el-option label="服务中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="filterForm.deviceType" placeholder="全部设备" clearable style="width: 150px">
            <el-option
              v-for="item in deviceTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预约时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>订单列表</span>
          <div class="header-actions">
            <el-button type="primary" :icon="Download">导出</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="orderNo" label="订单号" width="160" />
        <el-table-column prop="deviceType" label="设备类型" width="100" />
        <el-table-column prop="deviceBrand" label="品牌" width="100" />
        <el-table-column prop="contactName" label="联系人" width="100" />
        <el-table-column prop="contactPhone" label="联系电话" width="130" />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="appointmentTime" label="预约时间" width="170" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <OrderStatusBadge :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="price" label="金额" width="100">
          <template #default="{ row }">
            <span v-if="row.price">¥{{ row.price }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
            <el-button v-if="canAssign(row)" type="primary" link @click="handleAssign(row)">派单</el-button>
            <el-button v-if="canReschedule(row)" type="primary" link @click="handleReschedule(row)">改约</el-button>
            <el-button v-if="canCancel(row)" type="danger" link @click="handleCancel(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <Pagination
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        @change="handlePageChange"
      />
    </el-card>

    <el-dialog v-model="assignDialogVisible" title="分配师傅" width="600px">
      <el-form label-width="80px">
        <el-form-item label="选择师傅">
          <el-select v-model="selectedTechnician" placeholder="请选择师傅" style="width: 100%" filterable>
            <el-option
              v-for="tech in technicians"
              :key="tech.id"
              :label="`${tech.name} (${tech.orderCount}单待处理)`"
              :value="tech.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确认派单</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rescheduleDialogVisible" title="改约时间" width="500px">
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
        <el-button @click="rescheduleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReschedule">确认改约</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import OrderStatusBadge from '@/components/OrderStatusBadge.vue'
import Pagination from '@/components/Pagination.vue'
import { useAppStore } from '@/stores/app'
import { DEVICE_TYPES } from '@/utils/constants'
import type { Order } from '@/api/order'
import type { Technician } from '@/api/technician'

const appStore = useAppStore()

const loading = ref(false)
const tableData = ref<Order[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const deviceTypes = DEVICE_TYPES

const filterForm = reactive({
  keyword: '',
  status: '',
  deviceType: '',
  dateRange: [] as string[]
})

const assignDialogVisible = ref(false)
const selectedTechnician = ref<number | null>(null)
const currentOrder = ref<Order | null>(null)
const technicians = ref<Technician[]>([])

const rescheduleDialogVisible = ref(false)
const newAppointmentTime = ref('')

function canAssign(order: Order) {
  return ['pending', 'confirmed'].includes(order.status)
}

function canReschedule(order: Order) {
  return ['pending', 'confirmed', 'assigned'].includes(order.status)
}

function canCancel(order: Order) {
  return ['pending', 'confirmed', 'assigned'].includes(order.status)
}

async function fetchOrders() {
  loading.value = true
  
  if (appStore.isDemoMode) {
    setTimeout(() => {
      tableData.value = generateDemoOrders()
      total.value = 128
      loading.value = false
    }, 500)
    return
  }

  // TODO: call API
  loading.value = false
}

function generateDemoOrders(): Order[] {
  const statuses: any[] = ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled']
  const orders: Order[] = []
  
  for (let i = 0; i < pageSize.value; i++) {
    const idx = (page.value - 1) * pageSize.value + i
    orders.push({
      id: idx + 1,
      orderNo: `202401${String(15 + Math.floor(idx / 10)).padStart(2, '0')}${String(idx + 1).padStart(4, '0')}`,
      deviceType: deviceTypes[idx % deviceTypes.length].label,
      deviceBrand: ['美的', '格力', '海尔', '小米', 'TCL'][idx % 5],
      faultDescription: '设备故障需要维修',
      faultImages: [],
      contactName: ['张先生', '李女士', '王师傅', '赵先生', '陈女士'][idx % 5],
      contactPhone: `138****${String(8000 + idx).padStart(4, '0')}`,
      address: `朝阳区XX小区${idx + 1}号楼3单元501`,
      appointmentTime: `2024-01-${String(15 + (idx % 5)).padStart(2, '0')} ${String(9 + (idx % 10)).padStart(2, '0')}:00:00`,
      status: statuses[idx % statuses.length],
      statusText: '',
      price: idx % 6 === 4 ? 150 + idx * 10 : undefined,
      createdAt: `2024-01-${String(10 + Math.floor(idx / 2)).padStart(2, '0')} 09:00:00`,
      updatedAt: `2024-01-${String(10 + Math.floor(idx / 2)).padStart(2, '0')} 09:00:00`
    })
  }
  
  return orders
}

function fetchTechnicians() {
  if (appStore.isDemoMode) {
    technicians.value = [
      { id: 1, name: '李师傅', phone: '139****1111', orderCount: 5, skills: ['空调维修'], status: 'active', rating: 4.8, workAreas: ['朝阳区'], createdAt: '2024-01-01' },
      { id: 2, name: '王师傅', phone: '139****2222', orderCount: 3, skills: ['冰箱维修'], status: 'active', rating: 4.7, workAreas: ['海淀区'], createdAt: '2024-01-02' },
      { id: 3, name: '张师傅', phone: '139****3333', orderCount: 8, skills: ['洗衣机维修'], status: 'active', rating: 4.9, workAreas: ['东城区'], createdAt: '2024-01-03' },
      { id: 4, name: '刘师傅', phone: '139****4444', orderCount: 2, skills: ['热水器维修'], status: 'active', rating: 4.6, workAreas: ['西城区'], createdAt: '2024-01-04' }
    ]
  }
}

function handleSearch() {
  page.value = 1
  fetchOrders()
}

function handleReset() {
  filterForm.keyword = ''
  filterForm.status = ''
  filterForm.deviceType = ''
  filterForm.dateRange = []
  page.value = 1
  fetchOrders()
}

function handlePageChange() {
  fetchOrders()
}

function viewDetail(row: Order) {
  // TODO: 跳转到订单详情或打开详情弹窗
  ElMessage.info(`查看订单 ${row.orderNo} 详情`)
}

function handleAssign(row: Order) {
  currentOrder.value = row
  selectedTechnician.value = null
  fetchTechnicians()
  assignDialogVisible.value = true
}

async function confirmAssign() {
  if (!selectedTechnician.value) {
    ElMessage.warning('请选择师傅')
    return
  }

  if (appStore.isDemoMode) {
    ElMessage.success('派单成功')
    assignDialogVisible.value = false
    if (currentOrder.value) {
      currentOrder.value.status = 'assigned'
    }
    return
  }

  // TODO: call API
  assignDialogVisible.value = false
}

function handleReschedule(row: Order) {
  currentOrder.value = row
  newAppointmentTime.value = ''
  rescheduleDialogVisible.value = true
}

async function confirmReschedule() {
  if (!newAppointmentTime.value) {
    ElMessage.warning('请选择新的预约时间')
    return
  }

  if (appStore.isDemoMode) {
    ElMessage.success('改约成功')
    rescheduleDialogVisible.value = false
    return
  }

  // TODO: call API
  rescheduleDialogVisible.value = false
}

async function handleCancel(row: Order) {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定取消',
      cancelButtonText: '再想想'
    })
  } catch {
    return
  }

  if (appStore.isDemoMode) {
    row.status = 'cancelled'
    ElMessage.success('订单已取消')
    return
  }

  // TODO: call API
}

onMounted(() => {
  fetchOrders()
})
</script>

<style lang="scss" scoped>
.orders-page {
  .page-header {
    margin-bottom: 16px;

    h2 {
      margin: 0;
      font-size: 20px;
      color: #303133;
    }
  }

  .filter-card {
    margin-bottom: 16px;
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .text-muted {
      color: #c0c4cc;
    }
  }
}
</style>
