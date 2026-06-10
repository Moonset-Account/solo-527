<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { Subsidy } from '@/types'
import { subsidyApi } from '@/api'

const router = useRouter()

const loading = ref(false)
const tableData = ref<Subsidy[]>([])
const total = ref(0)

const filters = reactive({
  status: '',
  type: '',
  page: 1,
  pageSize: 10,
})

const statusOptions = [
  { label: '待审批', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
]

async function fetchData() {
  loading.value = true
  try {
    const res = await subsidyApi.getList({
      page: filters.page,
      pageSize: filters.pageSize,
      status: filters.status || undefined,
      type: filters.type || undefined,
    })
    tableData.value = res.items
    total.value = res.total
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

function handleRowClick(row: Subsidy) {
  router.push(`/subsidies/${row.id}`)
}

function handleView(row: Subsidy) {
  router.push(`/subsidies/${row.id}`)
}

function handleAdd() {
  ElMessage.info('新增补贴功能开发中')
}

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString()}`
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  }
  return map[status] || 'info'
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已驳回',
  }
  return map[status] || status
}

function truncateRemark(remark: string): string {
  if (!remark) return ''
  return remark.length > 20 ? remark.slice(0, 20) + '...' : remark
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="subsidy-list-page">
    <div class="page-header">
      <h2>补贴记录</h2>
      <el-button type="primary" @click="handleAdd">新增补贴</el-button>
    </div>

    <div class="filter-bar">
      <el-select
        v-model="filters.status"
        placeholder="状态筛选"
        clearable
        style="width: 140px"
      >
        <el-option
          v-for="opt in statusOptions"
          :key="opt.value"
          :label="opt.label"
          :value="opt.value"
        />
      </el-select>
      <el-input
        v-model="filters.type"
        placeholder="补贴类型搜索"
        clearable
        style="width: 200px"
        @keyup.enter="handleSearch"
      />
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      style="width: 100%"
      @row-click="handleRowClick"
    >
      <el-table-column prop="type" label="补贴类型" min-width="160" />
      <el-table-column label="金额" min-width="120">
        <template #default="{ row }">
          {{ formatAmount(row.amount) }}
        </template>
      </el-table-column>
      <el-table-column label="来源单据" min-width="140">
        <template #default="{ row }">
          <span class="link-text">{{ row.sourceDocumentNo }}</span>
        </template>
      </el-table-column>
      <el-table-column label="补充说明" min-width="180">
        <template #default="{ row }">
          <el-tooltip
            v-if="row.remark && row.remark.length > 20"
            :content="row.remark"
            placement="top"
          >
            <span>{{ truncateRemark(row.remark) }}</span>
          </el-tooltip>
          <span v-else>{{ row.remark }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createdBy" label="创建人" width="100" />
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          {{ row.createdAt }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click.stop="handleView(row)">查看</el-button>
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
.subsidy-list-page {
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

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.link-text {
  color: #409eff;
  cursor: pointer;
}

.link-text:hover {
  text-decoration: underline;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
