<template>
  <div class="activity-list">
    <div class="page-header">
      <h2>活动中心</h2>
      <div class="filters">
        <el-select v-model="filterStatus" placeholder="活动状态" clearable @change="loadActivities">
          <el-option label="报名中" value="registration_open" />
          <el-option label="即将开始" value="upcoming" />
          <el-option label="进行中" value="in_progress" />
          <el-option label="已结束" value="completed" />
        </el-select>
        <el-select v-model="filterType" placeholder="活动类型" clearable @change="loadActivities">
          <el-option label="故事会" value="story_telling" />
          <el-option label="手工活动" value="handcraft" />
          <el-option label="读书会" value="reading" />
          <el-option label="育儿讲座" value="parenting" />
        </el-select>
      </div>
    </div>
    
    <el-row :gutter="20" v-loading="loading">
      <el-col :span="8" v-for="activity in activities" :key="activity.id">
        <el-card shadow="hover" class="activity-card" @click="goToDetail(activity.id)">
          <div class="card-cover">
            <el-image :src="activity.cover" fit="cover" class="cover-image" />
            <el-tag :type="getActivityStatusType(activity.status)" class="status-tag" size="small">
              {{ activity.status_display }}
            </el-tag>
          </div>
          <div class="card-content">
            <h3 class="activity-title">{{ activity.title }}</h3>
            <div class="activity-meta">
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(activity.start_time) }}
              </span>
              <span class="meta-item">
                <el-icon><Location /></el-icon>
                {{ activity.location }}
              </span>
            </div>
            <div class="activity-info">
              <span class="age-range">{{ activity.age_min }}-{{ activity.age_max }}岁</span>
              <span class="participants">
                已报名 {{ activity.registered_count }}/{{ activity.max_participants }}
                <span v-if="activity.waitlist_count > 0" class="waitlist">
                  (候补{{ activity.waitlist_count }})
                </span>
              </span>
            </div>
            <div class="activity-footer">
              <el-tag v-if="activity.requires_deposit" type="warning" size="small">
                押金 ¥{{ activity.deposit_amount }}
              </el-tag>
              <el-button type="primary" size="small" class="detail-btn">
                {{ activity.has_available_slots ? '立即报名' : (activity.waitlist_count > 0 ? '加入候补' : '已满员') }}
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-empty v-if="!loading && activities.length === 0" description="暂无活动" />
    
    <el-pagination
      v-if="total > 0"
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :total="total"
      :page-sizes="[12, 24, 48]"
      layout="total, sizes, prev, pager, next"
      @size-change="loadActivities"
      @current-change="loadActivities"
      class="pagination"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar, Location } from '@element-plus/icons-vue'
import api from '@/api'

const router = useRouter()

const loading = ref(false)
const activities = ref([])
const total = ref(0)
const filterStatus = ref('')
const filterType = ref('')
const pagination = reactive({
  page: 1,
  pageSize: 12
})

const getActivityStatusType = (status) => {
  const typeMap = {
    'draft': 'info',
    'published': 'info',
    'registration_open': 'success',
    'registration_closed': 'warning',
    'in_progress': 'primary',
    'completed': 'success',
    'cancelled': 'danger'
  }
  return typeMap[status] || 'info'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadActivities = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (filterStatus.value) {
      if (filterStatus.value === 'upcoming') {
        params.upcoming = 'true'
      } else {
        params.status = filterStatus.value
      }
    }
    if (filterType.value) {
      params.activity_type = filterType.value
    }
    
    const res = await api.activities.list(params)
    activities.value = res.results || res
    total.value = res.count || res.length || 0
  } catch (error) {
    console.error('加载活动列表失败', error)
  } finally {
    loading.value = false
  }
}

const goToDetail = (id) => {
  router.push(`/activities/${id}`)
}

onMounted(() => {
  loadActivities()
})
</script>

<style scoped>
.activity-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
}

.filters {
  display: flex;
  gap: 10px;
}

.activity-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s;
}

.activity-card:hover {
  transform: translateY(-2px);
}

.card-cover {
  position: relative;
  margin: -20px -20px 15px -20px;
}

.cover-image {
  width: 100%;
  height: 160px;
  border-radius: 4px 4px 0 0;
}

.status-tag {
  position: absolute;
  top: 10px;
  right: 10px;
}

.activity-title {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-meta {
  color: #909399;
  font-size: 13px;
  margin-bottom: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 5px;
}

.activity-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 13px;
}

.age-range {
  color: #409eff;
}

.participants {
  color: #606266;
}

.waitlist {
  color: #e6a23c;
  margin-left: 5px;
}

.activity-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-btn {
  margin-left: auto;
}

.pagination {
  margin-top: 30px;
  text-align: center;
}
</style>
