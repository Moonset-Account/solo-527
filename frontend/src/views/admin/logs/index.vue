<template>
  <div class="logs-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="模块">
          <el-select v-model="filterForm.module" placeholder="全部" clearable style="width: 140px">
            <el-option label="预约" value="appointment" />
            <el-option label="服务" value="service" />
            <el-option label="技师" value="technician" />
            <el-option label="会员卡" value="membership" />
            <el-option label="收银" value="cashier" />
            <el-option label="系统设置" value="setting" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="filterForm.operationType" placeholder="全部" clearable style="width: 120px">
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="查询" value="query" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="filterForm.operator" placeholder="姓名" clearable style="width: 120px" />
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
          <el-button type="primary" @click="loadLogs">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <span>操作日志</span>
      </template>

      <el-table :data="logs" v-loading="loading" stripe>
        <el-table-column prop="operatorName" label="操作人" width="120" />
        <el-table-column prop="operatorRole" label="角色" width="100" />
        <el-table-column prop="module" label="模块" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ moduleText(row.module) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operationType" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.operationType)" size="small">
              {{ typeText(row.operationType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="操作描述" min-width="250" show-overflow-tooltip />
        <el-table-column prop="targetName" label="操作对象" width="150" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="操作时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="handleView(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
      />
    </el-card>

    <el-dialog v-model="detailVisible" title="日志详情" width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="操作人">{{ currentLog?.operatorName }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ currentLog?.operatorRole }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ moduleText(currentLog?.module) }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">{{ typeText(currentLog?.operationType) }}</el-descriptions-item>
        <el-descriptions-item label="操作描述">{{ currentLog?.description }}</el-descriptions-item>
        <el-descriptions-item label="操作对象">{{ currentLog?.targetName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ formatTime(currentLog?.createdAt) }}</el-descriptions-item>
        <el-descriptions-item v-if="currentLog?.ip" label="IP地址">{{ currentLog.ip }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>变更详情</el-divider>

      <el-row v-if="currentLog?.beforeData || currentLog?.afterData" :gutter="20">
        <el-col v-if="currentLog?.beforeData" :span="12">
          <h4>修改前</h4>
          <pre class="json-view">{{ JSON.stringify(currentLog.beforeData, null, 2) }}</pre>
        </el-col>
        <el-col v-if="currentLog?.afterData" :span="12">
          <h4>修改后</h4>
          <pre class="json-view">{{ JSON.stringify(currentLog.afterData, null, 2) }}</pre>
        </el-col>
      </el-row>
      <el-empty v-else description="无变更详情" :image-size="80" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getOperationLogs } from '@/api/operation-logs'
import dayjs from 'dayjs'

const loading = ref(false)
const logs = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dateRange = ref([])
const detailVisible = ref(false)
const currentLog = ref(null)

const filterForm = reactive({
  module: '',
  operationType: '',
  operator: '',
})

function formatTime(time) {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

function moduleText(module) {
  const map = {
    appointment: '预约',
    service: '服务',
    technician: '技师',
    membership: '会员卡',
    cashier: '收银',
    setting: '系统设置',
    user: '用户',
    dictionary: '字典',
    schedule: '排班',
    checkin: '核销',
    reminder: '提醒',
  }
  return map[module] || module || '-'
}

function typeText(type) {
  const map = {
    create: '创建',
    update: '更新',
    delete: '删除',
    query: '查询',
    login: '登录',
    logout: '登出',
    checkin: '签到',
    checkout: '签退',
    payment: '支付',
    refund: '退款',
    other: '其他',
  }
  return map[type] || type || '-'
}

function typeTag(type) {
  const map = {
    create: 'success',
    update: 'warning',
    delete: 'danger',
    query: 'info',
    login: 'primary',
    payment: 'success',
    refund: 'danger',
  }
  return map[type] || 'info'
}

async function loadLogs() {
  loading.value = true
  try {
    const params = {}
    if (filterForm.module) params.module = filterForm.module
    if (filterForm.operationType) params.operationType = filterForm.operationType
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const data = await getOperationLogs(params)
    logs.value = data
    total.value = data.length
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterForm.module = ''
  filterForm.operationType = ''
  filterForm.operator = ''
  dateRange.value = []
  loadLogs()
}

function handleView(row) {
  currentLog.value = row
  detailVisible.value = true
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped lang="scss">
.logs-page {
  .filter-card {
    margin-bottom: 20px;
  }

  .pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }

  .json-view {
    background: #f5f7fa;
    padding: 12px;
    border-radius: 6px;
    font-size: 12px;
    max-height: 300px;
    overflow: auto;
  }
}
</style>
