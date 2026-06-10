<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">交期风险</h2>
      <div v-if="canManage">
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新增风险
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card critical">
          <div class="stat-icon">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">紧急风险</div>
            <div class="value">{{ riskStats.critical }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card high">
          <div class="stat-icon">
            <el-icon><Bell /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">高风险</div>
            <div class="value">{{ riskStats.high }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card medium">
          <div class="stat-icon">
            <el-icon><InfoFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">中风险</div>
            <div class="value">{{ riskStats.medium }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card low">
          <div class="stat-icon">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">已处理</div>
            <div class="value">{{ riskStats.resolved }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="10">
        <el-card>
          <template #header>
            <span>高风险工单</span>
          </template>
          <div class="high-risk-list">
            <div v-for="order in highRiskOrders" :key="order.id" class="risk-order-item">
              <div class="order-header">
                <span class="order-no">{{ order.orderNo }}</span>
                <span :class="`risk-tag risk-${order.riskLogs?.[0]?.riskLevel || 'high'}`">
                  {{ riskLevelText(order.riskLogs?.[0]?.riskLevel) }}
                </span>
              </div>
              <div class="order-name">{{ order.productName }}</div>
              <div class="order-info">
                <span>数量: {{ order.quantity }}</span>
                <span :class="{ 'text-danger': isDelayed(order) }">
                  交期: {{ formatDate(order.deliveryDate) }}
                </span>
              </div>
              <el-button type="primary" link size="small" @click="viewOrder(order.id)">查看详情</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="14">
        <el-card>
          <template #header>
            <span>风险趋势</span>
          </template>
          <div ref="riskChart" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>风险记录</span>
          <div>
            <el-select v-model="filters.riskLevel" placeholder="风险等级" clearable size="small" style="width: 120px; margin-right: 10px">
              <el-option label="紧急" value="critical" />
              <el-option label="高" value="high" />
              <el-option label="中" value="medium" />
              <el-option label="低" value="low" />
            </el-select>
            <el-select v-model="filters.status" placeholder="处理状态" clearable size="small" style="width: 120px; margin-right: 10px">
              <el-option label="待处理" value="open" />
              <el-option label="已缓解" value="mitigated" />
              <el-option label="已解决" value="resolved" />
              <el-option label="已关闭" value="closed" />
            </el-select>
            <el-button type="primary" size="small" @click="loadRisks">查询</el-button>
          </div>
        </div>
      </template>

      <el-table :data="riskList" v-loading="loading" stripe>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="workOrder.orderNo" label="工单号" width="120" />
        <el-table-column prop="workOrder.productName" label="产品名称" min-width="120" />
        <el-table-column label="风险等级" width="100">
          <template #default="{ row }">
            <span :class="`risk-tag risk-${row.riskLevel}`">{{ riskLevelText(row.riskLevel) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="riskType" label="风险类型" width="130" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column label="处理人" width="100">
          <template #default="{ row }">{{ row.actor?.realName || '-' }}</template>
        </el-table-column>
        <el-table-column label="处理时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.actionAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" v-if="canManage">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              v-if="row.status === 'open' || row.status === 'mitigated'"
              @click="openHandleDialog(row)"
            >
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.perPage"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadRisks"
          @current-change="loadRisks"
        />
      </div>
    </el-card>

    <el-dialog v-model="handleDialogVisible" title="处理风险" width="500px">
      <el-form ref="handleFormRef" :model="handleForm" :rules="handleRules" label-width="100px">
        <el-form-item label="处理措施" prop="actionTaken">
          <el-input v-model="handleForm.actionTaken" type="textarea" :rows="4" placeholder="请填写处理措施" />
        </el-form-item>
        <el-form-item label="处理结果" prop="status">
          <el-radio-group v-model="handleForm.status">
            <el-radio value="mitigated">已缓解</el-radio>
            <el-radio value="resolved">已解决</el-radio>
            <el-radio value="closed">已关闭</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="createDialogVisible" title="新增风险" width="500px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="关联工单" prop="workOrderId">
          <el-select v-model="createForm.workOrderId" filterable style="width: 100%">
            <el-option
              v-for="order in workOrderList"
              :key="order.id"
              :label="`${order.orderNo} - ${order.productName}`"
              :value="order.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级" prop="riskLevel">
          <el-select v-model="createForm.riskLevel" style="width: 100%">
            <el-option label="紧急" value="critical" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险类型" prop="riskType">
          <el-input v-model="createForm.riskType" placeholder="如：物料短缺、交期紧张等" />
        </el-form-item>
        <el-form-item label="风险描述">
          <el-input v-model="createForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { riskApi, workOrderApi } from '@/api/modules'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import * as echarts from 'echarts'

const router = useRouter()
const userStore = useUserStore()
const canManage = computed(() => userStore.canManage)

const riskChart = ref(null)
const loading = ref(false)
const submitting = ref(false)
const riskList = ref([])
const highRiskOrders = ref([])
const workOrderList = ref([])

const riskStats = reactive({
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  resolved: 0,
})

const filters = reactive({
  riskLevel: '',
  status: '',
})

const pagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
})

const handleDialogVisible = ref(false)
const handleFormRef = ref(null)
const handleForm = reactive({
  id: null,
  actionTaken: '',
  status: 'mitigated',
})

const handleRules = {
  actionTaken: [{ required: true, message: '请填写处理措施', trigger: 'blur' }],
  status: [{ required: true, message: '请选择处理结果', trigger: 'change' }],
}

const createDialogVisible = ref(false)
const createFormRef = ref(null)
const createForm = reactive({
  workOrderId: null,
  riskLevel: 'medium',
  riskType: '',
  description: '',
})

const createRules = {
  workOrderId: [{ required: true, message: '请选择工单', trigger: 'change' }],
  riskLevel: [{ required: true, message: '请选择风险等级', trigger: 'change' }],
  riskType: [{ required: true, message: '请填写风险类型', trigger: 'blur' }],
}

function riskLevelText(level) {
  const map = { low: '低', medium: '中', high: '高', critical: '紧急' }
  return map[level] || '中'
}

function statusText(status) {
  const map = {
    open: '待处理',
    mitigated: '已缓解',
    resolved: '已解决',
    closed: '已关闭',
  }
  return map[status] || status
}

function statusType(status) {
  const map = {
    open: 'danger',
    mitigated: 'warning',
    resolved: 'success',
    closed: 'info',
  }
  return map[status] || ''
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

function formatDateTime(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

function isDelayed(row) {
  if (!row.deliveryDate) return false
  return dayjs(row.deliveryDate).isBefore(dayjs(), 'day') && row.status !== 'completed'
}

function viewOrder(id) {
  router.push(`/work-orders/${id}`)
}

async function loadWorkOrders() {
  try {
    const res = await workOrderApi.list({ perPage: 100 })
    workOrderList.value = res.data.data
  } catch (e) {}
}

async function loadRisks() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      perPage: pagination.perPage,
      ...filters,
    }
    const res = await riskApi.list(params)
    riskList.value = res.data.data
    pagination.total = res.data.total || res.data.data?.length || 0
  } catch (e) {
  } finally {
    loading.value = false
  }
}

async function loadHighRiskOrders() {
  try {
    const res = await riskApi.highRiskOrders()
    highRiskOrders.value = res.data?.slice(0, 5) || []
  } catch (e) {}
}

async function loadReport() {
  try {
    const startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
    const endDate = dayjs().format('YYYY-MM-DD')
    const res = await riskApi.report({ startDate, endDate })

    const data = res.data || {}
    const byLevel = data.byLevel || []

    byLevel.forEach((item) => {
      if (item.level === 'critical') riskStats.critical = item.count
      else if (item.level === 'high') riskStats.high = item.count
      else if (item.level === 'medium') riskStats.medium = item.count
      else if (item.level === 'low') riskStats.low = item.count
    })

    const byStatus = data.byStatus || []
    byStatus.forEach((item) => {
      if (['resolved', 'closed', 'mitigated'].includes(item.status)) {
        riskStats.resolved += item.count
      }
    })

    await nextTick()
    initRiskChart(data.byType || [])
  } catch (e) {}
}

function initRiskChart(byType) {
  if (!riskChart.value) return
  const chart = echarts.init(riskChart.value)

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: byType.map((item) => item.type),
      axisLabel: { rotate: 30 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'bar',
        data: byType.map((item) => item.count),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#83bff6' },
            { offset: 0.5, color: '#188df0' },
            { offset: 1, color: '#188df0' },
          ]),
        },
      },
    ],
  }

  chart.setOption(option)
}

function openCreateDialog() {
  Object.assign(createForm, {
    workOrderId: null,
    riskLevel: 'medium',
    riskType: '',
    description: '',
  })
  createDialogVisible.value = true
}

async function submitCreate() {
  if (!createFormRef.value) return
  try {
    await createFormRef.value.validate()
    submitting.value = true

    await riskApi.create(createForm)
    ElMessage.success('风险记录创建成功')
    createDialogVisible.value = false
    loadRisks()
    loadReport()
  } catch (e) {
  } finally {
    submitting.value = false
  }
}

function openHandleDialog(row) {
  handleForm.id = row.id
  handleForm.actionTaken = ''
  handleForm.status = 'mitigated'
  handleDialogVisible.value = true
}

async function submitHandle() {
  if (!handleFormRef.value) return
  try {
    await handleFormRef.value.validate()
    submitting.value = true

    await riskApi.handle(handleForm.id, {
      actionTaken: handleForm.actionTaken,
      status: handleForm.status,
    })
    ElMessage.success('风险处理成功')
    handleDialogVisible.value = false
    loadRisks()
    loadReport()
    loadHighRiskOrders()
  } catch (e) {
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadWorkOrders()
  loadRisks()
  loadHighRiskOrders()
  loadReport()
})
</script>

<style scoped>
.stat-cards {
  margin-bottom: 10px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.stat-card.critical .stat-icon { background: linear-gradient(135deg, #ff0844, #ffb199); }
.stat-card.high .stat-icon { background: linear-gradient(135deg, #ff9a9e, #fecfef); }
.stat-card.medium .stat-icon { background: linear-gradient(135deg, #f6d365, #fda085); }
.stat-card.low .stat-icon { background: linear-gradient(135deg, #a8edea, #fed6e3); color: #67c23a; }

.stat-content .label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-content .value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.risk-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.risk-critical { background: #fef0f0; color: #ff0000; font-weight: bold; }
.risk-high { background: #fef0f0; color: #f56c6c; }
.risk-medium { background: #fdf6ec; color: #e6a23c; }
.risk-low { background: #f0f9eb; color: #67c23a; }

.high-risk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.risk-order-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  border-left: 4px solid #f56c6c;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.order-no {
  font-weight: 600;
  color: #303133;
}

.order-name {
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
}

.order-info {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #909399;
}

.text-danger {
  color: #f56c6c;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart {
  width: 100%;
  height: 280px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
