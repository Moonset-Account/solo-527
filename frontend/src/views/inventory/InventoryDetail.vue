<template>
  <div v-loading="loading">
    <div class="page-header">
      <div>
        <el-button text @click="goBack" style="padding-left: 0">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title">库存详情</h2>
      </div>
      <el-button type="primary" @click="handleAdjust">
        <el-icon><Edit /></el-icon>
        调整库存
      </el-button>
    </div>

    <div class="card mb-20">
      <div class="section-title">库存概况</div>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="路线名称">{{ data.schedule?.tourName }}</el-descriptions-item>
        <el-descriptions-item label="路线编码">{{ data.schedule?.tourCode }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ data.schedule?.tourDate }}</el-descriptions-item>
        <el-descriptions-item label="时间">
          {{ data.schedule?.startTime }} - {{ data.schedule?.endTime }}
        </el-descriptions-item>
        <el-descriptions-item label="总容量">{{ data.schedule?.capacity }} 人</el-descriptions-item>
        <el-descriptions-item label="已售">{{ data.schedule?.booked }} 人</el-descriptions-item>
        <el-descriptions-item label="可用">
          <span :class="{ 'low-stock': data.schedule?.available <= 3 }">
            {{ data.schedule?.available }} 人
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="司机">
          {{ data.schedule?.driver?.name || '未分配' }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="card">
      <div class="section-title">库存变动记录</div>
      <el-table :data="data.logs || []" stripe>
        <el-table-column prop="id" label="记录ID" width="100" />
        <el-table-column label="变动类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getChangeType(row.changeType)" size="small">
              {{ formatChangeType(row.changeType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="变动数量" width="120">
          <template #default="{ row }">
            <span :class="row.quantityChange > 0 ? 'positive' : 'negative'">
              {{ row.quantityChange > 0 ? '+' : '' }}{{ row.quantityChange }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="变动前" width="100">
          <template #default="{ row }">{{ row.beforeQuantity }}</template>
        </el-table-column>
        <el-table-column label="变动后" width="100">
          <template #default="{ row }">{{ row.afterQuantity }}</template>
        </el-table-column>
        <el-table-column label="关联订单" width="160">
          <template #default="{ row }">
            {{ row.order?.orderNo || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作人" width="120">
          <template #default="{ row }">
            {{ row.operator?.name || '系统' }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="adjustDialogVisible" title="调整库存" width="500px">
      <el-form :model="adjustForm" label-width="100px">
        <el-form-item label="调整数量">
          <el-input-number v-model="adjustForm.quantity" :min="-100" :max="100" />
          <span style="margin-left: 12px; color: #909399; font-size: 12px">正数增加，负数减少</span>
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="adjustForm.remark" type="textarea" :rows="3" placeholder="请输入调整原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdjust" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getInventoryDetail, adjustInventory } from '@/api/inventory'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const data = ref({ schedule: null, logs: [] })

const adjustDialogVisible = ref(false)
const submitting = ref(false)
const adjustForm = reactive({
  quantity: 0,
  remark: ''
})

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getInventoryDetail(route.params.id)
    data.value = res
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const handleAdjust = () => {
  adjustForm.quantity = 0
  adjustForm.remark = ''
  adjustDialogVisible.value = true
}

const submitAdjust = async () => {
  submitting.value = true
  try {
    await adjustInventory(route.params.id, adjustForm.quantity, adjustForm.remark)
    ElMessage.success('调整成功')
    adjustDialogVisible.value = false
    fetchData()
  } catch (e) {
    // handled
  } finally {
    submitting.value = false
  }
}

const formatChangeType = (type) => {
  const map = {
    order: '下单',
    cancel: '取消',
    refund: '退款',
    adjust: '手动调整',
    system: '系统调整'
  }
  return map[type] || type
}

const getChangeType = (type) => {
  const map = {
    order: 'success',
    cancel: 'info',
    refund: 'warning',
    adjust: '',
    system: 'danger'
  }
  return map[type] || 'info'
}

const formatDateTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

.low-stock {
  color: #f56c6c;
  font-weight: 600;
}
</style>
