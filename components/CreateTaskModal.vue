<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-semibold text-gray-800">提交整改任务</h3>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-2xl">
            &times;
          </button>
        </div>
      </div>
      
      <div class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择点位 *</label>
          <select
            v-model="form.pointId"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="">请选择点位</option>
            <option v-for="point in points" :key="point._id" :value="point._id">
              {{ point.name }} - {{ point.address }}
            </option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">问题类型 *</label>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="type in taskTypes"
              :key="type.value"
              @click="form.type = type.value"
              :class="[
                'px-4 py-3 rounded-lg border-2 text-center transition',
                form.type === type.value
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              ]"
            >
              <div class="text-2xl mb-1">{{ type.icon }}</div>
              <div class="text-sm font-medium">{{ type.label }}</div>
            </button>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">问题描述 *</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
            placeholder="请详细描述问题情况..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">现场照片</label>
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition cursor-pointer">
            <input type="file" accept="image/*" multiple class="hidden" @change="handleFileUpload" ref="fileInput" />
            <div @click="triggerFileInput" class="py-4">
              <div class="text-4xl mb-2">📷</div>
              <p class="text-sm text-gray-500">点击上传或拖拽图片到此处</p>
            </div>
          </div>
          <div v-if="uploadedPhotos.length > 0" class="mt-3 grid grid-cols-3 gap-2">
            <div v-for="(photo, index) in uploadedPhotos" :key="index" class="relative">
              <img :src="photo.url" class="w-full h-20 object-cover rounded-lg" />
              <button
                @click="removePhoto(index)"
                class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="p-6 border-t border-gray-200 flex justify-end space-x-3">
        <button
          @click="$emit('close')"
          class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          取消
        </button>
        <button
          @click="handleSubmit"
          :disabled="loading"
          class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? '提交中...' : '提交任务' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TaskType, type Point } from '~/types'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const points = ref<Point[]>([])
const uploadedPhotos = ref<any[]>([])
const loading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const form = ref({
  pointId: '',
  type: '' as TaskType,
  description: ''
})

const taskTypes = [
  { value: TaskType.MISSED_SORT, label: '误投', icon: '🗑️' },
  { value: TaskType.BIN_FULL, label: '桶满', icon: '📦' },
  { value: TaskType.POINT_DAMAGED, label: '点位破损', icon: '🔧' }
]

const fetchPoints = async () => {
  try {
    const data = await $fetch<{ points: Point[] }>('/api/points?limit=100')
    points.value = data.points
  } catch (e) {
    console.error('Failed to fetch points:', e)
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const result: any = await $fetch('/api/uploads/photo', {
        method: 'POST',
        body: formData
      })
      uploadedPhotos.value.push({
        url: result.url,
        caption: file.name
      })
    } catch (e) {
      console.error('Upload failed:', e)
      const reader = new FileReader()
      reader.onload = (e) => {
        uploadedPhotos.value.push({
          url: e.target?.result as string,
          caption: file.name
        })
      }
      reader.readAsDataURL(file)
    }
  }
}

const removePhoto = (index: number) => {
  uploadedPhotos.value.splice(index, 1)
}

const handleSubmit = async () => {
  if (!form.value.pointId || !form.value.type || !form.value.description) {
    alert('请填写必填项')
    return
  }
  
  loading.value = true
  try {
    await $fetch('/api/tasks', {
      method: 'POST',
      body: {
        ...form.value,
        beforePhotos: uploadedPhotos.value
      }
    })
    emit('created')
  } catch (e: any) {
    alert('提交失败：' + (e.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPoints()
})
</script>
