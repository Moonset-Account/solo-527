<template>
  <div class="court-list">
    <div class="page-header">
      <h2>场地列表</h2>
      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索场地名称"
          clearable
          style="width: 200px; margin-right: 10px;"
          @keyup.enter="fetchCourtList"
        />
        <el-select v-model="statusFilter" placeholder="场地状态" clearable style="width: 150px; margin-right: 10px;">
          <el-option label="可用" :value="1" />
          <el-option label="不可用" :value="0" />
        </el-select>
        <el-button type="primary" @click="fetchCourtList">搜索</el-button>
      </div>
    </div>

    <div class="court-grid">
      <el-card
        v-for="court in courtList"
        :key="court.id"
        class="court-card"
        shadow="hover"
      >
        <template #header>
          <div class="card-header">
            <span class="court-name">{{ court.name }}</span>
            <el-tag :type="court.status === 1 ? 'success' : 'danger'">
              {{ court.status === 1 ? '可用' : '不可用' }}
            </el-tag>
          </div>
        </template>
        <div class="court-info">
          <p><span class="label">场地编号：</span>{{ court.courtNo }}</p>
          <p><span class="label">场地类型：</span>{{ court.type }}</p>
          <p><span class="label">价格：</span><span class="price">¥{{ court.pricePerHour }}</span>/小时</p>
          <p class="description">{{ court.description }}</p>
        </div>
        <div class="card-actions">
          <el-button
            type="primary"
            :disabled="court.status !== 1"
            @click="goToBooking(court)"
          >
            立即预约
          </el-button>
        </div>
      </el-card>
    </div>

    <div class="pagination">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCourtPage } from '@/api/court'
import { ElMessage } from 'element-plus'

const router = useRouter()

const courtList = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const statusFilter = ref(null)

const fetchCourtList = async () => {
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    if (keyword.value) {
      params.keyword = keyword.value
    }
    if (statusFilter.value !== null && statusFilter.value !== undefined) {
      params.status = statusFilter.value
    }
    const res = await getCourtPage(params)
    courtList.value = res.records
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取场地列表失败')
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
  pageNum.value = 1
  fetchCourtList()
}

const handleCurrentChange = (page) => {
  pageNum.value = page
  fetchCourtList()
}

const goToBooking = (court) => {
  router.push({
    path: '/booking/create',
    query: { courtId: court.id }
  })
}

onMounted(() => {
  fetchCourtList()
})
</script>

<style scoped>
.court-list {
  padding: 10px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 24px;
  color: #303133;
}

.filter-bar {
  display: flex;
  align-items: center;
}

.court-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.court-card {
  transition: transform 0.3s;
}

.court-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.court-name {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.court-info {
  padding: 10px 0;
}

.court-info p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
}

.court-info .label {
  color: #909399;
}

.court-info .price {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

.court-info .description {
  color: #909399;
  font-size: 13px;
  margin-top: 12px;
  line-height: 1.5;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}
</style>
