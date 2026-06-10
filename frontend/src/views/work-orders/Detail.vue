<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <el-button @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title" style="display: inline; margin-left: 12px">
          工单详情 - {{ workOrder?.orderNo }}
        </h2>
      </div>
      <div v-if="canManage">
        <el-button type="primary" @click="openScheduleDialog">
          <el-icon><Calendar /></el-icon>
          排产
        </el-button>
      </div>
    </div>

    <el-descriptions title="基本信息" :column="3" border>
      <el-descriptions-item label="工单号">{{ workOrder?.orderNo }}</el-descriptions-item>
      <el-descriptions-item label="产品名称">{{ workOrder?.productName }}</el-descriptions-item>
      <el-descriptions-item label="规格型号">{{ workOrder?.productModel || '-' }}</el-descriptions-item>
      <el-descriptions-item label="数量">{{ workOrder?.quantity }}</el-descriptions-item>
      <el-descriptions-item label="已完成">{{ workOrder?.completedQuantity }}</el-descriptions-item>
      <el-descriptions-item label="完成率">
        <el-progress :percentage="workOrder?.completionRate || 0" :stroke-width="10" />
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <span :class="`status-tag status-${workOrder?.status}`">{{ statusText(workOrder?.status) }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="优先级">
        <span :class="`priority-${workOrder?.priority}`">{{ priorityText(workOrder?.priority) }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="客户">{{ workOrder?.customerName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="计划开始">{{ formatDate(workOrder?.plannedStartDate) }}</el-descriptions-item>
      <el-descriptions-item label="计划结束">{{ formatDate(workOrder?.plannedEndDate) }}</el-descriptions-item>
      <el-descriptions-item label="交期">
        <span :class="{ 'text-danger': workOrder?.isDelayed }">
          {{ formatDate(workOrder?.deliveryDate) }}
        </span>
      </el-descriptions-item>
      <el-descriptions-item label="实际开始">{{ formatDate(workOrder?.actualStartDate) }}</el-descriptions-item>
      <el-descriptions-item label="实际结束">{{ formatDate(workOrder?.actualEndDate) }}</el-descriptions-item>
      <el-descriptions-item label="责任人">{{ workOrder?.assignee?.realName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="创建人">{{ workOrder?.creator?.realName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ formatDateTime(workOrder?.createdAt) }}</el-descriptions-item>
      <el-descriptions-item label="备注" :span="3">
        {{ workOrder?.remarks || '-' }}
      </el-descriptions-item>
    </el-descriptions>

    <el-card class="section-card" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>物料齐套</span>
          <el-tag :type="materialsReady ? 'success' : 'warning'">
            齐套率: {{ readyCount }}/{{ totalCount }}
          </el-tag>
        </div>
      </template>
      <el-table :data="workOrder?.materials || []" size="small">
        <el-table-column prop="material.materialCode" label="物料编码" width="120" />
        <el-table-column prop="material.materialName" label="物料名称" />
        <el-table-column prop="material.specification" label="规格" width="120" />
        <el-table-column prop="material.unit" label="单位" width="80" />
        <el-table-column prop="requiredQuantity" label="需求数量" width="100" align="right" />
        <el-table-column prop="allocatedQuantity" label="已分配" width="100" align="right" />
        <el-table-column prop="material.stockQuantity" label="库存" width="100" align="right" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isReady ? 'success' : 'warning'">
              {{ row.isReady ? '已齐套' : '缺料' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remarks" label="备注" />
      </el-table>
    </el-card>

    <el-card class="section-card" style="margin-top: 20px">
      <template #header>
        <span>排产计划</span>
      </template>
      <el-table :data="workOrder?.schedules || []" size="small">
        <el-table-column label="排产日期" width="120">
          <template #default="{ row }">{{ formatDate(row.scheduleDate) }}</template>
        </el-table-column>
        <el-table-column prop="workshop" label="车间" width="100" />
        <el-table-column prop="line" label="产线" width="100" />
        <el-table-column prop="shift" label="班次" width="100">
          <template #default="{ row }">{{ shiftText(row.shift) }}</template>
        </el-table-column>
        <el-table-column prop="plannedQuantity" label="计划数量" width="100" align="right" />
        <el-table-column prop="actualQuantity" label="实际数量" width="100" align="right" />
        <el-table-column prop="notes" label="备注" />
      </el-table>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card class="section-card">
          <template #header>
            <span>返工记录</span>
          </template>
          <el-table :data="workOrder?.reworks || []" size="small">
            <el-table-column prop="quantity" label="数量" width="80" align="right" />
            <el-table-column label="原因" width="120">
              <template #default="{ row }">{{ reasonText(row.reason) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ reworkStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="section-card">
          <template #header>
            <span>风险记录</span>
          </template>
          <el-table :data="workOrder?.riskLogs || []" size="small">
            <el-table-column label="等级" width="80">
              <template #default="{ row }">
                <span :class="`risk-${row.riskLevel}`">{{ riskLevelText(row.riskLevel) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="riskType" label="类型" width="120" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 'open' ? 'danger' : 'success'">
                  {{ riskStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="scheduleDialogVisible" title="新建排产计划" width="500px">
      <el-form :model="scheduleForm" label-width="100px">
        <el-form-item label="排产日期">
          <el-date-picker v-model="scheduleForm.scheduleDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="车间">
          <el-input v-model="scheduleForm.workshop" placeholder="如：一车间" />
        </el-form-item>
        <el-form-item label="产线">
          <el-input v-model="scheduleForm.line" placeholder="如：A线" />
        </el-form-item>
        <el-form-item label="班次">
          <el-select v-model="scheduleForm.shift" placeholder="请选择" style="width: 100%">
            <el-option label="早班" value="morning" />
            <el-option label="中班" value="afternoon" />
            <el-option label="晚班" value="night" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划数量">
          <el-input-number v-model="scheduleForm.plannedQuantity" :min="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="scheduleForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scheduleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createSchedule">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { workOrderApi, scheduleApi } from '@/api/modules'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const userStore = useUserStore()
const canManage = computed(() => userStore.canManage)

const workOrder = ref(null)

const materialsReady = computed(() => {
  if (!workOrder.value?.materials?.length) return false
  return workOrder.value.materials.every((m) => m.isReady)
})

const readyCount = computed(() => {
  return workOrder.value?.materials?.filter((m) => m.isReady).length || 0
})

const totalCount = computed(() => {
  return workOrder.value?.materials?.length || 0
})

const scheduleDialogVisible = ref(false)
const scheduleForm = reactive({
  scheduleDate: '',
  workshop: '',
  line: '',
  shift: '',
  plannedQuantity: 100,
  notes: '',
})

function statusText(status) {
  const map = {
    pending: '待排产',
    scheduled: '已排产',
    in_production: '生产中',
    completed: '已完成',
    delayed: '已延期',
    cancelled: '已取消',
  }
  return map[status] || status
}

function priorityText(priority) {
  const map = { low: '低', medium: '中', high: '高', urgent: '紧急' }
  return map[priority] || priority
}

function reasonText(reason) {
  const map = {
    quality_issue: '质量问题',
    material_defect: '物料缺陷',
    process_error: '工艺错误',
    design_change: '设计变更',
    customer_request: '客户要求',
    other: '其他',
  }
  return map[reason] || reason
}

function reworkStatusText(status) {
  const map = {
    pending: '待处理',
    reworking: '返工中',
    completed: '已完成',
    scrapped: '已报废',
  }
  return map[status] || status
}

function riskLevelText(level) {
  const map = { low: '低', medium: '中', high: '高', critical: '紧急' }
  return map[level] || level
}

function riskStatusText(status) {
  const map = {
    open: '待处理',
    mitigated: '已缓解',
    resolved: '已解决',
    closed: '已关闭',
  }
  return map[status] || status
}

function shiftText(shift) {
  const map = { morning: '早班', afternoon: '中班', night: '晚班' }
  return map[shift] || '-'
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

function formatDateTime(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

async function loadDetail() {
  try {
    const res = await workOrderApi.detail(route.params.id)
    workOrder.value = res.data
  } catch (e) {}
}

function openScheduleDialog() {
  scheduleForm.scheduleDate = dayjs().format('YYYY-MM-DD')
  scheduleForm.workshop = ''
  scheduleForm.line = ''
  scheduleForm.shift = 'morning'
  scheduleForm.plannedQuantity = workOrder.value?.quantity || 100
  scheduleForm.notes = ''
  scheduleDialogVisible.value = true
}

async function createSchedule() {
  try {
    await scheduleApi.create({
      ...scheduleForm,
      workOrderId: workOrder.value.id,
    })
    ElMessage.success('排产计划创建成功')
    scheduleDialogVisible.value = false
    loadDetail()
  } catch (e) {}
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.text-danger {
  color: #f56c6c;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-card {
  margin-bottom: 20px;
}
</style>
