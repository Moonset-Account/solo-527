<template>
  <div class="activity-detail">
    <el-page-header @back="goBack" content="活动详情" />
    
    <el-card v-if="activity" class="detail-card">
      <div class="activity-header">
        <el-image :src="activity.cover" fit="cover" class="cover-image" />
        <div class="activity-info">
          <h2>{{ activity.title }}</h2>
          <el-tag :type="getStatusType(activity.status)" size="large">
            {{ activity.status_display }}
          </el-tag>
          <div class="info-row">
            <span class="label">活动类型：</span>
            <span>{{ activity.activity_type_display }}</span>
          </div>
          <div class="info-row">
            <span class="label">适合年龄：</span>
            <span>{{ activity.age_min }} - {{ activity.age_max }} 岁</span>
          </div>
          <div class="info-row">
            <span class="label">活动地点：</span>
            <span>{{ activity.location }}</span>
          </div>
          <div class="info-row">
            <span class="label">活动时间：</span>
            <span>{{ formatDate(activity.start_time) }} - {{ formatDate(activity.end_time) }}</span>
          </div>
          <div class="info-row">
            <span class="label">报名时间：</span>
            <span>{{ formatDate(activity.registration_start) }} - {{ formatDate(activity.registration_end) }}</span>
          </div>
          <div class="info-row">
            <span class="label">名额：</span>
            <span>已报名 {{ activity.registered_count }} / {{ activity.max_participants }} 人</span>
            <span v-if="activity.waitlist_count > 0" style="margin-left: 10px; color: #e6a23c;">
              候补 {{ activity.waitlist_count }} 人
            </span>
          </div>
          <div v-if="activity.requires_deposit" class="info-row deposit-info">
            <el-icon><WarningFilled /></el-icon>
            <span>需缴纳押金：¥{{ activity.deposit_amount }}</span>
          </div>
        </div>
      </div>
      
      <el-divider />
      
      <div class="activity-content">
        <h3>活动介绍</h3>
        <div v-html="activity.description" class="description"></div>
      </div>
      
      <el-divider />
      
      <div class="related-books" v-if="activity.related_books && activity.related_books.length > 0">
        <h3>相关绘本</h3>
        <el-row :gutter="20">
          <el-col :span="6" v-for="book in activity.related_books" :key="book.id">
            <el-card shadow="hover" @click="goToBook(book.id)" class="book-card">
              <el-image :src="book.cover" fit="cover" class="book-cover" />
              <div class="book-info">
                <div class="book-title">{{ book.title }}</div>
                <div class="book-author">{{ book.author }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <el-divider />
      
      <div class="register-section">
        <h3>报名活动</h3>
        <el-alert v-if="!canRegister" :title="registerMessage" type="info" show-icon :closable="false" />
        
        <div v-else class="register-form">
          <el-form :model="registerForm" label-width="100px">
            <el-form-item label="选择孩子">
              <el-select v-model="registerForm.child_id" placeholder="请选择要报名的孩子">
                <el-option
                  v-for="child in children"
                  :key="child.id"
                  :label="`${child.name} (${child.age}岁)`"
                  :value="child.id"
                />
              </el-select>
            </el-form-item>
            
            <el-form-item>
              <el-button 
                type="primary" 
                @click="handleRegister"
                :loading="registering"
              >
                {{ activity.has_available_slots ? '立即报名' : '加入候补' }}
              </el-button>
              <span v-if="!activity.has_available_slots" class="waitlist-tip">
                当前候补排位：第 {{ (activity.waitlist_count || 0) + 1 }} 位
              </span>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>
    
    <el-empty v-else description="加载中..." />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const activity = ref(null)
const children = ref([])
const registering = ref(false)
const registerForm = ref({
  child_id: null
})

const canRegister = computed(() => {
  if (!activity.value) return false
  if (activity.value.status !== 'registration_open') return false
  if (!children.value || children.value.length === 0) return false
  
  const now = new Date()
  const regStart = new Date(activity.value.registration_start)
  const regEnd = new Date(activity.value.registration_end)
  
  if (now < regStart || now > regEnd) return false
  
  return true
})

const registerMessage = computed(() => {
  if (!activity.value) return ''
  if (activity.value.status !== 'registration_open') return '活动报名未开启或已结束'
  if (!children.value || children.value.length === 0) return '请先添加孩子信息'
  
  const now = new Date()
  const regStart = new Date(activity.value.registration_start)
  const regEnd = new Date(activity.value.registration_end)
  
  if (now < regStart) return `报名尚未开始，请于 ${formatDate(activity.value.registration_start)} 后报名`
  if (now > regEnd) return '报名已截止'
  
  return ''
})

const getStatusType = (status) => {
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
  return d.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadActivity = async () => {
  try {
    const res = await api.activities.detail(route.params.id)
    activity.value = res
  } catch (error) {
    ElMessage.error('加载活动详情失败')
  }
}

const loadChildren = async () => {
  try {
    const res = await api.accounts.children()
    children.value = res.results || res
  } catch (error) {
    console.error('加载孩子信息失败', error)
  }
}

const handleRegister = async () => {
  if (!registerForm.value.child_id) {
    ElMessage.warning('请选择要报名的孩子')
    return
  }
  
  const child = children.value.find(c => c.id === registerForm.value.child_id)
  if (child) {
    if (child.age < activity.value.age_min || child.age > activity.value.age_max) {
      ElMessage.error(`孩子年龄不符合要求，需要 ${activity.value.age_min}-${activity.value.age_max} 岁`)
      return
    }
  }
  
  const confirmText = activity.value.has_available_slots 
    ? '确认报名此活动吗？' 
    : `活动名额已满，确认加入候补吗？当前候补排位：第 ${(activity.value.waitlist_count || 0) + 1} 位`
  
  try {
    await ElMessageBox.confirm(confirmText, '确认报名', {
      type: 'info'
    })
  } catch {
    return
  }
  
  registering.value = true
  try {
    await api.activities.register({
      activity_id: activity.value.id,
      child_id: registerForm.value.child_id
    })
    
    const successMsg = activity.value.has_available_slots 
      ? '报名成功！' 
      : '已加入候补队列，有名额时会通知您'
    ElMessage.success(successMsg)
    
    await loadActivity()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '报名失败，请检查押金状态和历史预约记录')
  } finally {
    registering.value = false
  }
}

const goBack = () => {
  router.back()
}

const goToBook = (id) => {
  router.push(`/books/${id}`)
}

onMounted(() => {
  loadActivity()
  loadChildren()
})
</script>

<style scoped>
.activity-detail {
  padding: 20px;
}

.detail-card {
  margin-top: 20px;
}

.activity-header {
  display: flex;
  gap: 30px;
}

.cover-image {
  width: 300px;
  height: 200px;
  border-radius: 8px;
  flex-shrink: 0;
}

.activity-info {
  flex: 1;
}

.activity-info h2 {
  margin: 0 0 15px 0;
  font-size: 24px;
}

.info-row {
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: #606266;
  width: 90px;
  flex-shrink: 0;
}

.deposit-info {
  color: #e6a23c;
  margin-top: 15px;
}

.description {
  line-height: 1.8;
  color: #606266;
}

.related-books h3 {
  margin-bottom: 20px;
}

.book-card {
  cursor: pointer;
}

.book-cover {
  width: 100%;
  height: 160px;
}

.book-info {
  padding: 10px 0;
}

.book-title {
  font-weight: 500;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  color: #909399;
  font-size: 13px;
}

.register-section h3 {
  margin-bottom: 20px;
}

.register-form {
  max-width: 400px;
}

.waitlist-tip {
  margin-left: 15px;
  color: #e6a23c;
  font-size: 14px;
}
</style>
