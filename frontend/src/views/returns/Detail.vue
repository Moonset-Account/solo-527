<template>
  <div class="return-detail">
    <div class="page-header">
      <h2>退货详情</h2>
      <div>
        <el-button @click="goBack">返回</el-button>
        <el-button
          type="success"
          v-if="returnRequest?.status === 'pending' && hasPermission('return.approve')"
          @click="handleApprove"
        >
          审批通过
        </el-button>
        <el-button
          type="danger"
          v-if="returnRequest?.status === 'pending' && hasPermission('return.reject')"
          @click="handleReject"
        >
          拒绝退货
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" v-if="returnRequest">
      <el-col :span="16">
        <el-card class="mb-20">
          <template #header>
            <div class="card-header">
              <span>退货信息</span>
              <el-tag :type="getStatusType(returnRequest.status)" size="large">
                {{ getStatusName(returnRequest.status) }}
              </el-tag>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="退货单号">{{ returnRequest.return_no }}</el-descriptions-item>
            <el-descriptions-item label="关联订单">{{ returnRequest.order?.order_no }}</el-descriptions-item>
            <el-descriptions-item label="客户名称">{{ returnRequest.customer?.name }}</el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ formatDate(returnRequest.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="退货原因" :span="2">{{ returnRequest.reason }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ returnRequest.remarks || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="mb-20">
          <template #header>
            <span>退货商品</span>
          </template>
          <el-table :data="returnRequest.items" style="width: 100%">
            <el-table-column prop="product_name" label="商品名称" min-width="180" />
            <el-table-column prop="sku" label="SKU" width="120" />
            <el-table-column prop="quantity" label="申请数量" width="100" />
            <el-table-column prop="received_quantity" label="已收数量" width="100" />
            <el-table-column prop="restocked_quantity" label="已入库" width="100" />
            <el-table-column prop="price" label="单价" width="100">
              <template #default="{ row }">
                ¥{{ row.price?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.restocked_quantity >= row.quantity" type="success">已完成</el-tag>
                <el-tag v-else-if="row.received_quantity > 0" type="info">部分收货</el-tag>
                <el-tag v-else type="warning">待处理</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  :disabled="row.received_quantity >= row.quantity || returnRequest.status !== 'approved'"
                  v-if="hasPermission('return.receive')"
                  @click="handleReceive(row)"
                >
                  收货
                </el-button>
                <el-button
                  type="success"
                  size="small"
                  :disabled="row.restocked_quantity >= row.received_quantity || returnRequest.status !== 'received'"
                  v-if="hasPermission('return.restock')"
                  @click="handleRestock(row)"
                >
                  入库
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="mb-20">
          <template #header>
            <span>金额明细</span>
          </template>
          <div class="amount-summary">
            <div class="amount-item">
              <span>商品金额:</span>
              <span>¥{{ returnRequest.subtotal_amount?.toFixed(2) }}</span>
            </div>
            <el-divider />
            <div class="amount-item total">
              <span>退款总额:</span>
              <span class="text-danger">¥{{ returnRequest.return_amount?.toFixed(2) }}</span>
            </div>
          </div>
        </el-card>

        <el-card>
          <template #header>
            <span>审批记录</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-if="returnRequest.approved_at"
              :timestamp="formatDate(returnRequest.approved_at)"
              type="success"
            >
              <strong>{{ returnRequest.approved_by_name || '系统' }}</strong> 审批通过
            </el-timeline-item>
            <el-timeline-item
              v-if="returnRequest.rejected_at"
              :timestamp="formatDate(returnRequest.rejected_at)"
              type="danger"
            >
              <strong>{{ returnRequest.rejected_by_name || '系统' }}</strong> 拒绝退货
              <p class="text-muted">{{ returnRequest.rejection_reason }}</p>
            </el-timeline-item>
            <el-timeline-item
              :timestamp="formatDate(returnRequest.created_at)"
              type="primary"
            >
              <strong>{{ returnRequest.created_by_name || '系统' }}</strong> 提交退货申请
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="receiveDialogVisible" title="收货确认" width="500px">
      <el-form label-width="100px">
        <el-form-item label="实收数量">
          <el-input-number v-model="receiveForm.quantity" :min="1" :max="maxReceiveQuantity" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="receiveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReceive">确认收货</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="restockDialogVisible" title="入库确认" width="500px">
      <el-form label-width="100px">
        <el-form-item label="入库数量">
          <el-input-number v-model="restockForm.quantity" :min="1" :max="maxRestockQuantity" />
        </el-form-item>
        <el-form-item label="入库仓位">
          <el-select v-model="restockForm.location_id" placeholder="请选择仓位">
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="restockDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmRestock">确认入库</el-button>
      </template>
    </el-dialog>

    <el-empty v-else description="加载中..." />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const returnRequest = ref(null)
const receiveDialogVisible = ref(false)
const restockDialogVisible = ref(false)
const currentReturnItem = ref(null)

const receiveForm = reactive({
  quantity: 1,
})

const restockForm = reactive({
  quantity: 1,
  location_id: null,
})

const hasPermission = (p) => userStore.hasPermission(p)

const maxReceiveQuantity = computed(() => {
  if (!currentReturnItem.value) return 1
  return currentReturnItem.value.quantity - (currentReturnItem.value.received_quantity || 0)
})

const maxRestockQuantity = computed(() => {
  if (!currentReturnItem.value) return 1
  return currentReturnItem.value.received_quantity - (currentReturnItem.value.restocked_quantity || 0)
})

onMounted(() => {
  fetchDetail()
})

async function fetchDetail() {
  try {
    const response = await request.get(`/returns/${route.params.id}`)
    returnRequest.value = response.data
  } catch (e) {
    console.error(e)
  }
}

async function handleApprove() {
  try {
    const { value: remarks } = await ElMessageBox.prompt('请输入审批意见', '审批通过', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
    })
    await request.post(`/returns/${returnRequest.value.id}/approve`, { remarks })
    ElMessage.success('审批通过')
    fetchDetail()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

async function handleReject() {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝退货', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入拒绝原因',
    })
    await request.post(`/returns/${returnRequest.value.id}/reject`, { reason })
    ElMessage.success('已拒绝退货')
    fetchDetail()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

function handleReceive(item) {
  currentReturnItem.value = item
  receiveForm.quantity = 1
  receiveDialogVisible.value = true
}

async function confirmReceive() {
  try {
    await request.post(`/return-items/${currentReturnItem.value.id}/receive`, {
      quantity: receiveForm.quantity,
    })
    ElMessage.success('收货成功')
    receiveDialogVisible.value = false
    fetchDetail()
  } catch (e) {
    console.error(e)
  }
}

function handleRestock(item) {
  currentReturnItem.value = item
  restockForm.quantity = 1
  restockForm.location_id = null
  restockDialogVisible.value = true
}

async function confirmRestock() {
  try {
    await request.post(`/return-items/${currentReturnItem.value.id}/restock`, {
      quantity: restockForm.quantity,
      location_id: restockForm.location_id,
    })
    ElMessage.success('入库成功')
    restockDialogVisible.value = false
    fetchDetail()
  } catch (e) {
    console.error(e)
  }
}

function goBack() {
  router.back()
}

function getStatusType(status) {
  const map = {
    pending: 'warning',
    approved: 'primary',
    rejected: 'danger',
    received: 'info',
    restocked: 'success',
    completed: 'success',
  }
  return map[status] || 'info'
}

function getStatusName(status) {
  const map = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝',
    received: '已收货',
    restocked: '已入库',
    completed: '已完成',
  }
  return map[status] || status
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.return-detail {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .amount-summary {
    .amount-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      &.total {
        font-size: 18px;
        font-weight: 600;
      }
    }
  }
  .text-danger {
    color: #F56C6C;
  }
  .text-muted {
    color: #909399;
    margin: 4px 0 0 0;
    font-size: 12px;
  }
}
</style>
