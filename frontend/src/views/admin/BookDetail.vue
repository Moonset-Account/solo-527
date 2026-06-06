<template>
  <div class="book-detail">
    <el-page-header @back="goBack" content="绘本详情">
      <template #extra>
        <el-button @click="goBack">返回列表</el-button>
      </template>
    </el-page-header>
    
    <el-card v-if="book" class="detail-card">
      <div class="book-header">
        <el-image :src="book.cover" fit="cover" class="cover-image" />
        <div class="book-info">
          <h2>{{ book.title }}</h2>
          <el-tag :type="getStatusType(book.status)" size="large">
            {{ book.status_display }}
          </el-tag>
          <el-tag v-if="book.can_borrow" type="success" size="large" style="margin-left: 10px;">
            可外借
          </el-tag>
          <el-tag v-else type="info" size="large" style="margin-left: 10px;">
            不可外借
          </el-tag>
          
          <div class="info-row">
            <span class="label">ISBN：</span>
            <span>{{ book.isbn || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">作者：</span>
            <span>{{ book.author }}</span>
          </div>
          <div class="info-row">
            <span class="label">出版社：</span>
            <span>{{ book.publisher }}</span>
          </div>
          <div class="info-row">
            <span class="label">适合年龄：</span>
            <span>{{ book.age_min }} - {{ book.age_max }} 岁</span>
          </div>
          <div class="info-row">
            <span class="label">馆藏位置：</span>
            <span>{{ book.location || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="label">库存：</span>
            <span>共 {{ book.total_copies }} 本，可借 {{ book.available_copies }} 本</span>
          </div>
        </div>
      </div>
      
      <el-divider />
      
      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane label="当前借阅" name="borrowing">
          <el-table :data="currentBorrowing" stripe v-if="currentBorrowing.length > 0">
            <el-table-column prop="family_name" label="借阅家庭" />
            <el-table-column prop="borrower" label="借阅人" />
            <el-table-column label="状态">
              <template #default="{ row }">
                <el-tag :type="getBorrowStatusType(row.status)">
                  {{ row.status_display }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="borrowed_at" label="借阅时间">
              <template #default="{ row }">
                {{ formatDate(row.borrowed_at || row.reserved_at) }}
              </template>
            </el-table-column>
            <el-table-column prop="due_date" label="应还时间">
              <template #default="{ row }">
                <span :class="isOverdue(row.due_date, row.status) ? 'overdue' : ''">
                  {{ formatDate(row.due_date) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="goToBorrowDetail(row.id)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无当前借阅" />
        </el-tab-pane>
        
        <el-tab-pane label="历史破损/修复" name="repairs">
          <el-table :data="repairHistory" stripe v-if="repairHistory.length > 0">
            <el-table-column prop="damage_type_display" label="破损类型" />
            <el-table-column label="状态">
              <template #default="{ row }">
                <el-tag :type="getRepairStatusType(row.status)">
                  {{ row.status_display }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="priority" label="优先级">
              <template #default="{ row }">
                <el-tag :type="getPriorityType(row.priority)" size="small">
                  {{ row.priority }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reported_by" label="报修人" />
            <el-table-column prop="created_at" label="报修时间">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column prop="completed_at" label="完成时间">
              <template #default="{ row }">
                {{ formatDate(row.completed_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="goToRepairDetail(row.id)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无破损修复记录" />
        </el-tab-pane>
        
        <el-tab-pane label="关联活动" name="activities">
          <el-table :data="relatedActivities" stripe v-if="relatedActivities.length > 0">
            <el-table-column prop="title" label="活动名称" />
            <el-table-column prop="activity_type_display" label="活动类型" />
            <el-table-column label="状态">
              <template #default="{ row }">
                <el-tag :type="getActivityStatusType(row.status)">
                  {{ row.status_display }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="start_time" label="开始时间">
              <template #default="{ row }">
                {{ formatDate(row.start_time) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="goToActivityDetail(row.id)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无关联活动" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <el-empty v-else description="加载中..." />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const book = ref(null)
const activeTab = ref('borrowing')
const currentBorrowing = ref([])
const repairHistory = ref([])
const relatedActivities = ref([])

const getStatusType = (status) => {
  const typeMap = {
    'draft': 'info',
    'published': 'success',
    'off_shelf': 'danger'
  }
  return typeMap[status] || 'info'
}

const getBorrowStatusType = (status) => {
  const typeMap = {
    'reserved': 'info',
    'picked_up': 'warning',
    'borrowed': 'primary',
    'overdue': 'danger',
    'returned': 'success',
    'cancelled': 'info'
  }
  return typeMap[status] || 'info'
}

const getRepairStatusType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'in_progress': 'primary',
    'waiting_parts': 'info',
    'completed': 'success',
    'cancelled': 'danger'
  }
  return typeMap[status] || 'info'
}

const getPriorityType = (priority) => {
  const typeMap = {
    'low': 'info',
    'medium': 'warning',
    'high': 'danger'
  }
  return typeMap[priority] || 'info'
}

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
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isOverdue = (dueDate, status) => {
  if (!dueDate || ['returned', 'cancelled'].includes(status)) return false
  return new Date(dueDate) < new Date()
}

const loadDetail = async () => {
  try {
    const res = await api.books.detail(route.params.id)
    book.value = res
    currentBorrowing.value = res.current_borrowing || []
    repairHistory.value = res.repair_history || []
    relatedActivities.value = res.related_activities || []
  } catch (error) {
    ElMessage.error('加载详情失败')
  }
}

const goBack = () => {
  router.push({ path: '/admin/books', query: route.query })
}

const goToBorrowDetail = (id) => {
  router.push({ path: `/admin/borrowing/${id}`, query: route.query })
}

const goToRepairDetail = (id) => {
  router.push({ path: `/admin/repairs/${id}`, query: route.query })
}

const goToActivityDetail = (id) => {
  ElMessage.info('活动详情页待实现')
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.book-detail {
  padding: 20px;
}

.detail-card {
  margin-top: 20px;
}

.book-header {
  display: flex;
  gap: 30px;
}

.cover-image {
  width: 200px;
  height: 260px;
  border-radius: 8px;
  flex-shrink: 0;
}

.book-info {
  flex: 1;
}

.book-info h2 {
  margin: 0 0 15px 0;
  font-size: 24px;
}

.info-row {
  margin: 10px 0;
  display: flex;
  align-items: center;
}

.label {
  font-weight: 500;
  color: #606266;
  width: 90px;
  flex-shrink: 0;
}

.detail-tabs {
  margin-top: 20px;
}

.overdue {
  color: #f56c6c;
  font-weight: 500;
}
</style>
