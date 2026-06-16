<template>
  <div class="page-container">
    <el-card style="margin-bottom: 16px">
      <template #header>订单基本信息</template>
      <el-descriptions :column="5" border size="small">
        <el-descriptions-item label="订单号">{{ orderInfo.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="收件人">{{ orderInfo.receiverName }}</el-descriptions-item>
        <el-descriptions-item label="地址">{{ orderInfo.receiverAddress }}</el-descriptions-item>
        <el-descriptions-item label="站点">{{ orderInfo.stationName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagType(orderInfo.status)" size="small">{{ orderInfo.statusLabel || orderInfo.status }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="16" style="margin-bottom: 16px">
      <el-col :span="8">
        <el-card>
          <template #header>签收差异</template>
          <el-table :data="signDiffList" stripe size="small" max-height="300">
            <el-table-column prop="skuName" label="商品" width="100" />
            <el-table-column prop="expectedQty" label="期望数量" width="80" align="center" />
            <el-table-column prop="actualQty" label="实际数量" width="80" align="center" />
            <el-table-column prop="diffQty" label="差异数量" width="80" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.diffQty !== 0 ? '#f56c6c' : '#67c23a' }">{{ row.diffQty }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="diffReason" label="差异原因" show-overflow-tooltip />
          </el-table>
          <div v-if="signDiffList.length === 0" style="text-align:center; padding:20px; color:#909399">
            暂无签收数据
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>站点库存</template>
          <el-table :data="inventoryList" stripe size="small" max-height="300">
            <el-table-column prop="skuCode" label="SKU编码" width="120" />
            <el-table-column prop="skuName" label="SKU名称" show-overflow-tooltip />
            <el-table-column prop="quantity" label="库存数量" width="90" align="center">
              <template #default="{ row }">
                <span :style="{ color: row.quantity < 10 ? '#f56c6c' : '' }">{{ row.quantity }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>配送订单详情</template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="订单状态">
              <el-tag :type="statusTagType(orderInfo.status)" size="small">{{ orderInfo.statusLabel || orderInfo.status }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ formatTime(orderInfo.createTime) }}</el-descriptions-item>
            <el-descriptions-item label="接单时间">{{ formatTime(orderInfo.acceptTime) }}</el-descriptions-item>
            <el-descriptions-item label="取货时间">{{ formatTime(orderInfo.pickupTime) }}</el-descriptions-item>
            <el-descriptions-item label="送达时间">{{ formatTime(orderInfo.deliverTime) }}</el-descriptions-item>
            <el-descriptions-item label="签收时间">{{ formatTime(orderInfo.signTime) }}</el-descriptions-item>
            <el-descriptions-item label="承诺时效">{{ formatTime(orderInfo.promiseTime) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>操作留痕</template>
      <el-timeline>
        <el-timeline-item
          v-for="(log, idx) in operationLogs"
          :key="idx"
          :timestamp="log.time"
          :type="log.type"
          placement="top"
        >
          <div style="font-size: 13px">{{ log.content }}</div>
          <div v-if="log.operator" style="font-size: 12px; color: #909399">操作人：{{ log.operator }}</div>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getTodoDetail } from '../api/order'
import dayjs from 'dayjs'

const route = useRoute()
const orderId = route.params.id

const orderInfo = ref({})
const signDiffList = ref([])
const inventoryList = ref([])
const operationLogs = ref([])

function statusTagType(status) {
  const map = {
    PENDING: 'info', ACCEPTED: '', PICKED_UP: 'warning',
    DELIVERING: 'primary', SIGNED: 'success', EXCEPTION: 'danger'
  }
  return map[status] || ''
}

function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

async function loadData() {
  try {
    const res = await getTodoDetail(orderId)
    const data = res.data
    orderInfo.value = data || {}

    if (data.signRecord) {
      signDiffList.value = [
        {
          skuName: '主商品',
          expectedQty: data.signRecord.expectedQty || 0,
          actualQty: data.signRecord.actualQty || 0,
          diffQty: data.signRecord.diffQty || 0,
          diffReason: data.signRecord.diffReason || ''
        }
      ]
    }

    inventoryList.value = data.stationInventoryList || []

    operationLogs.value = buildOperationLogs(data)
  } catch (e) {
    console.error('待办详情加载失败', e)
  }
}

function buildOperationLogs(data) {
  const logs = []
  if (data.signTime) {
    logs.push({ time: formatTime(data.signTime), content: '订单已签收', type: 'success', operator: '骑手' })
  }
  if (data.deliverTime) {
    logs.push({ time: formatTime(data.deliverTime), content: '骑手正在配送', type: 'primary', operator: '骑手' })
  }
  if (data.pickupTime) {
    logs.push({ time: formatTime(data.pickupTime), content: '骑手取货出发', type: 'primary', operator: '骑手' })
  }
  if (data.acceptTime) {
    logs.push({ time: formatTime(data.acceptTime), content: '骑手确认接单', type: 'primary', operator: '骑手' })
  }
  if (data.createTime) {
    logs.push({ time: formatTime(data.createTime), content: '系统派单', type: 'info', operator: '系统' })
  }
  return logs
}

onMounted(loadData)
</script>

<style scoped>
.page-container {
  padding: 16px;
}
</style>
