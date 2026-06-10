<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">产量工时</h2>
      <div v-if="canManage">
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          录入产量
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon primary">
            <el-icon><Histogram /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">总产量</div>
            <div class="value">{{ summary.totalOutput }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon warning">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">不良品</div>
            <div class="value">{{ summary.totalDefect }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon success">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">总工时</div>
            <div class="value">{{ summary.totalWorkHours }}h</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon info">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="label">不良率</div>
            <div class="value">{{ summary.defectRate }}%</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>产量趋势</span>
              <el-radio-group v-model="period" size="small" @change="loadSummary">
                <el-radio-button value="7">近7天</el-radio-button>
                <el-radio-button value="30">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="productionChart" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>车间工时统计</span>
          </template>
          <el-table :data="workshopStats" size="small">
            <el-table-column prop="workshop" label="车间" />
            <el-table-column prop="totalOutput" label="产量" align="right" />
            <el-table-column prop="totalWorkHours" label="工时" align="right" />
            <el-table-column prop="efficiency" label="效率(件/h)" align="right" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>生产记录</span>
          <div>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              size="small"
              @change="loadData"
              style="margin-right: 10px"
            />
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column label="生产日期" width="120">
          <template #default="{ row }">{{ formatDate(row.productionDate) }}</template>
        </el-table-column>
        <el-table-column prop="workOrder.orderNo" label="工单号" width="120" />
        <el-table-column prop="workOrder.productName" label="产品名称" min-width="120" />
        <el-table-column prop="workshop" label="车间" width="100" />
        <el-table-column prop="shift" label="班次" width="80">
          <template #default="{ row }">{{ shiftText(row.shift) }}</template>
        </el-table-column>
        <el-table-column prop="outputQuantity" label="合格数" width="100" align="right" />
        <el-table-column prop="defectQuantity" label="不良数" width="100" align="right" />
        <el-table-column prop="workHours" label="工作时长" width="100" align="right">
          <template #default="{ row }">{{ row.workHours }}h</template>
        </el-table-column>
        <el-table-column prop="manHours" label="人天" width="100" align="right">
          <template #default="{ row }">{{ row.manHours }}</template>
        </el-table-column>
        <el-table-column prop="operatorCount" label="人数" width="80" align="right" />
        <el-table-column label="不良率" width="100" align="right">
          <template #default="{ row }">
            {{ row.outputQuantity > 0 ? ((row.defectQuantity / row.outputQuantity) * 100).toFixed(2) + '%' : '0%' }}
          </template>
        </el-table-column>
        <el-table-column label="记录人" width="100">
          <template #default="{ row }">{{ row.recorder?.realName || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" v-if="canManage">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
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
    </el-card>

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
        <el-form-item label="生产日期" prop="productionDate">
          <el-date-picker v-model="formData.productionDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="车间">
          <el-input v-model="formData.workshop" />
        </el-form-item>
        <el-form-item label="班次">
          <el-select v-model="formData.shift" placeholder="请选择" style="width: 100%">
            <el-option label="早班" value="morning" />
            <el-option label="中班" value="afternoon" />
            <el-option label="晚班" value="night" />
          </el-select>
        </el-form-item>
        <el-form-item label="合格数量" prop="outputQuantity">
          <el-input-number v-model="formData.outputQuantity" :min="0" />
        </el-form-item>
        <el-form-item label="不良数量">
          <el-input-number v-model="formData.defectQuantity" :min="0" />
        </el-form-item>
        <el-form-item label="工作时长">
          <el-input-number v-model="formData.workHours" :min="0" :precision="1" :step="0.5" />
        </el-form-item>
        <el-form-item label="人天">
          <el-input-number v-model="formData.manHours" :min="0" :precision="1" :step="0.5" />
        </el-form-item>
        <el-form-item label="操作人数">
          <el-input-number v-model="formData.operatorCount" :min="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remarks" type="textarea" :rows="2" />
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
import { productionApi, workOrderApi } from '@/api/modules'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import * as echarts from 'echarts'

const userStore = useUserStore()
const canManage = computed(() => userStore.canManage)

const productionChart = ref(null)
const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const workOrderList = ref([])
const workshopStats = ref([])
const period = ref('7')

const dateRange = ref([
  dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD'),
])

const summary = reactive({
  totalOutput: 0,
  totalDefect: 0,
  totalWorkHours: 0,
  defectRate: '0.00',
})

const pagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
})

const dialogVisible = ref(false)
const dialogTitle = computed(() => (isEdit.value ? '编辑产量记录' : '录入产量'))
const isEdit = ref(false)
const formRef = ref(null)
const formData = reactive({
  id: null,
  workOrderId: null,
  productionDate: '',
  workshop: '',
  shift: '',
  outputQuantity: 0,
  defectQuantity: 0,
  workHours: 0,
  manHours: 0,
  operatorCount: 0,
  remarks: '',
})

const formRules = {
  workOrderId: [{ required: true, message: '请选择工单', trigger: 'change' }],
  productionDate: [{ required: true, message: '请选择日期', trigger: 'change' }],
  outputQuantity: [{ required: true, message: '请输入产量', trigger: 'blur' }],
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

function shiftText(shift) {
  const map = { morning: '早班', afternoon: '中班', night: '晚班' }
  return map[shift] || '-'
}

async function loadWorkOrders() {
  try {
    const res = await workOrderApi.list({ perPage: 100, status: 'pending,scheduled,in_production' })
    workOrderList.value = res.data.data
  } catch (e) {}
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      perPage: pagination.perPage,
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await productionApi.list(params)
    tableData.value = res.data.data
    pagination.total = res.data.total || res.data.data?.length || 0
  } catch (e) {
  } finally {
    loading.value = false
  }
}

async function loadSummary() {
  try {
    const days = parseInt(period.value)
    const startDate = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD')
    const endDate = dayjs().format('YYYY-MM-DD')

    const [summaryRes, workHoursRes] = await Promise.all([
      productionApi.summary({ startDate, endDate }),
      productionApi.workHours({ startDate, endDate }),
    ])

    Object.assign(summary, summaryRes.data?.summary || {})
    workshopStats.value = workHoursRes.data || []

    await nextTick()
    if (summaryRes.data?.dailyData) {
      initChart(summaryRes.data.dailyData)
    }
  } catch (e) {}
}

function initChart(dailyData) {
  if (!productionChart.value) return
  const chart = echarts.init(productionChart.value)

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['产量', '不良数', '不良率'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dailyData.map((d) => dayjs(d.period).format('MM-DD')),
    },
    yAxis: [
      { type: 'value', name: '数量' },
      { type: 'value', name: '不良率(%)', min: 0, max: 10 },
    ],
    series: [
      {
        name: '产量',
        type: 'bar',
        data: dailyData.map((d) => d.totalOutput),
        itemStyle: { color: '#409eff' },
      },
      {
        name: '不良数',
        type: 'bar',
        data: dailyData.map((d) => d.totalDefect),
        itemStyle: { color: '#f56c6c' },
      },
      {
        name: '不良率',
        type: 'line',
        yAxisIndex: 1,
        data: dailyData.map((d) => parseFloat(d.defectRate)),
        smooth: true,
        itemStyle: { color: '#e6a23c' },
      },
    ],
  }

  chart.setOption(option)
}

function openCreateDialog() {
  isEdit.value = false
  Object.assign(formData, {
    id: null,
    workOrderId: null,
    productionDate: dayjs().format('YYYY-MM-DD'),
    workshop: '',
    shift: 'morning',
    outputQuantity: 0,
    defectQuantity: 0,
    workHours: 8,
    manHours: 0,
    operatorCount: 0,
    remarks: '',
  })
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  Object.assign(formData, {
    id: row.id,
    workOrderId: row.workOrderId,
    productionDate: dayjs(row.productionDate).format('YYYY-MM-DD'),
    workshop: row.workshop || '',
    shift: row.shift || '',
    outputQuantity: row.outputQuantity,
    defectQuantity: row.defectQuantity,
    workHours: row.workHours,
    manHours: row.manHours,
    operatorCount: row.operatorCount,
    remarks: row.remarks || '',
  })
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    submitting.value = true

    if (isEdit.value) {
      await productionApi.update(formData.id, formData)
      ElMessage.success('产量记录更新成功')
    } else {
      await productionApi.create(formData)
      ElMessage.success('产量录入成功')
    }

    dialogVisible.value = false
    loadData()
    loadSummary()
  } catch (e) {
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadWorkOrders()
  loadData()
  loadSummary()
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
.stat-icon.info { background: linear-gradient(135deg, #89f7fe, #66a6ff); color: #409eff; }

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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart {
  width: 100%;
  height: 300px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
