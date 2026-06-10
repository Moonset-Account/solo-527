<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">返工管理</h2>
      <div v-if="canManage">
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新增返工
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon warning">
            <el-icon><RefreshLeft /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">返工总数</div>
            <div class="value">{{ stats.totalRecords }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon primary">
            <el-icon><Goods /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">返工数量</div>
            <div class="value">{{ stats.totalQuantity }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon danger">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">待处理</div>
            <div class="value">{{ stats.pending }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon success">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">已完成</div>
            <div class="value">{{ stats.completed }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>返工原因分布</span>
          </template>
          <div ref="reasonChart" class="chart-small"></div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <div class="filter-bar">
          <el-form :inline="true" :model="filters">
            <el-form-item label="工单号">
              <el-input v-model="filters.workOrderId" placeholder="输入工单ID" clearable style="width: 150px" />
            </el-form-item>
            <el-form-item label="原因">
              <el-select v-model="filters.reason" placeholder="全部原因" clearable style="width: 140px">
                <el-option label="质量问题" value="quality_issue" />
                <el-option label="物料缺陷" value="material_defect" />
                <el-option label="工艺错误" value="process_error" />
                <el-option label="设计变更" value="design_change" />
                <el-option label="客户要求" value="customer_request" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 140px">
                <el-option label="待处理" value="pending" />
                <el-option label="返工中" value="reworking" />
                <el-option label="已完成" value="completed" />
                <el-option label="已报废" value="scrapped" />
              </el-select>
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="loadData">查询</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </el-form-item>
          </el-form>
        </div>

        <div class="table-container">
          <el-table :data="tableData" v-loading="loading" stripe>
            <el-table-column label="创建时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column prop="workOrder.orderNo" label="工单号" width="120" />
            <el-table-column prop="workOrder.productName" label="产品名称" min-width="120" />
            <el-table-column prop="quantity" label="返工数量" width="100" align="right" />
            <el-table-column label="原因" width="110">
              <template #default="{ row }">
                <el-tag size="small">{{ reasonText(row.reason) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small">
                  {{ statusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reworkProcess" label="返工工序" width="120" />
            <el-table-column label="处理人" width="100">
              <template #default="{ row }">{{ row.handler?.realName || '-' }}</template>
            </el-table-column>
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column label="操作" width="150" fixed="right" v-if="canManage">
              <template #default="{ row }">
                <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
                <el-dropdown @command="(cmd) => updateStatus(row, cmd)">
                  <el-button type="primary" link>状态变更</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="reworking">返工中</el-dropdown-item>
                      <el-dropdown-item command="completed">已完成</el-dropdown-item>
                      <el-dropdown-item command="scrapped">已报废</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
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
              @size-change="loadData"
              @current-change="loadData"
            />
          </div>
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="工单" prop="workOrderId">
          <el-select v-model="formData.workOrderId" filterable style="width: 100%">
            <el-option
              v-for="order in workOrderList"
              :key="order.id"
              :label="`${order.orderNo} - ${order.productName}`"
              :value="order.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="返工数量" prop="quantity">
          <el-input-number v-model="formData.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="返工原因" prop="reason">
          <el-select v-model="formData.reason" style="width: 100%">
            <el-option label="质量问题" value="quality_issue" />
            <el-option label="物料缺陷" value="material_defect" />
            <el-option label="工艺错误" value="process_error" />
            <el-option label="设计变更" value="design_change" />
            <el-option label="客户要求" value="customer_request" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="返工工序">
          <el-input v-model="formData.reworkProcess" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option label="待处理" value="pending" />
            <el-option label="返工中" value="reworking" />
            <el-option label="已完成" value="completed" />
            <el-option label="已报废" value="scrapped" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { reworkApi, workOrderApi } from '@/api/modules'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import * as echarts from 'echarts'

const userStore = useUserStore()
const canManage = computed(() => userStore.canManage)

const reasonChart = ref(null)
const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const workOrderList = ref([])
const dateRange = ref([])

const stats = reactive({
  totalRecords: 0,
  totalQuantity: 0,
  pending: 0,
  completed: 0,
})

const filters = reactive({
  workOrderId: '',
  reason: '',
  status: '',
})

const pagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
})

const dialogVisible = ref(false)
const dialogTitle = computed(() => (isEdit.value ? '编辑返工' : '新增返工'))
const isEdit = ref(false)
const formRef = ref(null)
const formData = reactive({
  id: null,
  workOrderId: null,
  quantity: 1,
  reason: 'quality_issue',
  description: '',
  reworkProcess: '',
  status: 'pending',
})

const formRules = {
  workOrderId: [{ required: true, message: '请选择工单', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  reason: [{ required: true, message: '请选择原因', trigger: 'change' }],
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

function statusText(status) {
  const map = {
    pending: '待处理',
    reworking: '返工中',
    completed: '已完成',
    scrapped: '已报废',
  }
  return map[status] || status
}

function statusType(status) {
  const map = {
    pending: 'warning',
    reworking: 'primary',
    completed: 'success',
    scrapped: 'info',
  }
  return map[status] || ''
}

function formatDateTime(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

async function loadWorkOrders() {
  try {
    const res = await workOrderApi.list({ perPage: 100 })
    workOrderList.value = res.data.data
  } catch (e) {}
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      perPage: pagination.perPage,
      ...filters,
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await reworkApi.list(params)
    tableData.value = res.data.data
    pagination.total = res.data.total || res.data.data?.length || 0
  } catch (e) {
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const res = await reworkApi.stats()
    stats.totalRecords = res.data?.totalRecords || 0
    stats.totalQuantity = res.data?.totalQuantity || 0
    const statusStats = res.data?.statusStats || {}
    stats.pending = statusStats.pending || 0
    stats.completed = statusStats.completed || 0

    await nextTick()
    if (res.data?.reasonStats) {
      initReasonChart(res.data.reasonStats)
    }
  } catch (e) {}
}

function initReasonChart(reasonStats) {
  if (!reasonChart.value) return
  const chart = echarts.init(reasonChart.value)

  const reasonLabels = {
    quality_issue: '质量问题',
    material_defect: '物料缺陷',
    process_error: '工艺错误',
    design_change: '设计变更',
    customer_request: '客户要求',
    other: '其他',
  }

  const data = Object.entries(reasonStats).map(([key, value]) => ({
    name: reasonLabels[key] || key,
    value,
  }))

  const option = {
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '55%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: {
          show: true,
          formatter: '{b}: {c}',
        },
        data,
      },
    ],
  }

  chart.setOption(option)
}

function resetFilters() {
  filters.workOrderId = ''
  filters.reason = ''
  filters.status = ''
  dateRange.value = []
  pagination.page = 1
  loadData()
}

function openCreateDialog() {
  isEdit.value = false
  Object.assign(formData, {
    id: null,
    workOrderId: null,
    quantity: 1,
    reason: 'quality_issue',
    description: '',
    reworkProcess: '',
    status: 'pending',
  })
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    workOrderId: row.workOrderId,
    quantity: row.quantity,
    reason: row.reason,
    description: row.description || '',
    reworkProcess: row.reworkProcess || '',
    status: row.status,
  })
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true

    if (isEdit.value) {
      await reworkApi.update(formData.id, formData)
      ElMessage.success('返工记录更新成功')
    } else {
      await reworkApi.create(formData)
      ElMessage.success('返工记录创建成功')
    }

    dialogVisible.value = false
    loadData()
    loadStats()
  } catch (e) {
  } finally {
    submitting.value = false
  }
}

async function updateStatus(row, status) {
  try {
    await reworkApi.update(row.id, { status })
    ElMessage.success('状态更新成功')
    loadData()
    loadStats()
  } catch (e) {}
}

onMounted(() => {
  loadWorkOrders()
  loadData()
  loadStats()
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

.stat-icon.primary { background: linear-gradient(135deg, #667eea, #764ba2); }
.stat-icon.warning { background: linear-gradient(135deg, #f6d365, #fda085); }
.stat-icon.success { background: linear-gradient(135deg, #a8edea, #fed6e3); color: #67c23a; }
.stat-icon.danger { background: linear-gradient(135deg, #ff9a9e, #fecfef); color: #f56c6c; }

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

.chart-small {
  width: 100%;
  height: 220px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
