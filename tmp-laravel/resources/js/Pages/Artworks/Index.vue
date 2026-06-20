<script setup>
import AdminLayout from '@/Layouts/AdminLayout.vue'
import { router, Link } from '@inertiajs/vue3'
import Pagination from '@/Components/Pagination.vue'
import SearchInput from '@/Components/SearchInput.vue'
import Modal from '@/Components/Modal.vue'
import StatusBadge from '@/Components/StatusBadge.vue'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  artworks: Object,
  filters: Object,
  artClasses: Array,
  teachers: Array,
})

const showModal = ref(false)
const imagePreview = ref(null)
const form = ref(getDefaultForm())

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'submitted', label: '已提交' },
  { value: 'reviewed', label: '已评审' },
  { value: 'revision_requested', label: '需修改' },
]

const filterSearch = ref(props.filters?.search || '')
const filterArtClass = ref(props.filters?.art_class_id || '')
const filterTeacher = ref(props.filters?.teacher_id || '')
const filterStatus = ref(props.filters?.status || '')

function getDefaultForm() {
  return {
    title: '',
    art_class_id: '',
    student_id: '',
    teacher_id: '',
    image: null,
    description: '',
  }
}

const filteredStudents = computed(() => {
  const selectedClass = props.artClasses.find(c => c.id == form.value.art_class_id)
  return selectedClass?.students || []
})

function onImageChange(event) {
  const file = event.target.files[0]
  form.value.image = file
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => { imagePreview.value = e.target.result }
    reader.readAsDataURL(file)
  } else {
    imagePreview.value = null
  }
}

function openUploadModal() {
  form.value = getDefaultForm()
  imagePreview.value = null
  showModal.value = true
}

function submitForm() {
  const data = new FormData()
  data.append('title', form.value.title)
  data.append('art_class_id', form.value.art_class_id)
  data.append('student_id', form.value.student_id)
  data.append('teacher_id', form.value.teacher_id)
  data.append('description', form.value.description)
  if (form.value.image) {
    data.append('image', form.value.image)
  }

  router.post(route('artworks.store'), data, {
    onSuccess: () => { showModal.value = false },
    forceFormData: true,
  })
}

function applyFilters() {
  router.get(route('artworks.index'), {
    search: filterSearch.value,
    art_class_id: filterArtClass.value,
    teacher_id: filterTeacher.value,
    status: filterStatus.value,
  }, { preserveState: true, preserveScroll: true })
}

watch([filterArtClass, filterTeacher, filterStatus], () => {
  applyFilters()
})

watch(filterSearch, () => {
  applyFilters()
})
</script>

<template>
  <AdminLayout :auth="$page.props.auth" page-title="作品反馈">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-900">作品反馈</h2>
      <button
        @click="openUploadModal"
        class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        上传作品
      </button>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 mb-6 p-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SearchInput v-model="filterSearch" placeholder="搜索作品名称..." />
        <select
          v-model="filterArtClass"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">全部班级</option>
          <option v-for="cls in artClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
        </select>
        <select
          v-model="filterTeacher"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">全部教师</option>
          <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
        <select
          v-model="filterStatus"
          class="w-full py-2 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <div v-if="!artworks.data.length" class="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">
      暂无作品数据
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Link
        v-for="artwork in artworks.data"
        :key="artwork.id"
        :href="route('artworks.show', artwork.id)"
        class="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      >
        <div class="aspect-[4/3] bg-gray-100 flex items-center justify-center">
          <img
            v-if="artwork.image_url"
            :src="artwork.image_url"
            :alt="artwork.title"
            class="w-full h-full object-cover"
          />
          <svg v-else class="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="p-4">
          <h4 class="text-sm font-medium text-gray-900 truncate">{{ artwork.title }}</h4>
          <p class="text-xs text-gray-500 mt-1">{{ artwork.student?.name || '-' }} · {{ artwork.art_class?.name || '-' }}</p>
          <div class="flex items-center justify-between mt-2">
            <StatusBadge :status="artwork.status" />
            <span v-if="artwork.score != null" class="text-sm font-bold text-indigo-600">{{ artwork.score }}分</span>
          </div>
        </div>
      </Link>
    </div>

    <div class="mt-4 flex justify-center">
      <Pagination :links="artworks.links" />
    </div>

    <Modal :show="showModal" title="上传作品" max-width="lg" @close="showModal = false">
      <form @submit.prevent="submitForm" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">作品标题</label>
            <input
              v-model="form.title"
              type="text"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">所属班级</label>
            <select
              v-model="form.art_class_id"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">请选择班级</option>
              <option v-for="cls in artClasses" :key="cls.id" :value="cls.id">{{ cls.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">学生</label>
            <select
              v-model="form.student_id"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">请选择学生</option>
              <option v-for="s in filteredStudents" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">指导教师</label>
            <select
              v-model="form.teacher_id"
              required
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">请选择教师</option>
              <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">作品图片</label>
          <div
            v-if="imagePreview"
            class="mb-2 relative"
          >
            <img :src="imagePreview" alt="预览" class="w-full max-h-48 object-contain rounded-lg border border-gray-200" />
            <button
              type="button"
              @click="imagePreview = null; form.image = null"
              class="absolute top-2 right-2 p-1 bg-white rounded-full shadow hover:bg-gray-100"
            >
              <svg class="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <input
            v-else
            type="file"
            accept="image/*"
            required
            @change="onImageChange"
            class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button
            type="button"
            @click="showModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            上传
          </button>
        </div>
      </form>
    </Modal>
  </AdminLayout>
</template>
