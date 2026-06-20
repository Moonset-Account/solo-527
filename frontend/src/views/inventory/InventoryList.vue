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
        <el-form-item label="路线">
          <el-select v-model="searchForm.tourId" placeholder="全部路线" clearable style="width: 180px">
            <el-option
              v-for="tour in tourOptions"
              :key="tour.id"
              :label="tour.name"
              :value="tour.id"
            />
          </el-select>
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
        <div class="section-title" style="margin-bottom: 0">库存汇总</div>
        <el-button @click="exportData">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" stripe>
        <el-table-column label="路线名称" min-width="160">
          <template #default="{ row }">
            <div style="font-weight: 500">{{ row.tourName }}</div>
            <div style="font-size: 12px; color: #909399">{{ row.tourCode }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="tourDate" label="日期" width="120" />
        <el-table-column label="时间" width="140">
          <template #default="{ row }">
            {{ row.startTime }} - {{ row.endTime }}
          </template>
        </el-table-column>
        <el-table-column prop="capacity" label="总容量" width="100" />
        <el-table-column prop="booked" label="已售" width="100" />
        <el-table-column label="可用" width="100">
          <template #default="{ row }">
            <span :class="{ 'low-stock': row.available <= 3 }">{{ row.available }}</span>
          </template>
        </el-table-column>
        <el-table-column label="上座率" width="160">
          <template #default="{ row }">
            <el-progress
              :percentage="row.occupancyRate"
              :status="getOccupancyStatus(row.occupancyRate)"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleDetail(row.id)">
              库存详情
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
import { getInventorySummary } from '@/api/inventory'
import { getTours } from '@/api/tours'

const router = useRouter()

const loading = ref(false)
const tableData = ref([])
const tourOptions = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const searchForm = reactive({
  tourId: ''
})

const dateRange = ref([])

const fetchTours = async () => {
  try {
    const res = await getTours({ pageSize: 100 })
    tourOptions.value = res.list
  } catch (e) {
    // handled
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      startDate: dateRange.value?.[0]?.toISOString().split('T')[0],
      endDate: dateRange.value?.[1]?.toISOString().split('T')[0],
      tourId: searchForm.tourId || undefined
    }
    const res = await getInventorySummary(params)
    tableData.value = res
    pagination.total = res.length
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
  searchForm.tourId = ''
  dateRange.value = []
  pagination.page = 1
  fetchData()
}

const handlePageChange = (page) => {
  pagination.page = page
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
}

const handleDetail = (id) => {
  router.push(`/inventory/${id}`)
}

const exportData = () => {
  // export logic
}

const getOccupancyStatus = (rate) => {
  if (rate >= 90) return 'exception'
  if (rate >= 80) return 'warning'
  return 'success'
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
  fetchTours()
  fetchData()
})
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.low-stock {
  color: #f56c6c;
  font-weight: 600;
}
</style>
