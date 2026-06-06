<template>
  <div class="repair-detail">
    <el-page-header @back="goBack" content="修复详情">
      <template #extra>
        <el-button @click="goBack">返回列表</el-button>
      </template>
    </el-page-header>
    
    <el-card v-if="record" class="detail-card">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="修复ID">{{ record.id }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(record.status)">
            {{ record.status_display }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="绘本名称">
          <span @click="goToBookDetail(record.book_copy?.book?.id)" class="link-text">
            {{ record.book_copy?.book?.title || record.book_title || '-' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="副本条码">{{ record.book_copy?.barcode || record.book_copy_barcode || '-' }}</el-descriptions-item>
        <el-descriptions-item label="破损类型">{{ record.damage_type_display || record.damage_type }}</el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityType(record.priority)">
            {{ record.priority_display || record.priority }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="报修人">{{ record.reported_by_name || record.reported_by?.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ record.assigned_to_name || record.assigned_to?.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="报修时间">{{ formatDate(record.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="预计完成">{{ formatDate(record.estimated_completion) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ formatDate(record.completed_at) }}</el-descriptions-item>
        <el-descriptions-item label="修复费用">¥{{ record.repair_cost || '0.00' }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider />
      
      <div v-if="record.damage_description" class="info-section">
        <h3>破损描述</h3>
        <p>{{ record.damage_description }}</p>
      </div>
      
      <el-divider />
      
      <div class="action-section">
        <h3>状态操作</h3>
        <el-space wrap>
          <el-button 
            type="primary" 
            @click="handleTransition('in_progress')"
            v-if="record.status === 'pending'"
          >
            开始修复
          </el-button>
          <el-button 
            type="success" 
            @click="handleTransition('completed')"
            v-if="record.status === 'in_progress'"
          >
            完成修复
          </el-button>
          <el-button 
            type="info" 
            @click="handleTransition('waiting_parts')"
            v-if="['pending', 'in_progress'].includes(record.status)"
          >
            等待配件
          </el-button>
          <el-button 
            type="danger" 
            @click="handleTransition('cancelled')"
            v-if="['pending', 'in_progress', 'waiting_parts'].includes(record.status)"
          >
            取消
          </el-button>
          <el-upload
            :action="uploadPhotoUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :before-upload="beforeUploadPhoto"
            :on-success="onPhotoUploaded"
            accept="image/*"
          >
            <el-button type="primary" size="small">上传修复照片</el-button>
          </el-upload>
        </el-space>
      </div>
      
      <el-divider />
      
      <div v-if="photos.length > 0" class="photos-section">
        <h3>修复照片 ({{ photos.length }})</h3>
        <el-row :gutter="10">
          <el-col :span="6" v-for="photo in photos" :key="photo.id">
            <div class="photo-item">
              <el-image
                :src="photo.image"
                :preview-src-list="photos.map(p => p.image)"
                :initial-index="photos.indexOf(photo)"
                fit="cover"
                class="photo-image"
                @click="previewPhoto(photo)"
              />
              <div v-if="photo.description" class="photo-desc">{{ photo.description }}</div>
              <div class="photo-stage">{{ photo.stage_display || photo.stage }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <el-divider />
      
      <div class="logs-section">
        <h3>状态流转</h3>
        <el-timeline>
          <el-timeline-item
            v-for="log in statusLogs"
            :key="log.id"
            :timestamp="formatDate(log.created_at)"
            :type="getTimelineType(log.to_status)"
          >
            <div class="log-item">
              <div class="log-status">
                <el-tag size="small">{{ log.to_status_display || log.to_status }}</el-tag>
              </div>
              <div class="log-operator">
                操作人：{{ log.operator_name || log.operator?.username || '系统' }}
              </div>
              <div v-if="log.notes" class="log-notes">
                备注：{{ log.notes }}
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>
    
    <el-empty v-else description="加载中..." />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const record = ref(null)
const photos = ref([])
const statusLogs = ref([])

const user = JSON.parse(localStorage.getItem('user') || '{}')

const uploadPhotoUrl = computed(() => {
  return `/api/repairs/records/${route.params.id}/add_photo/`
})

const uploadHeaders = computed(() => {
  return user.token ? { 'Authorization': `Bearer ${user.token}` } : {}
})

const getStatusType = (status) => {
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

const getTimelineType = (status) => {
  const typeMap = {
    'pending': 'warning',
    'in_progress': 'primary',
    'completed': 'success',
    'cancelled': 'danger'
  }
  return typeMap[status] || 'primary'
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

const loadDetail = async () => {
  try {
    const res = await api.repairs.detail(route.params.id)
    record.value = res
    photos.value = res.photos || []
    statusLogs.value = res.status_logs || []
  } catch (error) {
    ElMessage.error('加载详情失败')
  }
}

const handleTransition = async (newStatus) => {
  const statusNames = {
    'in_progress': '开始修复',
    'completed': '完成修复',
    'waiting_parts': '等待配件',
    'cancelled': '取消'
  }
  
  try {
    await ElMessageBox.confirm(
      `确定执行"${statusNames[newStatus]}"操作吗？`,
      '确认操作',
      { type: 'warning' }
    )
  } catch {
    return
  }
  
  try {
    await api.repairs.transition(route.params.id, { new_status: newStatus })
    ElMessage.success('操作成功')
    loadDetail()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '操作失败')
  }
}

const beforeUploadPhoto = (file) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

const onPhotoUploaded = (response) => {
  ElMessage.success('照片上传成功')
  loadDetail()
}

const previewPhoto = (photo) => {
}

const goBack = () => {
  router.push({ path: '/admin/repairs', query: route.query })
}

const goToBookDetail = (bookId) => {
  if (bookId) {
    router.push(`/admin/books/${bookId}`)
  }
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.repair-detail {
  padding: 20px;
}

.detail-card {
  margin-top: 20px;
}

.link-text {
  color: #409eff;
  cursor: pointer;
}

.link-text:hover {
  text-decoration: underline;
}

.info-section,
.action-section,
.photos-section,
.logs-section {
  margin-top: 20px;
}

.info-section h3,
.action-section h3,
.photos-section h3,
.logs-section h3 {
  margin-bottom: 15px;
  font-size: 16px;
}

.info-section p {
  color: #606266;
  line-height: 1.8;
}

.photo-item {
  margin-bottom: 15px;
}

.photo-image {
  width: 100%;
  height: 120px;
  border-radius: 4px;
  cursor: pointer;
}

.photo-desc {
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-stage {
  margin-top: 3px;
  font-size: 11px;
  color: #909399;
}

.log-item {
  padding: 5px 0;
}

.log-status {
  margin-bottom: 5px;
}

.log-operator {
  color: #909399;
  font-size: 13px;
}

.log-notes {
  color: #606266;
  font-size: 13px;
  margin-top: 5px;
}
</style>
