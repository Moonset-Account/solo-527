<template>
  <div class="photo-log-page">
    <div class="page-header">
      <h1 class="page-title">照片日志</h1>
      <div class="header-actions">
        <el-button v-if="isResident" type="primary" :icon="Plus" @click="showUpload = true">
          上传照片
        </el-button>
      </div>
    </div>

    <el-card class="card-wrapper">
      <div class="filter-bar">
        <el-select v-model="filterPlot" placeholder="地块筛选" clearable style="width: 150px">
          <el-option v-for="plot in plots" :key="plot.id" :label="plot.plotNumber" :value="plot.id" />
        </el-select>
        <el-input v-model="filterTag" placeholder="按标签搜索" style="width: 200px" clearable />
        <el-select v-if="isAdmin" v-model="filterUser" placeholder="上传人筛选" clearable style="width: 150px">
          <el-option v-for="user in residents" :key="user.id" :label="user.name" :value="user.id" />
        </el-select>
      </div>

      <div v-if="photos.length === 0" class="empty">
        <el-empty description="暂无照片" />
      </div>
      <div v-else class="photo-grid">
        <div v-for="photo in filteredPhotos" :key="photo.id" class="photo-item">
          <div class="photo-wrapper">
            <el-image :src="photo.photoUrl" fit="cover" lazy preview-src-list="[photo.photoUrl]">
              <template #error>
                <div class="image-slot">
                  <el-icon :size="30"><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="photo-overlay">
              <el-button type="primary" size="small" circle :icon="View" @click="viewDetail(photo)" />
              <el-button 
                v-if="canDelete(photo)" 
                type="danger" 
                size="small" 
                circle 
                :icon="Delete" 
                @click="deletePhoto(photo)" 
              />
            </div>
          </div>
          <div class="photo-info">
            <div class="photo-title">{{ photo.title }}</div>
            <div class="photo-meta">
              <span>{{ photo.uploadedByName }}</span>
              <span>{{ formatDate(photo.createdAt) }}</span>
            </div>
            <div class="photo-tags">
              <el-tag v-for="tag in photo.tags" :key="tag" size="small" type="info">
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="showUpload" title="上传照片" width="500px">
      <el-upload
        class="avatar-uploader"
        :show-file-list="false"
        :on-change="handleFileChange"
        :auto-upload="false"
        accept="image/*"
      >
        <img v-if="previewUrl" :src="previewUrl" class="preview-image" />
        <el-icon v-else class="avatar-uploader-icon" :size="50"><Plus /></el-icon>
      </el-upload>
      <el-form :model="photoForm" label-width="80px" style="margin-top: 20px">
        <el-form-item label="标题">
          <el-input v-model="photoForm.title" placeholder="请输入照片标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="photoForm.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="关联地块">
          <el-select v-model="photoForm.plotId" placeholder="选择地块" clearable style="width: 100%">
            <el-option v-for="plot in myPlots" :key="plot.id" :label="plot.plotNumber" :value="plot.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="photoForm.tags" multiple filterable allow-create placeholder="添加标签" style="width: 100%">
            <el-option label="种植" value="种植" />
            <el-option label="生长" value="生长" />
            <el-option label="开花" value="开花" />
            <el-option label="结果" value="结果" />
            <el-option label="收获" value="收获" />
            <el-option label="病虫害" value="病虫害" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUpload = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="uploadPhoto">上传</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="照片详情" width="600px">
      <div v-if="selectedPhoto">
        <el-image :src="selectedPhoto.photoUrl" fit="contain" style="width: 100%; max-height: 400px" />
        <el-descriptions :column="2" style="margin-top: 20px" border>
          <el-descriptions-item label="标题">{{ selectedPhoto.title }}</el-descriptions-item>
          <el-descriptions-item label="上传人">{{ selectedPhoto.uploadedByName }}</el-descriptions-item>
          <el-descriptions-item label="上传时间">{{ formatDate(selectedPhoto.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="关联地块">{{ selectedPhoto.plotId ? '地块 ' + selectedPhoto.plotId : '-' }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ selectedPhoto.description }}</el-descriptions-item>
          <el-descriptions-item label="标签" :span="2">
            <el-tag v-for="tag in selectedPhoto.tags" :key="tag" size="small" style="margin-right: 4px">
              {{ tag }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { photoLogService, plotService, userService } from '@/services'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Picture, View, Delete } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const photos = ref([])
const plots = ref([])
const myPlots = ref([])
const residents = ref([])
const filterPlot = ref('')
const filterTag = ref('')
const filterUser = ref('')
const showUpload = ref(false)
const showDetail = ref(false)
const selectedPhoto = ref(null)
const selectedFile = ref(null)
const previewUrl = ref('')
const uploading = ref(false)

const photoForm = ref({
  title: '',
  description: '',
  plotId: '',
  tags: []
})

const isAdmin = computed(() => authStore.isAdmin)
const isResident = computed(() => authStore.isResident || authStore.isAdmin)
const userId = computed(() => authStore.userId)

const filteredPhotos = computed(() => {
  return photos.value.filter(photo => {
    if (filterPlot.value && photo.plotId !== filterPlot.value) return false
    if (filterTag.value && !photo.tags?.includes(filterTag.value)) return false
    if (filterUser.value && photo.uploadedBy !== filterUser.value) return false
    return true
  })
})

onMounted(async () => {
  await loadPhotos()
  await loadPlots()
  if (isAdmin.value) {
    await loadResidents()
  }
})

async function loadPhotos() {
  photos.value = await photoLogService.getRecentPhotos(50)
}

async function loadPlots() {
  plots.value = await plotService.getAll()
  if (isAdmin.value) {
    myPlots.value = plots.value
  } else {
    myPlots.value = await plotService.getPlotsByUser(userId.value)
  }
}

async function loadResidents() {
  residents.value = await userService.getResidents()
}

function handleFileChange(file) {
  selectedFile.value = file.raw
  previewUrl.value = URL.createObjectURL(file.raw)
}

function formatDate(date) {
  if (!date) return ''
  return dayjs(date.seconds ? date.seconds * 1000 : date).format('YYYY-MM-DD')
}

function canDelete(photo) {
  return isAdmin.value || photo.uploadedBy === userId.value
}

function viewDetail(photo) {
  selectedPhoto.value = photo
  showDetail.value = true
}

async function uploadPhoto() {
  if (!selectedFile.value) {
    ElMessage.warning('请选择照片')
    return
  }
  if (!photoForm.value.title) {
    ElMessage.warning('请输入标题')
    return
  }

  uploading.value = true
  try {
    await photoLogService.createPhotoLog(
      photoForm.value,
      userId.value,
      authStore.userData.name,
      selectedFile.value
    )
    ElMessage.success('上传成功')
    showUpload.value = false
    previewUrl.value = ''
    selectedFile.value = null
    photoForm.value = { title: '', description: '', plotId: '', tags: [] }
    await loadPhotos()
  } catch (error) {
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

async function deletePhoto(photo) {
  ElMessageBox.confirm('确定要删除这张照片吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await photoLogService.delete(photo.id)
      ElMessage.success('已删除')
      await loadPhotos()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}
</script>

<style scoped>
.photo-log-page {
  padding: 0;
}
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}
.photo-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}
.photo-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
.photo-wrapper {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
}
.photo-wrapper :deep(.el-image) {
  width: 100%;
  height: 100%;
}
.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  opacity: 0;
  transition: opacity 0.3s;
}
.photo-wrapper:hover .photo-overlay {
  opacity: 1;
}
.photo-info {
  padding: 12px;
}
.photo-title {
  font-weight: 600;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.photo-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.photo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.avatar-uploader {
  display: flex;
  justify-content: center;
}
.avatar-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}
.avatar-uploader-icon {
  color: #8c939d;
}
.preview-image {
  width: 200px;
  height: 200px;
  object-fit: cover;
}
.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}
.empty {
  padding: 40px 0;
}
</style>
