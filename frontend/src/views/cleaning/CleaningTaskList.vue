<template>
  <div>
    <div class="filter-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="任务编号/地点/车牌号"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="待处理" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="searchForm.priority" placeholder="全部" clearable style="width: 100px">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="清洁类型">
          <el-select v-model="searchForm.cleaningType" placeholder="全部" clearable style="width: 120px">
            <el-option label="日常清洁" value="daily" />
            <el-option label="深度清洁" value="deep" />
            <el-option label="紧急清洁" value="emergency" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="searchForm.assignee" placeholder="负责人" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="计划日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <div class="flex-between mb-16">
        <div class="section-title" style="margin-bottom: 0">清洁任务列表</div>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新建任务
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column prop="taskNo" label="任务编号" width="140" />
        <el-table-column label="清洁类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getCleaningTypeType(row.cleaningType)" size="small">
              {{ formatCleaningType(row.cleaningType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="vehiclePlate" label="车牌号" width="100" />
        <el-table-column label="计划时间" width="180">
          <template #default="{ row }">
            {{ row.scheduledDate }} {{ row.scheduledTime || '' }}
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地点" width="140" show-overflow-tooltip />
        <el-table-column label="负责人" width="100">
          <template #default="{ row }">
            {{ row.assignee?.name || '未分配' }}
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">
              {{ formatPriority(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleDetail(row.id)">
              详情
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              text
              type="success"
              @click="handleStart(row)"
            >
              开始
            </el-button>
            <el-button
              v-if="row.status === 'in_progress'"
              text
              type="success"
              @click="handleComplete(row)"
            >
              完成
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCleaningTasks, updateCleaningTask, createCleaningTask } from '@/api/cleaning'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const searchForm = reactive({
  keyword: '',
  status: '',
  priority: '',
  cleaningType: '',
  assignee: ''
})

const dateRange = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword || undefined,
      status: searchForm.status || undefined,
      priority: searchForm.priority || undefined,
      cleaningType: searchForm.cleaningType || undefined,
      startDate: dateRange.value?.[0]?.toISOString().split('T')[0],
      endDate: dateRange.value?.[1]?.toISOString().split('T')[0]
    }
    const res = await getCleaningTasks(params)
    tableData.value = res.list
    pagination.total = res.total
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.priority = ''
  searchForm.cleaningType = ''
  searchForm.assignee = ''
  dateRange.value = []
  pagination.page = 1
  fetchData()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

const handleDetail = (id) => {
  // detail logic
}

const handleCreate = () => {
  // create logic
}

const handleStart = async (row) => {
  try {
    await updateCleaningTask(row.id, { status: 'in_progress' })
    ElMessage.success('任务已开始')
    fetchData()
  } catch (e) {
    // handled
  }
}

const handleComplete = async (row) => {
  try {
    await updateCleaningTask(row.id, { status: 'completed' })
    ElMessage.success('任务已完成')
    fetchData()
  } catch (e) {
    // handled
  }
}

const formatCleaningType = (type) => {
  const map = { daily: '日常清洁', deep: '深度清洁', emergency: '紧急清洁' }
  return map[type] || type
}

const getCleaningTypeType = (type) => {
  const map = { daily: 'info', deep: 'warning', emergency: 'danger' }
  return map[type] || 'info'
}

const formatPriority = (priority) => {
  const map = { low: '低', medium: '中', high: '高' }
  return map[priority] || priority
}

const getPriorityType = (priority) => {
  const map = { low: 'info', medium: 'warning', high: 'danger' }
  return map[priority] || 'info'
}

const formatStatus = (status) => {
  const map = {
    pending: '待处理',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    in_progress: 'primary',
    completed: 'success',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
