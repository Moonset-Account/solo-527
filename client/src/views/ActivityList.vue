<template>
  <div class="activity-list">
    <el-card shadow="never" class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索活动名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="报名中" value="open" />
            <el-option label="进行中" value="ongoing" />
            <el-option label="已结束" value="closed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table
        :data="activityStore.list"
        v-loading="activityStore.loading"
        stripe
        style="width: 100%"
        @row-click="handleRowClick"
        class="activity-table"
      >
        <el-table-column prop="title" label="活动名称" min-width="180" />
        <el-table-column prop="organizer" label="组织者" width="120" />
        <el-table-column label="活动时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地点" width="140" />
        <el-table-column label="参与人数" width="120" align="center">
          <template #default="{ row }">
            {{ row.currentParticipants }}/{{ row.maxParticipants }}
          </template>
        </el-table-column>
        <el-table-column label="费用" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.fee }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="保障" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.guaranteeEnabled" type="success" size="small">已开启</el-tag>
            <el-tag v-else type="info" size="small">未开启</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="报名状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isRegistered" type="success" size="small">已报名</el-tag>
            <el-tag v-else type="info" size="small">未报名</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="activityStore.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { useActivityStore } from '../stores/activity'

const router = useRouter()
const activityStore = useActivityStore()

const searchForm = reactive({
  keyword: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const statusMap: Record<string, string> = {
  draft: '草稿',
  open: '报名中',
  ongoing: '进行中',
  closed: '已结束',
  cancelled: '已取消'
}

const statusTagTypeMap: Record<string, 'info' | 'success' | 'warning' | 'danger' | ''> = {
  draft: 'info',
  open: 'success',
  ongoing: 'warning',
  closed: '',
  cancelled: 'danger'
}

const statusLabel = (status: string) => statusMap[status] || status
const statusTagType = (status: string) => statusTagTypeMap[status] || ''

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleSearch = () => {
  activityStore.fetchList({
    keyword: searchForm.keyword || undefined,
    status: searchForm.status || undefined,
    page: pagination.page,
    pageSize: pagination.pageSize
  })
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  pagination.page = 1
  handleSearch()
}

const handleRowClick = (row: any) => {
  router.push(`/activity/${row._id}`)
}

onMounted(() => {
  handleSearch()
})
</script>

<style scoped>
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card :deep(.el-card__body) {
  padding-bottom: 0;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.activity-table {
  cursor: pointer;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
