<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">上传作品</h2>
      <div v-if="!isOnline" class="flex items-center text-amber-600 text-sm">
        <span class="mr-1">📡</span>
        离线模式 - 提交后将在网络恢复时同步
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label class="form-label">作品标题 *</label>
            <input v-model="form.title" type="text" class="form-input" placeholder="请输入作品标题" maxlength="100" />
          </div>

          <div class="form-group">
            <label class="form-label">作品描述</label>
            <textarea v-model="form.description" class="form-input form-textarea" placeholder="分享一下您的创作心得..." maxlength="1000"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">关联课程</label>
            <select v-model="form.course_session_id" class="form-input">
              <option :value="undefined">不关联课程</option>
              <option v-for="session in availableSessions" :key="session.id" :value="session.id">
                {{ session.course?.title }} - {{ formatDate(session.start_time) }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">作品图片 *</label>
            <div
              class="border-2 border-dashed rounded-xl p-6 text-center transition-colors"
              :class="isDragging ? 'border-purple-400 bg-purple-50' : 'border-gray-300 hover:border-purple-300'"
              @dragover.prevent="handleDragOver"
              @dragleave="handleDragLeave"
              @drop.prevent="handleDrop"
            >
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                class="hidden"
                @change="handleFileSelect"
              />

              <div v-if="images.length === 0" class="py-8">
                <div class="text-5xl mb-4">📸</div>
                <p class="text-gray-600 mb-4">拖拽图片到这里，或点击选择</p>
                <div class="flex justify-center gap-3">
                  <button type="button" @click="openCamera" class="btn btn-outline">
                    📷 拍照
                  </button>
                  <button type="button" @click="browseFiles" class="btn btn-primary">
                    🖼️ 选择图片
                  </button>
                </div>
                <p class="text-xs text-gray-400 mt-4">支持 JPG、PNG、GIF，单张不超过 10MB，最多 9 张</p>
              </div>

              <div v-else class="grid grid-cols-3 gap-3">
                <div v-for="img in images" :key="img.id" class="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                  <img :src="img.previewUrl" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button type="button" @click="removeImage(img.id)" class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center">
                      ✕
                    </button>
                  </div>
                  <div v-if="img.status === 'uploading'" class="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                    <div class="h-full bg-purple-500 transition-all" :style="{ width: img.progress + '%' }"></div>
                  </div>
                </div>
                <button
                  v-if="images.length < 9"
                  type="button"
                  @click="browseFiles"
                  class="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors"
                >
                  <span class="text-3xl">+</span>
                  <span class="text-sm mt-1">添加图片</span>
                </button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="flex items-center space-x-3 cursor-pointer">
              <input v-model="form.is_public" type="checkbox" class="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <span class="text-gray-700">
                公开展示作品
                <span class="text-gray-400 text-sm ml-1">（需审核通过后展示）</span>
              </span>
            </label>
          </div>

          <div v-if="error" class="text-red-500 text-sm mb-4">{{ error }}</div>

          <div class="flex gap-3 pt-4 border-t border-gray-100">
            <router-link to="/my/artworks" class="btn btn-secondary flex-1">取消</router-link>
            <button type="submit" class="btn btn-primary flex-1" :disabled="submitting || images.length === 0">
              <span v-if="submitting" class="loading-spinner inline-block w-4 h-4 mr-2"></span>
              {{ submitting ? '提交中...' : (isOnline ? '提交作品' : '保存到本地') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { bookingAPI, artworkAPI } from '../../utils/api'
import { useImageUpload } from '../../composables/useImageUpload'
import { useOfflineQueue } from '../../composables/useOfflineQueue'
import type { CourseSession } from '../../types'

const route = useRoute()
const router = useRouter()
const { images, addFiles, removeImage, clearAll, uploadAll, handleDragOver, handleDragLeave, handleDrop } = useImageUpload()
const { isOnline, addToQueue } = useOfflineQueue()

const fileInput = ref<HTMLInputElement | null>(null)
const availableSessions = ref<CourseSession[]>([])
const submitting = ref(false)
const error = ref('')

const form = reactive({
  title: '',
  description: '',
  course_session_id: undefined as number | undefined,
  is_public: false
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

const openCamera = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.capture = 'environment'
  input.onchange = (e: any) => {
    if (e.target.files) addFiles(e.target.files)
  }
  input.click()
}

const browseFiles = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) addFiles(target.files)
}

const loadAvailableSessions = async () => {
  try {
    const res = await bookingAPI.list({ per_page: 50 })
    availableSessions.value = res.bookings
      .filter(b => b.attendance_status === 1)
      .map(b => b.course_session!)
      .filter(Boolean)
    const sessionId = route.query.session_id
    if (sessionId) form.course_session_id = Number(sessionId)
  } catch (e) {
    console.error(e)
  }
}

const handleSubmit = async () => {
  if (!form.title.trim()) {
    error.value = '请输入作品标题'
    return
  }
  if (images.length === 0) {
    error.value = '请至少上传一张作品图片'
    return
  }

  submitting.value = true
  error.value = ''

  try {
    const imageUrls = await uploadAll()

    const artworkData = {
      ...form,
      image_urls: imageUrls,
      thumbnail_url: imageUrls[0]
    }

    if (isOnline.value) {
      await artworkAPI.create(artworkData)
    } else {
      addToQueue('/artworks', 'POST', artworkData)
    }

    clearAll()
    router.push('/my/artworks')
  } catch (e: any) {
    error.value = e.response?.data?.error || '提交失败，请重试'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadAvailableSessions()
})
</script>
