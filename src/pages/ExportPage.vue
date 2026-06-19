<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const { get, post } = useApi()

const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

interface ExportTask {
  id: number
  reportIds: number[]
  requestedByName: string
  status: string
  watermarkEnabled: boolean
  createdAt: string
  completedAt: string
  results?: Array<{
    id: number
    reportName: string
    status: string
    reason: string | null
    duration: number | null
  }>
}

const tasks = ref<ExportTask[]>([])
const batchDialogVisible = ref(false)
const expandedRows = ref<number[]>([])

const metrics = ref<Array<{ id: number; name: string }>>([])
const selectedReports = ref<number[]>([])

const summaryStats = computed(() => {
  let success = 0, failed = 0, skipped = 0
  for (const task of tasks.value) {
    if (task.results) {
      for (const r of task.results) {
        if (r.status === 'success') success++
        else if (r.status === 'failed') failed++
        else if (r.status === 'skipped') skipped++
      }
    }
  }
  return { success, failed, skipped }
})

onMounted(async () => {
  await fetchTasks()
  const mData = await get<any>('/api/metrics?pageSize=100')
  if (mData) {
    metrics.value = mData.items.map((m: any) => ({ id: m.id, name: m.name }))
  }
})

async function fetchTasks() {
  const data = await get<any>(`/api/exports/tasks?page=${page.value}&pageSize=${pageSize.value}`)
  if (data) {
    tasks.value = data.items
    total.value = data.total
    for (const task of tasks.value) {
      if (expandedRows.value.includes(task.id)) {
        const detail = await get<any>(`/api/exports/tasks/${task.id}`)
        if (detail) task.results = detail.results
      }
    }
  }
}

function taskStatusType(s: string) {
  return s === 'processing' ? 'primary' : s === 'completed' ? 'success' : s === 'failed' ? 'danger' : 'warning'
}

function taskStatusLabel(s: string) {
  return s === 'processing' ? '处理中' : s === 'completed' ? '已完成' : s === 'failed' ? '失败' : '部分完成'
}

function resultStatusType(s: string) {
  return s === 'success' ? 'success' : s === 'failed' ? 'danger' : 'info'
}

function resultStatusLabel(s: string) {
  return s === 'success' ? '成功' : s === 'failed' ? '失败' : '跳过'
}

function handlePageChange(p: number) {
  page.value = p
  fetchTasks()
}

async function handleExpand(row: ExportTask, expanded: boolean) {
  if (expanded && !row.results) {
    const detail = await get<any>(`/api/exports/tasks/${row.id}`)
    if (detail) row.results = detail.results
  }
}

async function handleBatchExport() {
  if (selectedReports.value.length === 0) {
    ElMessage.warning('请选择要导出的报表')
    return
  }
  const ok = await post('/api/exports/tasks', { reportIds: selectedReports.value, watermarkEnabled: true })
  if (ok !== null) {
    ElMessage.success('导出任务已创建')
    batchDialogVisible.value = false
    selectedReports.value = []
    fetchTasks()
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex gap-4">
        <div class="px-4 py-2 rounded-lg" style="background: #ECFDF5; border: 1px solid #A7F3D0">
          <span class="text-sm" style="color: var(--color-text-secondary)">成功</span>
          <span class="ml-2 font-mono font-bold text-emerald-600">{{ summaryStats.success }}</span>
        </div>
        <div class="px-4 py-2 rounded-lg" style="background: #FFF1F2; border: 1px solid #FECDD3">
          <span class="text-sm" style="color: var(--color-text-secondary)">失败</span>
          <span class="ml-2 font-mono font-bold text-rose-500">{{ summaryStats.failed }}</span>
        </div>
        <div class="px-4 py-2 rounded-lg" style="background: #F0F9FF; border: 1px solid #BAE6FD">
          <span class="text-sm" style="color: var(--color-text-secondary)">跳过</span>
          <span class="ml-2 font-mono font-bold text-sky-500">{{ summaryStats.skipped }}</span>
        </div>
      </div>
      <el-button type="primary" :icon="Plus" @click="batchDialogVisible = true">批量导出</el-button>
    </div>

    <el-table :data="tasks" stripe row-key="id" @expand-change="handleExpand">
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="px-6 py-3">
            <el-table v-if="row.results" :data="row.results" size="small" stripe>
              <el-table-column prop="reportName" label="报表名称" />
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row: r }">
                  <el-tag :type="resultStatusType(r.status)" size="small">{{ resultStatusLabel(r.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="reason" label="原因" min-width="140">
                <template #default="{ row: r }">
                  <span style="color: var(--color-text-muted)">{{ r.reason || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="耗时" width="100">
                <template #default="{ row: r }">
                  <span v-if="r.duration" class="font-mono">{{ r.duration }}s</span>
                  <span v-else style="color: var(--color-text-muted)">-</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="id" label="任务ID" width="80">
        <template #default="{ row }">
          <span class="font-mono">#{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="报表数量" width="100">
        <template #default="{ row }">
          <span class="font-mono">{{ row.reportIds?.length || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="requestedByName" label="申请人" width="120" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="taskStatusType(row.status)" size="small">{{ taskStatusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="水印" width="80">
        <template #default="{ row }">
          <span :style="{ color: row.watermarkEnabled ? '#10B981' : 'var(--color-text-muted)' }">
            {{ row.watermarkEnabled ? '开启' : '关闭' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="170">
        <template #default="{ row }">
          <span class="text-xs" style="color: var(--color-text-muted)">{{ row.createdAt }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="completedAt" label="完成时间" width="170">
        <template #default="{ row }">
          <span class="text-xs" style="color: var(--color-text-muted)">{{ row.completedAt || '-' }}</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="flex justify-end">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog v-model="batchDialogVisible" title="批量导出" width="500px">
      <el-form label-width="80px">
        <el-form-item label="选择报表">
          <el-select v-model="selectedReports" multiple filterable placeholder="选择要导出的报表" style="width: 100%">
            <el-option v-for="m in metrics" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchExport">导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>
