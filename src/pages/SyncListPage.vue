<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { SyncTask } from '@/types'
import { syncApi } from '@/api'

const router = useRouter()

const loading = ref(false)
const tableData = ref<SyncTask[]>([])
const total = ref(0)
const failedCount = ref(0)

const filters = reactive({
  status: '',
  type: '',
  meterNo: '',
  page: 1,
  pageSize: 10,
})

const statusOptions = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
  { label: '运行中', value: 'running' },
  { label: '待执行', value: 'pending' },
]

const typeOptions = [
  { label: '读数同步', value: 'meter_reading' },
  { label: '配置同步', value: 'meter_config' },
  { label: '告警同步', value: 'alarm_sync' },
]

const badgeValue = computed(() => failedCount.value > 0 ? failedCount.value : undefined)

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    meter_reading: '读数同步',
    meter_config: '配置同步',
    alarm_sync: '告警同步',
  }
  return map[type] || type
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    success: 'success',
    failed: 'danger',
    running: 'warning',
    pending: 'info',
  }
  return map[status] || 'info'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    success: '成功',
    failed: '失败',
    running: '运行中',
    pending: '待执行',
  }
  return map[status] || status
}

function getFailCategoryLabel(category: string) {
  const map: Record<string, string> = {
    network: '网络',
    data: '数据',
    config: '配置',
    unknown: '未知',
  }
  return map[category] || category
}

function rowClassName({ row }: { row: SyncTask }): string {
  return row.status === 'failed' ? 'failed-row' : ''
}

async function fetchData() {
  loading.value = true
  try {
    const res = await syncApi.getTasks({
      page: filters.page,
      pageSize: filters.pageSize,
      status: filters.status || undefined,
      type: filters.type || undefined,
      meterNo: filters.meterNo || undefined,
    })
    tableData.value = res.items
    total.value = res.total
    failedCount.value = res.items.filter((t) => t.status === 'failed').length
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  filters.page = 1
  fetchData()
}

function handleReset() {
  filters.status = ''
  filters.type = ''
  filters.meterNo = ''
  filters.page = 1
  fetchData()
}

function handlePageChange(page: number) {
  filters.page = page
  fetchData()
}

function handleSizeChange(size: number) {
  filters.pageSize = size
  filters.page = 1
  fetchData()
}

function handleViewDetail(row: SyncTask) {
  router.push(`/sync/${row.id}`)
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="sync-list-page">
    <div class="page-header">
      <div class="header-left">
        <h2>同步管理</h2>
        <el-badge v-if="badgeValue" :value="badgeValue" class="failed-badge" />
      </div>
    </div>

    <div class="filter-bar">
      <el-select
        v-model="filters.status"
        placeholder="状态筛选"
        clearable
        style="width: 130px"
      >
        <el-option
          v-for="opt in statusOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-select
        v-model="filters.type"
        placeholder="任务类型"
        clearable
        style="width: 130px"
      >
        <el-option
          v-for="opt in typeOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-input
        v-model="filters.meterNo"
        placeholder="电表号搜索"
        clearable
        style="width: 180px"
        @keyup.enter="handleSearch"
      />
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      :row-class-name="rowClassName"
      style="width: 100%"
    >
      <el-table-column label="任务类型" min-width="120">
        <template #default="{ row }">
          {{ getTypeLabel(row.type) }}
        </template>
      </el-table-column>
      <el-table-column prop="meterNo" label="目标电表" min-width="150" />
      <el-table-column label="状态" min-width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="triggeredAt" label="触发时间" min-width="180" />
      <el-table-column label="耗时" width="100">
        <template #default="{ row }">
          {{ row.duration !== null ? `${row.duration} ms` : '-' }}
        </template>
      </el-table-column>
      <el-table-column label="失败分类" min-width="100">
        <template #default="{ row }">
          <el-tag
            v-if="row.failCategory"
            type="danger"
            size="small"
          >
            {{ getFailCategoryLabel(row.failCategory) }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleViewDetail(row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="filters.page"
        v-model:page-size="filters.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.sync-list-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.failed-badge {
  margin-top: -2px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>

<style>
.el-table .failed-row {
  background-color: #fef0f0 !important;
}
</style>
