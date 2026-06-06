<template>
  <div class="picking-detail">
    <div class="page-header">
      <h2>拣货单详情</h2>
      <div>
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>

    <el-row :gutter="20" v-if="picking">
      <el-col :span="16">
        <el-card class="mb-20">
          <template #header>
            <div class="card-header">
              <span>拣货信息</span>
              <el-tag :type="getStatusType(picking.status)" size="large">
                {{ getStatusName(picking.status) }}
              </el-tag>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="拣货单号">{{ picking.picking_no }}</el-descriptions-item>
            <el-descriptions-item label="关联订单">{{ picking.order?.order_no }}</el-descriptions-item>
            <el-descriptions-item label="客户名称">{{ picking.order?.customer?.name }}</el-descriptions-item>
            <el-descriptions-item label="拣货员">{{ picking.picker?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(picking.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ picking.started_at ? formatDate(picking.started_at) : '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="mb-20">
          <template #header>
            <div class="card-header">
              <span>拣货明细</span>
              <span>进度: {{ completedCount }}/{{ picking.items?.length || 0 }}</span>
            </div>
          </template>
          <el-table :data="picking.items" style="width: 100%">
            <el-table-column prop="product_name" label="商品名称" min-width="180" />
            <el-table-column prop="sku" label="SKU" width="120" />
            <el-table-column prop="barcode" label="条码" width="140" />
            <el-table-column prop="location_code" label="仓位" width="100">
              <template #default="{ row }">
                {{ row.location?.code || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="应拣数量" width="100" />
            <el-table-column prop="picked_quantity" label="已拣数量" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.picked_quantity >= row.quantity" type="success">已完成</el-tag>
                <el-tag v-else type="warning">待拣货</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  :disabled="row.picked_quantity >= row.quantity || picking.status !== 'picking'"
                  @click="openScanDialog(row)"
                >
                  扫描拣货
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="mb-20">
          <template #header>
            <span>拣货进度</span>
          </template>
          <el-progress
            type="dashboard"
            :percentage="picking.progress || 0"
            :width="180"
            class="progress-center"
          />
          <div class="scan-tip" v-if="picking.status === 'picking'">
            <el-alert
              title="请使用扫描枪扫描商品条码进行拣货确认"
              type="info"
              show-icon
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="scanDialogVisible" title="扫描拣货" width="500px">
      <el-form label-width="80px">
        <el-form-item label="商品条码">
          <el-input
            ref="barcodeInput"
            v-model="scanForm.barcode"
            placeholder="请扫描或输入条码"
            @keyup.enter="handleScan"
          />
        </el-form-item>
        <el-form-item label="拣货数量">
          <el-input-number v-model="scanForm.quantity" :min="1" :max="maxScanQuantity" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scanDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleScan">确认拣货</el-button>
      </template>
    </el-dialog>

    <el-empty v-else description="加载中..." />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()

const picking = ref(null)
const scanDialogVisible = ref(false)
const currentPickingItem = ref(null)
const barcodeInput = ref(null)

const scanForm = reactive({
  barcode: '',
  quantity: 1,
})

const completedCount = computed(() => {
  if (!picking.value?.items) return 0
  return picking.value.items.filter(item => item.picked_quantity >= item.quantity).length
})

const maxScanQuantity = computed(() => {
  if (!currentPickingItem.value) return 1
  return currentPickingItem.value.quantity - (currentPickingItem.value.picked_quantity || 0)
})

onMounted(() => {
  fetchDetail()
})

async function fetchDetail() {
  try {
    const response = await request.get(`/picking-lists/${route.params.id}`)
    picking.value = response.data
  } catch (e) {
    console.error(e)
  }
}

function openScanDialog(item) {
  currentPickingItem.value = item
  scanForm.barcode = item.barcode || ''
  scanForm.quantity = 1
  scanDialogVisible.value = true
  nextTick(() => {
    barcodeInput.value?.focus()
  })
}

async function handleScan() {
  if (!scanForm.barcode) {
    ElMessage.warning('请输入商品条码')
    return
  }
  try {
    await request.post(`/picking-items/${currentPickingItem.value.id}/scan`, {
      barcode: scanForm.barcode,
      quantity: scanForm.quantity,
    })
    ElMessage.success('拣货成功')
    scanDialogVisible.value = false
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
    pending: 'info',
    picking: 'warning',
    completed: 'success',
    cancelled: 'danger',
  }
  return map[status] || 'info'
}

function getStatusName(status) {
  const map = {
    pending: '待拣货',
    picking: '拣货中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.picking-detail {
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
  .progress-center {
    display: flex;
    justify-content: center;
    margin: 20px 0;
  }
  .scan-tip {
    margin-top: 20px;
  }
}
</style>
