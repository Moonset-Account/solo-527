<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Zone, Meter, DataQueryResult } from '@/types'
import { zoneApi, meterApi, dataApi } from '@/api'

const loading = ref(false)
const exporting = ref(false)
const result = ref<DataQueryResult | null>(null)

const zones = ref<Zone[]>([])
const meters = ref<Meter[]>([])

const filters = reactive({
  timeRange: [] as Date[],
  zoneId: undefined as number | undefined,
  meterId: undefined as number | undefined,
  dataType: 'usage' as 'usage' | 'peak' | 'demand',
  granularity: 'hour' as 'hour' | 'day' | 'month',
})

const dataTypeOptions = [
  { label: '用电量', value: 'usage' },
  { label: '峰值', value: 'peak' },
  { label: '需量', value: 'demand' },
]

const granularityOptions = [
  { label: '小时', value: 'hour' },
  { label: '天', value: 'day' },
  { label: '月', value: 'month' },
]

const filteredMeters = computed(() => {
  if (!filters.zoneId) return meters.value
  return meters.value.filter((m) => m.zoneId === filters.zoneId)
})

const hasResults = computed(() => {
  return result.value !== null && result.value.items.length > 0
})

const showEmpty = computed(() => {
  return result.value !== null && result.value.items.length === 0
})

async function fetchZones() {
  zones.value = await zoneApi.getList()
}

async function fetchMeters() {
  const res = await meterApi.getList({ pageSize: 100 })
  meters.value = res.items
}

watch(() => filters.zoneId, () => {
  filters.meterId = undefined
})

function buildParams() {
  if (!filters.timeRange || filters.timeRange.length < 2) {
    ElMessage.warning('请选择时间范围')
    return null
  }
  return {
    startTime: filters.timeRange[0].toISOString(),
    endTime: filters.timeRange[1].toISOString(),
    zoneId: filters.zoneId,
    meterId: filters.meterId,
    dataType: filters.dataType,
    granularity: filters.granularity,
  }
}

async function handleQuery() {
  const params = buildParams()
  if (!params) return
  loading.value = true
  try {
    result.value = await dataApi.query(params)
  } finally {
    loading.value = false
  }
}

async function handleExport() {
  const params = buildParams()
  if (!params) return
  exporting.value = true
  try {
    const blob = await dataApi.export(params)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `data_export_${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  fetchZones()
  fetchMeters()
})
</script>

<template>
  <div class="data-query-page">
    <div class="page-header">
      <h2>数据查询与下载</h2>
    </div>

    <el-card shadow="never" class="filter-card">
      <div class="filter-grid">
        <div class="filter-item">
          <label>时间范围</label>
          <el-date-picker
            v-model="filters.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 100%"
          />
        </div>
        <div class="filter-item">
          <label>分区</label>
          <el-select
            v-model="filters.zoneId"
            placeholder="选择分区"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="z in zones"
              :key="z.id"
              :label="z.name"
              :value="z.id"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <label>表计</label>
          <el-select
            v-model="filters.meterId"
            placeholder="选择表计"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="m in filteredMeters"
              :key="m.id"
              :label="`${m.meterNo} - ${m.location}`"
              :value="m.id"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <label>数据类型</label>
          <el-select v-model="filters.dataType" style="width: 100%">
            <el-option
              v-for="opt in dataTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <label>数据粒度</label>
          <el-select v-model="filters.granularity" style="width: 100%">
            <el-option
              v-for="opt in granularityOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
      </div>
      <div class="filter-actions">
        <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
        <el-button :loading="exporting" @click="handleExport">导出CSV</el-button>
      </div>
    </el-card>

    <el-empty v-if="showEmpty" description="暂无数据" />

    <template v-if="hasResults">
      <el-table v-loading="loading" :data="result!.items" style="width: 100%">
        <el-table-column prop="time" label="时间" min-width="180" />
        <el-table-column prop="meterNo" label="电表号" min-width="150" />
        <el-table-column prop="zoneName" label="区域" min-width="120" />
        <el-table-column prop="value" label="数值" min-width="100" />
        <el-table-column prop="unit" label="单位" width="80" />
      </el-table>

      <div class="result-info">
        <span>共 {{ result!.total }} 条记录</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.data-query-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-item label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.filter-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.result-info {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  font-size: 13px;
  color: #909399;
}
</style>
