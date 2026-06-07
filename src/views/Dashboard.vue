<template>
  <div class="dashboard">
    <el-card class="filter-card" shadow="never">
      <div class="filter-row">
        <div class="filter-item">
          <label>时间范围</label>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            @change="applyFilters"
          />
        </div>
        <div class="filter-item">
          <label>产线</label>
          <el-select v-model="filters.lineId" placeholder="全部产线" clearable @change="applyFilters">
            <el-option v-for="line in config.productionLines" :key="line.id" :label="line.name" :value="line.id" />
          </el-select>
        </div>
        <div class="filter-item">
          <label>班次</label>
          <el-select v-model="filters.shift" placeholder="全部班次" clearable @change="applyFilters">
            <el-option v-for="s in config.shifts" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </div>
        <div class="filter-item">
          <label>停机类型</label>
          <el-select v-model="filters.type" placeholder="全部类型" clearable @change="applyFilters">
            <el-option label="计划检修" value="planned" />
            <el-option label="突发停机" value="unplanned" />
          </el-select>
        </div>
        <div class="filter-actions">
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="primary" @click="applyFilters">应用筛选</el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="16" class="kpi-row">
      <el-col :span="4">
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #eff6ff; color: #3b82f6;">
            <el-icon><Warning /></el-icon>
          </div>
          <p class="kpi-label">突发停机次数</p>
          <p class="kpi-value">{{ kpi.unplannedCount || 0 }}</p>
          <p class="kpi-sub">共 {{ kpi.totalWorkOrders || 0 }} 次工单</p>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #fef2f2; color: #ef4444;">
            <el-icon><Clock /></el-icon>
          </div>
          <p class="kpi-label">突发停机时长</p>
          <p class="kpi-value">{{ formatHours(kpi.totalUnplannedMinutes) }}</p>
          <p class="kpi-sub">计划: {{ formatHours(kpi.totalPlannedMinutes) }}</p>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #ecfdf5; color: #10b981;">
            <el-icon><Odometer /></el-icon>
          </div>
          <p class="kpi-label">平均 OEE</p>
          <p class="kpi-value">{{ formatPercent(kpi.avgOEE) }}</p>
          <p class="kpi-sub">设备综合效率</p>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #fffbeb; color: #f59e0b;">
            <el-icon><Tools /></el-icon>
          </div>
          <p class="kpi-label">平均修复时间</p>
          <p class="kpi-value">{{ kpi.mttr || 0 }} <span style="font-size: 16px;">分</span></p>
          <p class="kpi-sub">MTTR (仅突发)</p>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #f3e8ff; color: #8b5cf6;">
            <el-icon><Money /></el-icon>
          </div>
          <p class="kpi-label">维修总成本</p>
          <p class="kpi-value">¥{{ formatMoney(kpi.totalCost) }}</p>
          <p class="kpi-sub">备件: ¥{{ formatMoney(kpi.partsCost) }}</p>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="kpi-card">
          <div class="kpi-icon" style="background: #fce7f3; color: #ec4899;">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <p class="kpi-label">计划检修占比</p>
          <p class="kpi-value">{{ formatPercent(plannedRatio) }}</p>
          <p class="kpi-sub">{{ kpi.plannedCount || 0 }} 次计划</p>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card" shadow="never">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Histogram /></el-icon>
              停机原因 Pareto 分析
            </h3>
            <span class="card-hint">点击条形可下钻查看原始工单</span>
          </div>
          <ParetoChart :data="byCategory" @drill="handleDrillCategory" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card" shadow="never">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><TrendCharts /></el-icon>
              停机趋势分析
            </h3>
            <span class="card-hint">按日期统计，区分计划/突发</span>
          </div>
          <TrendChart :data="trendData" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card" shadow="never">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Operation /></el-icon>
              产线停机对比
            </h3>
            <span class="card-hint">点击产线可筛选</span>
          </div>
          <LineCompareChart :data="byLine" @drill="handleDrillLine" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card" shadow="never">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Tools /></el-icon>
              维修人员效率分析
            </h3>
            <span class="card-hint">平均修复时间对比</span>
          </div>
          <TechnicianChart :data="byTechnician" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="12">
        <el-card class="chart-card" shadow="never">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Box /></el-icon>
              备件消耗 TOP 10
            </h3>
            <span class="card-hint">按成本排序</span>
          </div>
          <SparePartsChart :data="spareParts" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card" shadow="never">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Monitor /></el-icon>
              设备停机 TOP 10
            </h3>
            <span class="card-hint">按突发停机时长排序</span>
          </div>
          <EquipmentChart :data="byEquipment" @drill="handleDrillEquipment" />
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card" shadow="never">
      <div class="card-header">
        <h3 class="card-title">
          <el-icon><Document /></el-icon>
          原始工单记录
          <span v-if="activeFilter" class="filter-tag">
            {{ activeFilter }}
            <el-icon class="close-icon" @click="clearDrillFilter"><Close /></el-icon>
          </span>
        </h3>
        <div class="header-actions">
          <el-button size="small" @click="exportWorkOrders">
            <el-icon><Download /></el-icon>
            导出CSV
          </el-button>
        </div>
      </div>
      <el-table :data="workOrderItems" stripe style="width: 100%" v-loading="loadingWorkOrders">
        <el-table-column prop="id" label="工单号" width="110" />
        <el-table-column prop="date" label="日期" width="110" />
        <el-table-column prop="shiftName" label="班次" width="80" />
        <el-table-column prop="lineName" label="产线" width="130" />
        <el-table-column prop="equipmentName" label="设备" width="150" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'planned' ? 'success' : 'danger'" size="small">
              {{ row.typeName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="故障类别" width="110" />
        <el-table-column prop="durationMinutes" label="停机(分)" width="90" align="right" />
        <el-table-column prop="repairTimeMinutes" label="维修(分)" width="90" align="right" />
        <el-table-column prop="technician" label="维修人" width="90" />
        <el-table-column label="成本" width="100" align="right">
          <template #default="{ row }">¥{{ row.totalCost.toFixed(0) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="workOrderPage"
          v-model:page-size="workOrderPageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="workOrderTotal"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadWorkOrders"
          @current-change="loadWorkOrders"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="工单详情" width="700px">
      <div v-if="currentWorkOrder" class="detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="工单号">{{ currentWorkOrder.id }}</el-descriptions-item>
          <el-descriptions-item label="日期">{{ currentWorkOrder.date }}</el-descriptions-item>
          <el-descriptions-item label="班次">{{ currentWorkOrder.shiftName }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="currentWorkOrder.type === 'planned' ? 'success' : 'danger'" size="small">
              {{ currentWorkOrder.typeName }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="产线">{{ currentWorkOrder.lineName }}</el-descriptions-item>
          <el-descriptions-item label="设备">{{ currentWorkOrder.equipmentName }}</el-descriptions-item>
          <el-descriptions-item label="故障类别">{{ currentWorkOrder.categoryName }}</el-descriptions-item>
          <el-descriptions-item label="严重程度">{{ '★'.repeat(currentWorkOrder.severity) }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ currentWorkOrder.startTime }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ currentWorkOrder.endTime }}</el-descriptions-item>
          <el-descriptions-item label="停机时长">{{ currentWorkOrder.durationMinutes }} 分钟</el-descriptions-item>
          <el-descriptions-item label="维修时长">{{ currentWorkOrder.repairTimeMinutes }} 分钟</el-descriptions-item>
          <el-descriptions-item label="响应时间">{{ currentWorkOrder.responseTimeMinutes }} 分钟</el-descriptions-item>
          <el-descriptions-item label="维修班组">{{ currentWorkOrder.teamName }}</el-descriptions-item>
          <el-descriptions-item label="维修人员">{{ currentWorkOrder.technician }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentWorkOrder.status }}</el-descriptions-item>
        </el-descriptions>
        
        <h4 style="margin: 16px 0 8px;">问题描述</h4>
        <p style="background: #f5f5f5; padding: 12px; border-radius: 4px;">{{ currentWorkOrder.description || '无' }}</p>
        
        <h4 style="margin: 16px 0 8px;">备注</h4>
        <p style="background: #f5f5f5; padding: 12px; border-radius: 4px;">{{ currentWorkOrder.notes || '无' }}</p>
        
        <h4 style="margin: 16px 0 8px;">备件使用</h4>
        <el-table :data="currentWorkOrder.partsUsed" size="small" v-if="currentWorkOrder.partsUsed.length">
          <el-table-column prop="partName" label="备件名称" />
          <el-table-column prop="quantity" label="数量" width="80" align="center" />
          <el-table-column label="单价" width="100" align="right">
            <template #default="{ row }">¥{{ row.unitCost }}</template>
          </el-table-column>
          <el-table-column label="小计" width="100" align="right">
            <template #default="{ row }">¥{{ row.unitCost * row.quantity }}</template>
          </el-table-column>
        </el-table>
        <p v-else style="color: #999;">无备件消耗</p>
        
        <div class="cost-summary">
          <span>备件成本: ¥{{ currentWorkOrder.partsCost.toFixed(2) }}</span>
          <span>人工成本: ¥{{ currentWorkOrder.laborCost.toFixed(2) }}</span>
          <span class="total">总计: ¥{{ currentWorkOrder.totalCost.toFixed(2) }}</span>
        </div>
        
        <h4 style="margin: 16px 0 8px;" v-if="currentWorkOrder.relatedAlarms?.length">关联报警</h4>
        <el-table :data="currentWorkOrder.relatedAlarms" size="small" v-if="currentWorkOrder.relatedAlarms?.length">
          <el-table-column prop="alarmCode" label="报警代码" width="100" />
          <el-table-column prop="alarmType" label="类型" width="120" />
          <el-table-column prop="message" label="报警信息" />
          <el-table-column prop="time" label="时间" width="160" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, watch } from 'vue'
import dayjs from 'dayjs'
import ParetoChart from '../components/ParetoChart.vue'
import TrendChart from '../components/TrendChart.vue'
import LineCompareChart from '../components/LineCompareChart.vue'
import TechnicianChart from '../components/TechnicianChart.vue'
import SparePartsChart from '../components/SparePartsChart.vue'
import EquipmentChart from '../components/EquipmentChart.vue'

const globalFilters = inject('filters')

const config = ref({
  productionLines: [],
  shifts: [],
  downtimeCategories: []
})

const dateRange = ref([globalFilters.value.startDate, globalFilters.value.endDate])

const filters = ref({
  lineId: null,
  shift: null,
  type: null,
  category: null,
  equipmentId: null
})

const activeFilter = ref(null)

const kpi = ref({})
const byCategory = ref([])
const byLine = ref([])
const byEquipment = ref([])
const byTechnician = ref([])
const spareParts = ref([])
const trendData = ref([])

const workOrderItems = ref([])
const workOrderTotal = ref(0)
const workOrderPage = ref(1)
const workOrderPageSize = ref(10)
const loadingWorkOrders = ref(false)

const detailVisible = ref(false)
const currentWorkOrder = ref(null)

const plannedRatio = computed(() => {
  if (!kpi.value.totalWorkOrders) return 0
  return kpi.value.plannedCount / kpi.value.totalWorkOrders
})

const formatHours = (minutes) => {
  if (!minutes) return '0h'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h${m > 0 ? m + 'm' : ''}` : `${m}m`
}

const formatPercent = (val) => {
  if (!val) return '0%'
  return (val * 100).toFixed(1) + '%'
}

const formatMoney = (val) => {
  if (!val) return '0'
  return Number(val).toLocaleString()
}

const loadConfig = async () => {
  try {
    const res = await fetch('/api/config')
    config.value = await res.json()
  } catch (e) {
    console.error('加载配置失败', e)
  }
}

const loadDashboardData = async () => {
  try {
    const query = new URLSearchParams()
    if (dateRange.value[0]) query.append('startDate', dateRange.value[0])
    if (dateRange.value[1]) query.append('endDate', dateRange.value[1])
    if (filters.value.lineId) query.append('lineId', filters.value.lineId)
    if (filters.value.shift) query.append('shift', filters.value.shift)
    if (filters.value.type) query.append('type', filters.value.type)
    
    const res = await fetch(`/api/dashboard/all?${query.toString()}`)
    const data = await res.json()
    
    kpi.value = data.kpi
    byCategory.value = data.byCategory
    byLine.value = data.byLine
    byEquipment.value = data.byEquipment
    byTechnician.value = data.byTechnician
    spareParts.value = data.spareParts
    trendData.value = data.trend
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

const loadWorkOrders = async () => {
  loadingWorkOrders.value = true
  try {
    const query = new URLSearchParams()
    query.append('page', workOrderPage.value)
    query.append('pageSize', workOrderPageSize.value)
    if (dateRange.value[0]) query.append('startDate', dateRange.value[0])
    if (dateRange.value[1]) query.append('endDate', dateRange.value[1])
    if (filters.value.lineId) query.append('lineId', filters.value.lineId)
    if (filters.value.shift) query.append('shift', filters.value.shift)
    if (filters.value.type) query.append('type', filters.value.type)
    if (filters.value.category) query.append('category', filters.value.category)
    if (filters.value.equipmentId) query.append('equipmentId', filters.value.equipmentId)
    
    const res = await fetch(`/api/workorders?${query.toString()}`)
    const data = await res.json()
    workOrderItems.value = data.items
    workOrderTotal.value = data.total
  } catch (e) {
    console.error('加载工单失败', e)
  } finally {
    loadingWorkOrders.value = false
  }
}

const applyFilters = () => {
  globalFilters.value.startDate = dateRange.value[0]
  globalFilters.value.endDate = dateRange.value[1]
  globalFilters.value.lineId = filters.value.lineId
  globalFilters.value.shift = filters.value.shift
  globalFilters.value.type = filters.value.type
  loadDashboardData()
  loadWorkOrders()
}

const resetFilters = () => {
  dateRange.value = [dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')]
  filters.value = { lineId: null, shift: null, type: null, category: null, equipmentId: null }
  activeFilter.value = null
  applyFilters()
}

const handleDrillCategory = (item) => {
  filters.value.category = item.category
  activeFilter.value = `故障类别: ${item.categoryName}`
  workOrderPage.value = 1
  loadWorkOrders()
}

const handleDrillLine = (item) => {
  filters.value.lineId = item.lineId
  activeFilter.value = `产线: ${item.lineName}`
  workOrderPage.value = 1
  loadWorkOrders()
  loadDashboardData()
}

const handleDrillEquipment = (item) => {
  filters.value.equipmentId = item.equipmentId
  activeFilter.value = `设备: ${item.equipmentName}`
  workOrderPage.value = 1
  loadWorkOrders()
}

const clearDrillFilter = () => {
  filters.value.category = null
  filters.value.equipmentId = null
  activeFilter.value = null
  loadWorkOrders()
}

const viewDetail = async (row) => {
  try {
    const res = await fetch(`/api/workorders/${row.id}`)
    currentWorkOrder.value = await res.json()
    detailVisible.value = true
  } catch (e) {}
}

const exportWorkOrders = () => {
  const query = new URLSearchParams()
  if (dateRange.value[0]) query.append('startDate', dateRange.value[0])
  if (dateRange.value[1]) query.append('endDate', dateRange.value[1])
  if (filters.value.lineId) query.append('lineId', filters.value.lineId)
  if (filters.value.type) query.append('type', filters.value.type)
  if (filters.value.category) query.append('category', filters.value.category)
  if (filters.value.equipmentId) query.append('equipmentId', filters.value.equipmentId)
  window.open(`/api/export/csv/workorders?${query.toString()}`, '_blank')
}

onMounted(() => {
  loadConfig()
  loadDashboardData()
  loadWorkOrders()
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-card {
  border-radius: 8px;
}

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
}

.filter-item label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.filter-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.kpi-row {
  margin-bottom: 0;
}

.chart-row {
  margin-bottom: 0;
}

.chart-card {
  height: 380px;
  display: flex;
  flex-direction: column;
}

.card-hint {
  font-size: 12px;
  color: #9ca3af;
}

.filter-tag {
  margin-left: 12px;
  background: #eff6ff;
  color: #3b82f6;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: normal;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.close-icon {
  cursor: pointer;
  font-size: 14px;
}

.close-icon:hover {
  color: #1d4ed8;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-content h4 {
  color: #333;
  font-size: 14px;
}

.cost-summary {
  margin-top: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  display: flex;
  gap: 24px;
  font-size: 13px;
}

.cost-summary .total {
  font-weight: 600;
  color: #1e3a8a;
  margin-left: auto;
}
</style>
