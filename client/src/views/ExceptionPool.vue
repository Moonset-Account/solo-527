<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">异常池</h2>
      <el-tag type="danger" effect="dark">共 {{ pagination.total }} 条异常</el-tag>
    </div>

    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">关键词：</span>
          <el-input v-model="filters.keyword" placeholder="标题/选题" style="width: 200px" clearable @keyup.enter="loadList" />
        </div>
        <div class="filter-item">
          <span class="filter-label">负责人：</span>
          <el-select v-model="filters.assignee" placeholder="全部" style="width: 140px" clearable>
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
        <el-button type="primary" @click="loadList">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </div>

    <div class="card">
      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="title" label="内容标题" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/contents/${row._id}`)">{{ row.title }}</el-button>
          </template>
        </el-table-column>
        <el-table-column label="异常状态" width="110">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="exceptionReason" label="异常原因" width="200" show-overflow-tooltip />
        <el-table-column prop="exceptionConclusion" label="处理结论" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.exceptionConclusion" style="color: #67c23a">{{ row.exceptionConclusion }}</span>
            <span v-else style="color: #f56c6c">待处理</span>
          </template>
        </el-table-column>
        <el-table-column label="处理人" width="100">
          <template #default="{ row }">{{ getUserById(row.exceptionHandler).name }}</template>
        </el-table-column>
        <el-table-column label="负责人" width="100">
          <template #default="{ row }">{{ getUserById(row.assignee).name }}</template>
        </el-table-column>
        <el-table-column label="发生时间" width="160">
          <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="$router.push(`/contents/${row._id}`)">详情</el-button>
            <el-button type="success" link size="small" @click="handleConclusion(row)" v-if="!row.exceptionConclusion">补充结论</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadList"
          @current-change="loadList"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="补充处理结论" width="500px">
      <el-form :model="conclusionForm" label-width="100px">
        <el-form-item label="处理结论" required>
          <el-input v-model="conclusionForm.conclusion" type="textarea" :rows="4" placeholder="请输入处理结论" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitConclusion">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { contentApi } from '@/api'
import { USERS, CONTENT_STATUS, getStatusLabel, getStatusType, formatDate, getUserById } from '@/utils/constants'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const currentId = ref('')
const filters = reactive({
  keyword: '',
  assignee: '',
  dateRange: []
})
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})
const conclusionForm = reactive({
  conclusion: '',
  handler: 'u004'
})

async function loadList() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filters.keyword || undefined,
      assignee: filters.assignee || undefined,
      startDate: filters.dateRange?.[0] || undefined,
      endDate: filters.dateRange?.[1] || undefined
    }
    const res = await contentApi.exceptions(params)
    tableData.value = res.list
    pagination.total = res.total
  } catch (e) {
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.assignee = ''
  filters.dateRange = []
  pagination.page = 1
  loadList()
}

function handleConclusion(row) {
  currentId.value = row._id
  conclusionForm.conclusion = row.exceptionConclusion || ''
  dialogVisible.value = true
}

async function submitConclusion() {
  if (!conclusionForm.conclusion) {
    ElMessage.warning('请输入处理结论')
    return
  }
  try {
    await contentApi.handleException(currentId.value, conclusionForm)
    ElMessage.success('提交成功')
    dialogVisible.value = false
    loadList()
  } catch (e) {}
}

onMounted(loadList)
</script>
