<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">操作日志</h2>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="filters">
        <el-form-item label="模块">
          <el-input v-model="filters.module" placeholder="模块名称" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="操作">
          <el-input v-model="filters.action" placeholder="操作类型" clearable style="width: 150px" />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input v-model="filters.userId" placeholder="用户ID" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="风险相关">
          <el-switch v-model="isRiskRelated" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column label="操作时间" width="180">
          <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="action" label="操作" width="100" />
        <el-table-column label="操作人" width="120">
          <template #default="{ row }">{{ row.user?.realName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="resourceType" label="资源类型" width="120" />
        <el-table-column prop="resourceId" label="资源ID" width="100" align="right" />
        <el-table-column label="风险相关" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isRiskRelated" type="danger" size="small">是</el-tag>
            <el-tag v-else size="small">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ipAddress" label="IP地址" width="140" />
        <el-table-column prop="userAgent" label="浏览器" show-overflow-tooltip />
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.perPage"
          :page-sizes="[20, 50, 100, 200]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { logApi } from '@/api/modules'
import dayjs from 'dayjs'

const loading = ref(false)
const tableData = ref([])
const dateRange = ref([])
const isRiskRelated = ref(false)

const filters = reactive({
  module: '',
  action: '',
  userId: '',
})

const pagination = reactive({
  page: 1,
  perPage: 20,
  total: 0,
})

function formatDateTime(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      perPage: pagination.perPage,
      ...filters,
      isRiskRelated: isRiskRelated.value ? 'true' : '',
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await logApi.list(params)
    tableData.value = res.data.data
    pagination.total = res.data.total || res.data.data?.length || 0
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.module = ''
  filters.action = ''
  filters.userId = ''
  dateRange.value = []
  isRiskRelated.value = false
  pagination.page = 1
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
