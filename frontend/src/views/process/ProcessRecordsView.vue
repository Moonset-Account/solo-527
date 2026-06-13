<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">处理记录</h2>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新增记录</el-button>
    </div>

    <div class="filter-bar">
      <el-select v-model="filters.type" placeholder="记录类型" clearable style="width: 140px" @change="loadRecords">
        <el-option label="巡店任务" value="inspection" />
        <el-option label="现金流水" value="cash_flow" />
        <el-option label="食材库存" value="inventory_log" />
        <el-option label="其他" value="other" />
      </el-select>
      <el-select v-model="filters.status" placeholder="状态" clearable style="width: 140px" @change="loadRecords">
        <el-option label="待处理" value="pending" />
        <el-option label="处理中" value="processing" />
        <el-option label="已完成" value="completed" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-date-picker
        v-model="filters.startDate"
        type="date"
        placeholder="开始日期"
        value-format="YYYY-MM-DD"
        size="default"
      />
      <el-date-picker
        v-model="filters.endDate"
        type="date"
        placeholder="结束日期"
        value-format="YYYY-MM-DD"
        size="default"
      />
      <el-button type="primary" @click="loadRecords">查询</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <el-card>
      <el-table :data="recordList" v-loading="loading" stripe>
        <el-table-column prop="type" label="类型" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="typeTagMap[row.type]">{{ typeMap[row.type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column prop="amount" label="金额" width="110">
          <template #default="{ row }">
            <span v-if="row.amount !== null && row.amount !== undefined">
              ¥{{ Number(row.amount).toFixed(2) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="statusTagMap[row.status]">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="store.name" label="门店" width="120" />
        <el-table-column prop="creator.fullName" label="创建人" width="100" />
        <el-table-column prop="handler.fullName" label="处理人" width="100">
          <template #default="{ row }">{{ row.handler?.fullName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          layout="total, prev, pager, next, jumper"
          @current-change="loadRecords"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="记录详情" width="600px">
      <el-descriptions :column="2" border v-if="currentRecord">
        <el-descriptions-item label="类型">
          <el-tag size="small">{{ typeMap[currentRecord.type] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag size="small" :type="statusTagMap[currentRecord.status]">
            {{ statusMap[currentRecord.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="标题" :span="2">{{ currentRecord.title }}</el-descriptions-item>
        <el-descriptions-item label="门店">{{ currentRecord.store?.name }}</el-descriptions-item>
        <el-descriptions-item label="金额">
          {{ currentRecord.amount ? '¥' + Number(currentRecord.amount).toFixed(2) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentRecord.creator?.fullName }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentRecord.handler?.fullName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentRecord.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ formatDateTime(currentRecord.handledAt) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ currentRecord.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="详细数据" :span="2">
          <pre style="margin: 0; white-space: pre-wrap; word-break: break-all;">{{ JSON.stringify(currentRecord.data, null, 2) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import api from '@/utils/api'
import dayjs from 'dayjs'

const loading = ref(false)
const detailVisible = ref(false)
const currentRecord = ref(null)

const recordList = ref([])

const filters = reactive({
  type: '',
  status: '',
  startDate: '',
  endDate: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const typeMap = {
  inspection: '巡店任务',
  cash_flow: '现金流水',
  inventory_log: '食材库存',
  other: '其他'
}

const typeTagMap = {
  inspection: 'primary',
  cash_flow: 'success',
  inventory_log: 'warning',
  other: 'info'
}

const statusMap = {
  pending: '待处理',
  processing: '处理中',
  completed: '已完成',
  cancelled: '已取消'
}

const statusTagMap = {
  pending: 'warning',
  processing: 'primary',
  completed: 'success',
  cancelled: 'info'
}

const formatDateTime = (dt) => {
  if (!dt) return '-'
  return dayjs(dt).format('YYYY-MM-DD HH:mm')
}

const loadRecords = async () => {
  loading.value = true
  try {
    const res = await api.get('/process/records', {
      params: {
        page: pagination.page,
        limit: pagination.limit,
        type: filters.type || undefined,
        status: filters.status || undefined,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined
      }
    })
    recordList.value = res.data || []
    pagination.total = res.meta?.total || 0
  } finally {
    loading.value = false
  }
}

const viewDetail = async (row) => {
  try {
    const res = await api.get(`/process/records/${row.id}`)
    currentRecord.value = res
    detailVisible.value = true
  } catch (e) {}
}

const openCreateDialog = () => {
  // 可以根据类型跳转到对应页面，或弹出通用表单
}

const resetFilters = () => {
  filters.type = ''
  filters.status = ''
  filters.startDate = ''
  filters.endDate = ''
  pagination.page = 1
  loadRecords()
}

onMounted(() => {
  loadRecords()
})
</script>
