<template>
  <div class="announcements-page">
    <div class="page-header">
      <h1 class="page-title">公共公告</h1>
      <div class="header-actions">
        <el-button v-if="isAdmin" type="primary" :icon="Plus" @click="showAdd = true">
          发布公告
        </el-button>
      </div>
    </div>

    <el-card class="card-wrapper">
      <div class="filter-bar">
        <el-select v-model="filterType" placeholder="类型筛选" clearable style="width: 150px">
          <el-option label="通知" value="info" />
          <el-option label="警告" value="warning" />
          <el-option label="重要" value="important" />
        </el-select>
        <el-switch v-if="isAdmin" v-model="showAll" active-text="全部" inactive-text="已发布" />
      </div>

      <div class="announcement-list">
        <div v-if="announcements.length === 0" class="empty">
          <el-empty description="暂无公告" />
        </div>
        <div v-for="announcement in filteredAnnouncements" :key="announcement.id" class="announcement-item">
          <div class="announcement-header">
            <div class="announcement-title">
              <el-tag :type="getTypeTag(announcement.type)" size="small">
                {{ getTypeText(announcement.type) }}
              </el-tag>
              <h3>{{ announcement.title }}</h3>
            </div>
            <div class="announcement-meta">
              <span>{{ announcement.publishedByName }}</span>
              <span>{{ formatDate(announcement.publishedAt || announcement.createdAt) }}</span>
              <el-tag v-if="!announcement.isPublished" type="info" size="small">未发布</el-tag>
            </div>
          </div>
          <div class="announcement-content">{{ announcement.content }}</div>
          <div class="announcement-actions" v-if="isAdmin">
            <el-button v-if="!announcement.isPublished" type="success" size="small" @click="publish(announcement)">
              发布
            </el-button>
            <el-button v-else type="warning" size="small" @click="unpublish(announcement)">
              取消发布
            </el-button>
            <el-button type="danger" size="small" @click="deleteAnnouncement(announcement)">
              删除
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="showAdd" title="发布公告" width="600px">
      <el-form :model="announcementForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="announcementForm.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="announcementForm.type" style="width: 100%">
            <el-option label="通知" value="info" />
            <el-option label="警告" value="warning" />
            <el-option label="重要" value="important" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="announcementForm.content" type="textarea" :rows="6" placeholder="请输入公告内容" />
        </el-form-item>
        <el-form-item label="立即发布">
          <el-switch v-model="announcementForm.isPublished" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdd = false">取消</el-button>
        <el-button type="primary" @click="createAnnouncement">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { announcementService } from '@/services'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const announcements = ref([])
const filterType = ref('')
const showAll = ref(false)
const showAdd = ref(false)

const announcementForm = ref({
  title: '',
  type: 'info',
  content: '',
  isPublished: true
})

const isAdmin = computed(() => authStore.isAdmin)

const filteredAnnouncements = computed(() => {
  return announcements.value.filter(a => {
    if (filterType.value && a.type !== filterType.value) return false
    if (!showAll.value && !a.isPublished) return false
    return true
  })
})

onMounted(async () => {
  await loadAnnouncements()
})

async function loadAnnouncements() {
  if (isAdmin.value) {
    announcements.value = await announcementService.getAllAnnouncements()
  } else {
    announcements.value = await announcementService.getPublishedAnnouncements()
  }
}

function getTypeTag(type) {
  const map = {
    info: '',
    warning: 'warning',
    important: 'danger'
  }
  return map[type] || ''
}

function getTypeText(type) {
  const map = {
    info: '通知',
    warning: '警告',
    important: '重要'
  }
  return map[type] || type
}

function formatDate(date) {
  if (!date) return ''
  return dayjs(date.seconds ? date.seconds * 1000 : date).format('YYYY-MM-DD HH:mm')
}

async function createAnnouncement() {
  if (!announcementForm.value.title || !announcementForm.value.content) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    await announcementService.createAnnouncement(
      announcementForm.value,
      authStore.userId,
      authStore.userData.name
    )
    ElMessage.success('公告创建成功')
    showAdd.value = false
    announcementForm.value = { title: '', type: 'info', content: '', isPublished: true }
    await loadAnnouncements()
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

async function publish(announcement) {
  try {
    await announcementService.publishAnnouncement(announcement.id)
    ElMessage.success('已发布')
    await loadAnnouncements()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

async function unpublish(announcement) {
  try {
    await announcementService.unpublishAnnouncement(announcement.id)
    ElMessage.success('已取消发布')
    await loadAnnouncements()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

async function deleteAnnouncement(announcement) {
  ElMessageBox.confirm('确定要删除该公告吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await announcementService.delete(announcement.id)
      ElMessage.success('已删除')
      await loadAnnouncements()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}
</script>

<style scoped>
.announcements-page {
  padding: 0;
}
.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.announcement-item {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.3s;
}
.announcement-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}
.announcement-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.announcement-title h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}
.announcement-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
  align-items: center;
}
.announcement-content {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}
.announcement-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.empty {
  padding: 40px 0;
}
</style>
