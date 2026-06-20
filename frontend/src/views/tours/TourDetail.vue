<template>
  <div v-loading="loading">
    <div class="page-header">
      <div>
        <el-button text @click="goBack" style="padding-left: 0">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title">{{ tour?.name }}</h2>
      </div>
      <el-button type="primary" @click="handleEdit">
        <el-icon><Edit /></el-icon>
        编辑路线
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <div class="card mb-20">
          <div class="section-title">基本信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="路线编码">{{ tour?.code }}</el-descriptions-item>
            <el-descriptions-item label="目的地">{{ tour?.destination }}</el-descriptions-item>
            <el-descriptions-item label="时长">{{ formatDuration(tour?.duration) }}</el-descriptions-item>
            <el-descriptions-item label="价格">¥{{ Number(tour?.price || 0).toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="容量">{{ tour?.capacity }} 人</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ tour?.operator?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(tour?.status)" size="small">{{ formatStatus(tour?.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="集合点">{{ tour?.meetingPoint || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="card mb-20">
          <div class="section-title">路线描述</div>
          <p class="description-text">{{ tour?.description || '暂无描述' }}</p>
        </div>

        <div class="card mb-20">
          <div class="section-title">行程亮点</div>
          <div v-if="tour?.highlights?.length > 0" class="highlights">
            <el-tag
              v-for="(h, idx) in tour.highlights"
              :key="idx"
              type="success"
              style="margin-right: 8px; margin-bottom: 8px"
            >
              {{ h }}
            </el-tag>
          </div>
          <div v-else class="empty-text">暂无亮点</div>
        </div>

        <div class="card">
          <div class="section-title">版本历史</div>
          <el-table :data="tour?.versions || []" size="small">
            <el-table-column prop="version" label="版本号" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'approved' ? 'success' : (row.status === 'rejected' ? 'danger' : 'warning')" size="small">
                  {{ formatVersionStatus(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="changeLog" label="变更说明" show-overflow-tooltip />
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="card mb-20">
          <div class="section-title">近期排期</div>
          <div class="schedule-list">
            <div v-if="schedules.length === 0" class="empty-text">暂无排期</div>
            <div v-for="s in schedules" :key="s.id" class="schedule-item">
              <div class="schedule-date">{{ s.tourDate }}</div>
              <div class="schedule-time">{{ s.startTime }} - {{ s.endTime }}</div>
              <div class="schedule-info">
                <el-tag size="small">{{ s.booked }}/{{ s.capacity }} 人</el-tag>
                <el-tag :type="getScheduleStatusType(s.status)" size="small">
                  {{ formatScheduleStatus(s.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getTour, getSchedules } from '@/api/tours'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const tour = ref(null)
const schedules = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const id = route.params.id
    tour.value = await getTour(id)

    const schedRes = await getSchedules({ tourId: id, pageSize: 10 })
    schedules.value = schedRes.list || []
  } catch (e) {
    // handled
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const handleEdit = () => {
  // edit logic
}

const formatDuration = (minutes) => {
  if (!minutes) return '-'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}小时${mins > 0 ? mins + '分' : ''}` : `${mins}分钟`
}

const formatStatus = (status) => {
  const map = { draft: '草稿', published: '已发布', archived: '已归档' }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = { draft: 'info', published: 'success', archived: 'danger' }
  return map[status] || 'info'
}

const formatVersionStatus = (status) => {
  const map = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }
  return map[status] || status
}

const formatScheduleStatus = (status) => {
  const map = { scheduled: '已排期', confirmed: '已确认', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

const getScheduleStatusType = (status) => {
  const map = { scheduled: 'info', confirmed: 'primary', in_progress: 'warning', completed: 'success', cancelled: 'danger' }
  return map[status] || 'info'
}

const formatDateTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.description-text {
  color: #606266;
  line-height: 1.8;
}

.highlights {
  display: flex;
  flex-wrap: wrap;
}

.empty-text {
  text-align: center;
  color: #c0c4cc;
  padding: 20px 0;
}

.schedule-list {
  max-height: 400px;
  overflow-y: auto;
}

.schedule-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;
}

.schedule-item:last-child {
  border-bottom: none;
}

.schedule-date {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.schedule-time {
  font-size: 12px;
  color: #909399;
  margin: 4px 0;
}

.schedule-info {
  display: flex;
  gap: 8px;
}
</style>
