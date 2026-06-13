<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">内容管理</h2>
      <el-button type="primary" @click="$router.push('/contents/create')">
        <el-icon><Plus /></el-icon>新建内容
      </el-button>
    </div>

    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">关键词：</span>
          <el-input v-model="filters.keyword" placeholder="标题/选题" style="width: 200px" clearable @keyup.enter="loadList" />
        </div>
        <div class="filter-item">
          <span class="filter-label">状态：</span>
          <el-select v-model="filters.status" placeholder="全部" style="width: 140px" clearable>
            <el-option v-for="(v, k) in CONTENT_STATUS" :key="k" :label="v.label" :value="k" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">负责人：</span>
          <el-select v-model="filters.assignee" placeholder="全部" style="width: 140px" clearable>
            <el-option v-for="u in USERS" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">创建人：</span>
          <el-select v-model="filters.creator" placeholder="全部" style="width: 140px" clearable>
            <el-option v-for="u in USERS" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">日期范围：</span>
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </div>
        <el-button type="primary" @click="loadList">
          <el-icon><Search /></el-icon>查询
        </el-button>
        <el-button @click="resetFilters">
          <el-icon><Refresh /></el-icon>重置
        </el-button>
      </div>
    </div>

    <div class="card">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-button type="primary" link @click="goDetail(row._id)">{{ row.title }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="topic" label="选题" width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">{{ getStatusLabel(row.status) }}</el-tag>
            <el-tag v-if="row.isException" type="danger" style="margin-left: 4px" size="small">异常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="负责人" width="100">
          <template #default="{ row }">{{ getUserById(row.assignee).name }}</template>
        </el-table-column>
        <el-table-column label="创建人" width="100">
          <template #default="{ row }">{{ getUserById(row.creator).name }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goDetail(row._id)">详情</el-button>
            <el-button type="primary" link size="small" @click="goEdit(row._id)" v-if="row.status === 'draft'">编辑</el-button>
            <el-button type="success" link size="small" @click="handleSubmit(row)" v-if="row.status === 'draft'">提交审稿</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)" v-if="['draft', 'rejected'].includes(row.status)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { contentApi } from '@/api'
import { CONTENT_STATUS, USERS, getStatusLabel, getStatusType, formatDate, getUserById } from '@/utils/constants'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const filters = reactive({
  keyword: '',
  status: '',
  assignee: '',
  creator: '',
  dateRange: []
})
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

async function loadList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      status: filters.status || undefined,
      assignee: filters.assignee || undefined,
      creator: filters.creator || undefined,
      startDate: filters.dateRange?.[0] || undefined,
      endDate: filters.dateRange?.[1] || undefined
    }
    const res = await contentApi.list(params)
    tableData.value = res.list
    pagination.total = res.total
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.status = ''
  filters.assignee = ''
  filters.creator = ''
  filters.dateRange = []
  pagination.page = 1
  loadList()
}

function goDetail(id) {
  router.push(`/contents/${id}`)
}

function goEdit(id) {
  router.push(`/contents/create?id=${id}`)
}

function handleSubmit(row) {
  ElMessageBox.confirm(`确定要提交"${row.title}"进入审稿流程吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await contentApi.submitReview(row._id, { operator: 'u001' })
    ElMessage.success('提交成功')
    loadList()
  }).catch(() => {})
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除"${row.title}"吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await contentApi.remove(row._id)
    ElMessage.success('删除成功')
    loadList()
  }).catch(() => {})
}

onMounted(loadList)
</script>
