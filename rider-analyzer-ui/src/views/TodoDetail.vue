<template>
  <div class="page-container">
    <el-card style="margin-bottom: 16px">
      <template #header>订单基本信息</template>
      <el-descriptions :column="5" border size="small">
        <el-descriptions-item label="订单号">{{ orderInfo.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="收件人">{{ orderInfo.receiverName }}</el-descriptions-item>
        <el-descriptions-item label="地址">{{ orderInfo.address }}</el-descriptions-item>
        <el-descriptions-item label="骑手">{{ orderInfo.riderName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="orderInfo.status === 'SIGNED' ? 'success' : 'warning'" size="small">{{ orderInfo.statusLabel }}</el-tag>
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
              <el-tag :type="deliveryDetail.statusType" size="small">{{ deliveryDetail.status }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="下单时间">{{ deliveryDetail.orderTime }}</el-descriptions-item>
            <el-descriptions-item label="接单时间">{{ deliveryDetail.acceptTime }}</el-descriptions-item>
            <el-descriptions-item label="取货时间">{{ deliveryDetail.pickupTime }}</el-descriptions-item>
            <el-descriptions-item label="送达时间">{{ deliveryDetail.deliverTime }}</el-descriptions-item>
            <el-descriptions-item label="承诺时效">{{ deliveryDetail.promiseTime }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <template #header>操作留痕</template>
      <el-timeline>
        <el-timeline-item
          v-for="log in operationLogs"
          :key="log.time"
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
import { getStationInventory } from '../api/station'

const route = useRoute()
const orderId = route.params.id

const orderInfo = ref({
  orderNo: '',
  receiverName: '',
  address: '',
  riderName: '',
  status: '',
  statusLabel: ''
})

const signDiffList = ref([])
const inventoryList = ref([])
const deliveryDetail = ref({
  status: '',
  statusType: '',
  orderTime: '',
  acceptTime: '',
  pickupTime: '',
  deliverTime: '',
  promiseTime: ''
})
const operationLogs = ref([])

async function loadData() {
  try {
    const res = await getTodoDetail(orderId)
    const data = res.data
    orderInfo.value = data.orderInfo || orderInfo.value
    signDiffList.value = data.signDiffList || []
    deliveryDetail.value = data.deliveryDetail || deliveryDetail.value
    operationLogs.value = data.operationLogs || []
    if (data.orderInfo?.stationId) {
      const invRes = await getStationInventory(data.orderInfo.stationId)
      inventoryList.value = invRes.data?.list || []
    }
  } catch {
    orderInfo.value = {
      orderNo: `ORD-${orderId}`,
      receiverName: '张三',
      address: '朝阳区建国路88号',
      riderName: '骑手A',
      status: 'DELIVERING',
      statusLabel: '配送中'
    }
    signDiffList.value = [
      { skuName: '商品A', expectedQty: 10, actualQty: 10, diffQty: 0, diffReason: '' },
      { skuName: '商品B', expectedQty: 5, actualQty: 4, diffQty: -1, diffReason: '配送途中破损' },
      { skuName: '商品C', expectedQty: 8, actualQty: 7, diffQty: -1, diffReason: '数量不足' }
    ]
    inventoryList.value = [
      { skuCode: 'SKU-001', skuName: '商品A', quantity: 120 },
      { skuCode: 'SKU-002', skuName: '商品B', quantity: 8 },
      { skuCode: 'SKU-003', skuName: '商品C', quantity: 45 },
      { skuCode: 'SKU-004', skuName: '商品D', quantity: 3 }
    ]
    deliveryDetail.value = {
      status: '配送中',
      statusType: 'warning',
      orderTime: '2026-06-16 10:00',
      acceptTime: '2026-06-16 10:05',
      pickupTime: '2026-06-16 10:30',
      deliverTime: '-',
      promiseTime: '90分钟'
    }
    operationLogs.value = [
      { time: '2026-06-16 10:30', content: '骑手取货出发', type: 'primary', operator: '骑手A' },
      { time: '2026-06-16 10:05', content: '骑手确认接单', type: 'primary', operator: '骑手A' },
      { time: '2026-06-16 10:00', content: '系统派单', type: 'info', operator: '系统' }
    ]
  }
}

onMounted(loadData)
</script>
