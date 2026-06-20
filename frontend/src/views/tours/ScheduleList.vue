<template>
  <div>
    <div class="filter-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="已排期" value="scheduled" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="司机">
          <el-input v-model="searchForm.driver" placeholder="司机名称" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="路线名称"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
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
        <div class="section-title" style="margin-bottom: 0">排期列表</div>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增排期
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column label="路线" min-width="160">
          <template #default="{ row }">
            <div class="tour-name">{{ row.tour?.name }}</div>
            <div class="tour-code">{{ row.tour?.code }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="tourDate" label="日期" width="120" />
        <el-table-column label="时间" width="140">
          <template #default="{ row }">
            {{ row.startTime }} - {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column label="库存" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round((row.booked / row.capacity) * 100)"
              :status="getStockStatus(row)"
            />
            <div class="stock-text">{{ row.booked }}/{{ row.capacity }} 人</div>
          </template>
        </el-table-column>
        <el-table-column label="司机" width="140">
          <template #default="{ row }">
            {{ row.driver?.name || '未分配' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="goToInventory(row.id)">
              库存详情
            </el-button>
            <el-button text type="primary" @click="handleEdit(row)">
              编辑
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
import { useRouter } from 'vue-router'
import { getSchedules, createSchedule, updateSchedule } from '@/api/tours'
import { ElMessage } from 'element-plus'

const router = useRouter()

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
  driver: ''
})

const dateRange = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: searchForm.status || undefined,
      startDate: dateRange.value?.[0]?.toISOString().split('T')[0],
      endDate: dateRange.value?.[1]?.toISOString().split('T')[0]
    }
    const res = await getSchedules(params)
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
  searchForm.driver = ''
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

const goToInventory = (id) => {
  router.push(`/inventory/${id}`)
}

const handleCreate = () => {
  // create logic
}

const handleEdit = (row) => {
  // edit logic
}

const getStockStatus = (row) => {
  const rate = row.booked / row.capacity
  if (rate >= 0.9) return 'exception'
  if (rate >= 0.8) return 'warning'
  return ''
}

const formatStatus = (status) => {
  const map = {
    scheduled: '已排期',
    confirmed: '已确认',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    scheduled: 'info',
    confirmed: 'primary',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger'
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

.tour-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.tour-code {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.stock-text {
  font-size: 12px;
  color: #606266;
  text-align: center;
  margin-top: 4px;
}
</style>
