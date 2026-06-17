<template>
  <div class="image-uploader">
    <el-upload
      :action="uploadUrl"
      :file-list="fileList"
      list-type="picture-card"
      :on-preview="handlePreview"
      :on-remove="handleRemove"
      :on-success="handleSuccess"
      :on-change="handleChange"
      :before-upload="beforeUpload"
      :limit="maxCount"
      :multiple="true"
      accept="image/*"
      :class="{ 'demo-mode': isDemo }"
    >
      <el-icon><Plus /></el-icon>
    </el-upload>
    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewUrls"
      :initial-index="previewIndex"
      @close="previewVisible = false"
    />
    <div v-if="isDemo" class="demo-tip">
      <el-tag size="small" type="info">演示模式：使用示例图片</el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { uploadImage } from '@/api/upload'

interface UploadFile {
  name: string
  url: string
}

const props = defineProps<{
  modelValue: string[]
  maxCount?: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const appStore = useAppStore()
const isDemo = computed(() => appStore.isDemoMode)
const uploadUrl = computed(() => import.meta.env.VITE_API_BASE_URL + '/upload/image')

const fileList = ref<UploadFile[]>([])
const previewVisible = ref(false)
const previewUrls = ref<string[]>([])
const previewIndex = ref(0)
const demoImages = [
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
]

watch(() => props.modelValue, (val) => {
  fileList.value = val.map((url, index) => ({
    name: `image-${index + 1}`,
    url
  }))
}, { immediate: true })

function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 5
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

function handleSuccess(response: any, uploadFile: any) {
  if (isDemo.value) {
    const randomImage = demoImages[Math.floor(Math.random() * demoImages.length)]
    uploadFile.url = randomImage
    updateFileList()
    return
  }
  if (response.code === 0 || response.code === 200) {
    uploadFile.url = response.data.url
    updateFileList()
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

function handleChange() {
  if (isDemo.value && fileList.value.length > 0) {
    const lastFile = fileList.value[fileList.value.length - 1]
    if (!lastFile.url) {
      const randomImage = demoImages[Math.floor(Math.random() * demoImages.length)]
      lastFile.url = randomImage
      updateFileList()
    }
  }
}

function handleRemove() {
  updateFileList()
}

function updateFileList() {
  const urls = fileList.value
    .filter(f => f.url)
    .map(f => f.url)
  emit('update:modelValue', urls)
}

function handlePreview(uploadFile: any) {
  previewUrls.value = fileList.value.filter(f => f.url).map(f => f.url)
  previewIndex.value = previewUrls.value.indexOf(uploadFile.url)
  previewVisible.value = true
}
</script>

<style lang="scss" scoped>
.image-uploader {
  .demo-tip {
    margin-top: 8px;
  }
}

:deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
  line-height: 100px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 100px;
  height: 100px;
}
</style>
