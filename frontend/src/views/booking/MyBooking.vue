<template>
  <div class="my-booking">
    <div class="page-header">
      <h2>我的预约</h2>
      <div class="filter-bar">
        <el-select v-model="statusFilter" placeholder="预约状态" clearable style="width: 150px; margin-right: 10px;">
          <el-option label="待支付" :value="0" />
          <el-option label="已支付" :value="1" />
          <el-option label="已取消" :value="2" />
          <el-option label="已完成" :value="3" />
        </el-select>
        <el-button type="primary" @click="fetchMyBookings">搜索</el-button>
      </div>
    </div>

    <el-card class="booking-table-card">
      <el-table :data="bookingList" v-loading="loading">
        <el-table-column prop="bookingNo" label="预约单号" width="180" />
        <el-table-column prop="courtName" label="场地名称" />
        <el-table-column prop="bookingDate" label="预约日期" width="120" />
        <el-table-column label="时段" width="150">
          <template #default="{ row }">
            {{ formatTime(row.startTime) }} - {{ formatTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="费用" width="120">
          <template #default="{ row }">
            <span class="price">¥{{ row.payAmount || row.totalAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="primary"
              size="small"
              @click="goToPayment(row)"
            >
              去支付
            </el-button>
            <el-button
              v-if="row.status === 0 || row.status === 1"
              type="danger"
              size="small"
              @click="handleCancel(row)"
            >
              取消预约
            </el-button>
            <el-button
              v-if="row.status === 2"
              type="info"
              size="small"
              disabled
            >
              已取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="cancelDialogVisible"
      title="取消预约"
      width="400px"
    >
      <p>确定要取消该预约吗？</p>
      <template #footer>
        <el-button @click="cancelDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="canceling" @click="confirmCancel">
          确定取消
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyBookings, cancelBooking } from '@/api/booking'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

const bookingList = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const statusFilter = ref(null)
const loading = ref(false)
const cancelDialogVisible = ref(false)
const canceling = ref(false)
const currentBooking = ref(null)

const fetchMyBookings = async () => {
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    if (statusFilter.value !== null && statusFilter.value !== undefined) {
      params.status = statusFilter.value
    }
    const res = await getMyBookings(params)
    bookingList.value = res.records
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取预约列表失败')
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
  pageNum.value = 1
  fetchMyBookings()
}

const handleCurrentChange = (page) => {
  pageNum.value = page
  fetchMyBookings()
}

const getStatusType = (status) => {
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'info',
    3: 'primary'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    0: '待支付',
    1: '已支付',
    2: '已取消',
    3: '已完成'
  }
  return textMap[status] || '未知'
}

const formatTime = (time) => {
  if (!time) return ''
  if (typeof time === 'string') {
    return time.substring(0, 5)
  }
  return time
}

const formatDateTime = (datetime) => {
  if (!datetime) return ''
  if (typeof datetime === 'string') {
    return datetime.replace('T', ' ').substring(0, 16)
  }
  return datetime
}

const goToPayment = (row) => {
  router.push(`/payment/${row.id}`)
}

const handleCancel = (row) => {
  currentBooking.value = row
  cancelDialogVisible.value = true
}

const confirmCancel = async () => {
  if (!currentBooking.value) return
  
  canceling.value = true
  try {
    await cancelBooking(currentBooking.value.id)
    ElMessage.success('取消预约成功')
    cancelDialogVisible.value = false
    fetchMyBookings()
  } catch (error) {
    ElMessage.error('取消预约失败')
  } finally {
    canceling.value = false
  }
}

onMounted(() => {
  fetchMyBookings()
})
</script>

<style scoped>
.my-booking {
  padding: 10px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 24px;
  color: #303133;
}

.filter-bar {
  display: flex;
  align-items: center;
}

.booking-table-card {
  border-radius: 8px;
}

.price {
  color: #f56c6c;
  font-weight: bold;
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 20px 0 0;
}
</style>
