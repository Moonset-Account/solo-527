<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { meterApi, zoneApi } from '@/api'
import type { Meter, Zone } from '@/types'

const router = useRouter()

const loading = ref(false)
const meters = ref<Meter[]>([])
const total = ref(0)
const zones = ref<Zone[]>([])

const filters = reactive({
  keyword: '',
  zoneId: undefined as number | undefined,
  status: undefined as string | undefined,
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
})

const statusOptions = [
  { label: '在线', value: 'online' },
  { label: '离线', value: 'offline' },
  { label: '故障', value: 'fault' },
]

const detailVisible = ref(false)
const detailMeter = ref<Meter | null>(null)

const statusTagType: Record<string, string> = {
  online: 'success',
  offline: 'info',
  fault: 'danger',
}

const statusLabel: Record<string, string> = {
  online: '在线',
  offline: '离线',
  fault: '故障',
}

function formatTime(time: string) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

async function fetchMeters() {
  loading.value = true
  try {
    const res = await meterApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      zoneId: filters.zoneId,
      status: filters.status,
    })
    meters.value = res.items
    total.value = res.total
  } catch {
    ElMessage.error('获取表计列表失败')
  } finally {
    loading.value = false
  }
}

async function fetchZones() {
  try {
    zones.value = await zoneApi.getList()
  } catch {
    ElMessage.error('获取分区列表失败')
  }
}

function handleSearch() {
  pagination.page = 1
  fetchMeters()
}

function handleReset() {
  filters.keyword = ''
  filters.zoneId = undefined
  filters.status = undefined
  pagination.page = 1
  fetchMeters()
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchMeters()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  fetchMeters()
}

function handleRowClick(row: Meter) {
  detailMeter.value = row
  detailVisible.value = true
}

function handleView(row: Meter) {
  detailMeter.value = row
  detailVisible.value = true
}

function handleEdit(row: Meter) {
  router.push(`/meters/${row.id}`)
}

onMounted(() => {
  fetchMeters()
  fetchZones()
})
</script>

<template>
  <div>
    <div class="page-header">
      <h2>表计管理</h2>
      <router-link to="/meters/add">
        <el-button type="primary">新增表计</el-button>
      </router-link>
    </div>

    <div class="filter-bar">
      <el-input
        v-model="filters.keyword"
        placeholder="搜索电表编号/安装位置"
        clearable
        style="width: 240px"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <el-select
        v-model="filters.zoneId"
        placeholder="所属分区"
        clearable
        style="width: 180px"
        @change="handleSearch"
      >
        <el-option
          v-for="zone in zones"
          :key="zone.id"
          :label="zone.name"
          :value="zone.id"
        />
      </el-select>
      <el-select
        v-model="filters.status"
        placeholder="状态"
        clearable
        style="width: 140px"
        @change="handleSearch"
      >
        <el-option
          v-for="opt in statusOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table
      :data="meters"
      v-loading="loading"
      stripe
      @row-click="handleRowClick"
      style="width: 100%"
    >
      <el-table-column prop="meterNo" label="电表编号" min-width="150" />
      <el-table-column prop="location" label="安装位置" min-width="180" />
      <el-table-column prop="zoneName" label="所属分区" min-width="120" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusTagType[row.status]" size="small" :class="`tag-${row.status}`">
            {{ statusLabel[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最后同步时间" min-width="180">
        <template #default="{ row }">
          {{ formatTime(row.lastSyncTime) }}
        </template>
      </el-table-column>
      <el-table-column label="来源单据" min-width="150">
        <template #default="{ row }">
          <span class="link-text">{{ row.sourceDocumentNo }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click.stop="handleView(row)">查看</el-button>
          <el-button link type="primary" size="small" @click.stop="handleEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div style="display: flex; justify-content: flex-end; margin-top: 16px">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <el-dialog v-model="detailVisible" title="表计详情" width="560px" destroy-on-close>
      <template v-if="detailMeter">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="电表编号">{{ detailMeter.meterNo }}</el-descriptions-item>
          <el-descriptions-item label="安装位置">{{ detailMeter.location }}</el-descriptions-item>
          <el-descriptions-item label="所属分区">{{ detailMeter.zoneName }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType[detailMeter.status]" size="small" :class="`tag-${detailMeter.status}`">
              {{ statusLabel[detailMeter.status] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后同步时间">{{ formatTime(detailMeter.lastSyncTime) }}</el-descriptions-item>
          <el-descriptions-item label="来源单据">{{ detailMeter.sourceDocumentNo }}</el-descriptions-item>
          <el-descriptions-item label="补充说明" :span="2">{{ detailMeter.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>
