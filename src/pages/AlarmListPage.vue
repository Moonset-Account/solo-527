<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Alarm } from '@/types'
import { alarmApi } from '@/api'

const router = useRouter()

const typeOptions = [
  { value: 'peak_anomaly', label: '尖峰异常' },
  { value: 'device_fault', label: '设备故障' },
  { value: 'data_anomaly', label: '数据异常' },
  { value: 'communication_loss', label: '通信中断' },
]

const levelOptions = [
  { value: 'critical', label: '严重' },
  { value: 'warning', label: '警告' },
  { value: 'info', label: '提示' },
]

const statusOptions = [
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
]

const typeLabelMap: Record<string, string> = {
  peak_anomaly: '尖峰异常',
  device_fault: '设备故障',
  data_anomaly: '数据异常',
  communication_loss: '通信中断',
}

const levelTagType: Record<string, string> = {
  critical: 'danger',
  warning: 'warning',
  info: 'info',
}

const statusTagType: Record<string, string> = {
  pending: 'danger',
  confirmed: 'warning',
  processing: '',
  resolved: 'success',
}

const statusLabelMap: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  processing: '处理中',
  resolved: '已解决',
}

const filters = reactive({
  type: '',
  level: '',
  status: '',
  dateRange: null as [string, string] | null,
})

const loading = ref(false)
const tableData = ref<Alarm[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const criticalCount = computed(() => tableData.value.filter((a) => a.level === 'critical').length)
const warningCount = computed(() => tableData.value.filter((a) => a.level === 'warning').length)
const infoCount = computed(() => tableData.value.filter((a) => a.level === 'info').length)

function rowClassName({ row }: { row: Alarm }) {
  if (row.level === 'critical') return 'alarm-row-critical'
  return ''
}

async function fetchData() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: currentPage.value,
      pageSize: pageSize.value,
    }
    if (filters.type) params.type = filters.type
    if (filters.level) params.level = filters.level
    if (filters.status) params.status = filters.status
    const result = await alarmApi.getList(params as Parameters<typeof alarmApi.getList>[0])
    tableData.value = result.items
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  fetchData()
}

function handleReset() {
  filters.type = ''
  filters.level = ''
  filters.status = ''
  filters.dateRange = null
  currentPage.value = 1
  fetchData()
}

function handlePageChange(page: number) {
  currentPage.value = page
  fetchData()
}

function handleSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  fetchData()
}

function handleViewDetail(row: Alarm) {
  router.push(`/alarms/${row.id}`)
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="alarm-list-page">
    <div class="page-header">
      <h2>告警管理</h2>
      <div class="header-badges">
        <el-badge :value="criticalCount" type="danger" class="header-badge">
          <span class="badge-label">严重</span>
        </el-badge>
        <el-badge :value="warningCount" type="warning" class="header-badge">
          <span class="badge-label">警告</span>
        </el-badge>
        <el-badge :value="infoCount" type="info" class="header-badge">
          <span class="badge-label">提示</span>
        </el-badge>
      </div>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.type" placeholder="告警类型" clearable style="width: 150px">
        <el-option
          v-for="opt in typeOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-select v-model="filters.level" placeholder="告警等级" clearable style="width: 130px">
        <el-option
          v-for="opt in levelOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-select v-model="filters.status" placeholder="告警状态" clearable style="width: 130px">
        <el-option
          v-for="opt in statusOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-date-picker
        v-model="filters.dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 280px"
      />
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      :row-class-name="rowClassName"
      border
      style="width: 100%"
    >
      <el-table-column prop="type" label="告警类型" width="120">
        <template #default="{ row }">
          {{ typeLabelMap[row.type] || row.type }}
        </template>
      </el-table-column>
      <el-table-column prop="level" label="等级" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="levelTagType[row.level]" size="small">
            {{ levelOptions.find((o) => o.value === row.level)?.label || row.level }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="meterNo" label="来源设备" width="150" />
      <el-table-column prop="zoneName" label="区域" width="120" />
      <el-table-column prop="message" label="告警信息" min-width="240" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType[row.status]" size="small">
            {{ statusLabelMap[row.status] || row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="assignee" label="责任人" width="90" />
      <el-table-column prop="occurredAt" label="发生时间" width="170">
        <template #default="{ row }">
          {{ row.occurredAt?.replace('T', ' ').replace('Z', '') }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleViewDetail(row)">
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.alarm-list-page {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.header-badges {
  display: flex;
  gap: 20px;
}

.header-badge {
  display: flex;
  align-items: center;
}

.badge-label {
  font-size: 14px;
  color: #606266;
  padding: 4px 8px;
  background: #f5f7fa;
  border-radius: 4px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

:deep(.alarm-row-critical) {
  background-color: #fef0f0 !important;
}
</style>
