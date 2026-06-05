<template>
  <div class="order-list">
    <el-card shadow="never">
      <template #header>
        <div class="flex-between">
          <span>工单列表</span>
          <el-button type="primary" @click="$router.push('/orders/create')" v-if="canCreate">
            <el-icon><Plus /></el-icon>
            提交报修
          </el-button>
        </div>
      </template>

      <div class="filter-bar">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" clearable placeholder="全部状态" style="width: 140px;">
              <el-option label="待审核" value="PENDING" />
              <el-option label="已派单" value="APPROVED" />
              <el-option label="处理中" value="PROCESSING" />
              <el-option label="待验收" value="COMPLETED" />
              <el-option label="已关闭" value="CLOSED" />
              <el-option label="已驳回" value="REJECTED" />
            </el-select>
          </el-form-item>
          <el-form-item label="优先级">
            <el-select v-model="filterForm.priority" clearable placeholder="全部优先级" style="width: 140px;">
              <el-option label="紧急" value="URGENT" />
              <el-option label="高" value="HIGH" />
              <el-option label="普通" value="NORMAL" />
              <el-option label="低" value="LOW" />
            </el-select>
          </el-form-item>
          <el-form-item label="关键词">
            <el-input v-model="filterForm.keyword" placeholder="搜索工单编号/标题" clearable style="width: 200px;" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadOrders">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table :data="orderList" v-loading="loading" @row-click="viewDetail">
        <el-table-column prop="orderNo" label="工单编号" width="160" />
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column label="优先级" width="80">
          <template #default="{ row }">
            <span :class="getPriorityClass(row.priority)">{{ getPriorityText(row.priority) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="roomInfo" label="位置" width="140" />
        <el-table-column prop="ownerName" label="业主" width="100" />
        <el-table-column prop="assigneeName" label="处理人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="viewDetail(row.id)">详情</el-button>
            <el-button v-if="canApprove(row)" type="success" link size="small" @click.stop="handleApprove(row)">审核</el-button>
            <el-button v-if="canStart(row)" type="warning" link size="small" @click.stop="handleStart(row)">开始处理</el-button>
            <el-button v-if="canComplete(row)" type="info" link size="small" @click.stop="handleComplete(row)">完成</el-button>
            <el-button v-if="canClose(row)" type="primary" link size="small" @click.stop="handleClose(row)">关闭</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadOrders"
          @current-change="loadOrders"
        />
      </div>
    </el-card>

    <el-dialog v-model="approveDialogVisible" title="工单审核" width="500px">
      <el-form :model="approveForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="approveForm.approved">
            <el-radio :value="true">通过并派单</el-radio>
            <el-radio :value="false">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="指派人员" v-if="approveForm.approved">
          <el-select v-model="approveForm.assigneeId" placeholder="请选择维修人员" style="width: 100%;">
            <el-option v-for="m in maintenanceList" :key="m.id" :label="m.realName" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="驳回原因" v-if="!approveForm.approved">
          <el-input v-model="approveForm.rejectReason" type="textarea" :rows="3" placeholder="请输入驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApprove" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOrderPage, approveOrder, startProcess, completeOrder, closeOrder } from '@/api/order'

const router = useRouter()
const userStore = useUserStore()

const orderList = ref([])
const loading = ref(false)
const approveDialogVisible = ref(false)
const submitting = ref(false)
const currentOrder = ref(null)
const maintenanceList = ref([])

const userRole = computed(() => userStore.userInfo?.role)
const canCreate = computed(() => ['OWNER', 'PROPERTY', 'ADMIN'].includes(userRole.value))

const filterForm = reactive({
  status: '',
  priority: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const approveForm = reactive({
  approved: true,
  assigneeId: null,
  rejectReason: ''
})

function getPriorityClass(priority) {
  const map = { URGENT: 'urgent-tag', HIGH: 'high-tag', NORMAL: 'normal-tag', LOW: 'low-tag' }
  return map[priority] || 'normal-tag'
}

function getPriorityText(priority) {
  const map = { URGENT: '紧急', HIGH: '高', NORMAL: '普通', LOW: '低' }
  return map[priority] || priority
}

function getStatusType(status) {
  const map = {
    PENDING: 'warning', APPROVED: 'primary', PROCESSING: 'info',
    COMPLETED: 'success', CLOSED: '', REJECTED: 'danger'
  }
  return map[status] || ''
}

function getStatusText(status) {
  const map = {
    PENDING: '待审核', APPROVED: '已派单', PROCESSING: '处理中',
    COMPLETED: '待验收', CLOSED: '已关闭', REJECTED: '已驳回'
  }
  return map[status] || status
}

function canApprove(row) {
  return row.status === 'PENDING' && ['ADMIN', 'PROPERTY'].includes(userRole.value)
}

function canStart(row) {
  return row.status === 'APPROVED' && row.assigneeId === userStore.userInfo?.userId
}

function canComplete(row) {
  return row.status === 'PROCESSING' && row.assigneeId === userStore.userInfo?.userId
}

function canClose(row) {
  return row.status === 'COMPLETED'
}

function viewDetail(id) {
  router.push(`/orders/${id}`)
}

function handleApprove(row) {
  currentOrder.value = row
  approveForm.approved = true
  approveForm.assigneeId = null
  approveForm.rejectReason = ''
  maintenanceList.value = [
    { id: 3, realName: '王师傅' },
    { id: 4, realName: '赵师傅' }
  ]
  approveDialogVisible.value = true
}

async function submitApprove() {
  if (!currentOrder.value) return

  if (approveForm.approved && !approveForm.assigneeId) {
    ElMessage.warning('请选择指派的维修人员')
    return
  }
  if (!approveForm.approved && !approveForm.rejectReason) {
    ElMessage.warning('请输入驳回原因')
    return
  }

  submitting.value = true
  try {
    await approveOrder(currentOrder.value.id, approveForm.approved, approveForm.rejectReason, approveForm.assigneeId)
    ElMessage.success('操作成功')
    approveDialogVisible.value = false
    loadOrders()
  } catch (e) {
    console.error(e)
  } finally {
    submitting.value = false
  }
}

async function handleStart(row) {
  try {
    await startProcess(row.id)
    ElMessage.success('已开始处理')
    loadOrders()
  } catch (e) {
    console.error(e)
  }
}

function handleComplete(row) {
  ElMessageBox.prompt('请输入处理备注', '完成工单', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入处理结果说明'
  }).then(async ({ value }) => {
    try {
      await completeOrder(row.id, value, null)
      ElMessage.success('工单已完成')
      loadOrders()
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

async function handleClose(row) {
  try {
    await closeOrder(row.id)
    ElMessage.success('工单已关闭')
    loadOrders()
  } catch (e) {
    console.error(e)
  }
}

async function loadOrders() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...filterForm
    }
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null) delete params[key]
    })

    const res = await getOrderPage(params)
    orderList.value = res.data.records
    pagination.total = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterForm.status = ''
  filterForm.priority = ''
  filterForm.keyword = ''
  pagination.page = 1
  loadOrders()
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.filter-bar {
  margin-bottom: 20px;
  padding: 15px;
  background: #fafafa;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
