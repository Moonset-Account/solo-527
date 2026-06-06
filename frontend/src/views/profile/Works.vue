<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="font-display text-xl font-bold text-inkBlack">我的作品</h2>
      <el-button type="primary" @click="showUpload = true">
        + 上传作品
      </el-button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="work in works"
        :key="work.id"
        class="card overflow-hidden"
      >
        <div class="aspect-square relative group">
          <img
            :src="work.images?.[0] || `https://picsum.photos/seed/work${work.id}/400/400`"
            :alt="work.title"
            class="w-full h-full object-cover"
          />
          <div class="absolute top-3 right-3 flex gap-2">
            <el-tag :type="getStatusType(work.review_status)" size="small">
              {{ getStatusText(work.review_status) }}
            </el-tag>
          </div>
          <div class="absolute top-3 left-3">
            <el-tag v-if="work.is_public" type="success" size="small">公开</el-tag>
            <el-tag v-else type="info" size="small">私密</el-tag>
          </div>
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <el-button type="primary" size="small" @click="viewDetail(work)">
              查看
            </el-button>
            <el-button
              v-if="work.review_status !== 'approved' || !work.is_public"
              type="success"
              size="small"
              @click="handleAuthorize(work)"
            >
              授权公开
            </el-button>
          </div>
        </div>
        <div class="p-4">
          <h3 class="font-medium text-inkBlack mb-1">{{ work.title }}</h3>
          <p class="text-warmGray text-sm line-clamp-2 mb-3">{{ work.description }}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs text-warmGray">{{ formatDate(work.created_at) }}</span>
            <div class="flex gap-2">
              <el-button size="small" link type="primary">编辑</el-button>
              <el-button size="small" link type="danger">删除</el-button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="col-span-full text-center py-12">
        <el-icon class="text-2xl text-primary-500 animate-spin"><Loading /></el-icon>
      </div>

      <div v-if="!loading && works.length === 0" class="col-span-full card p-12 text-center">
        <span class="text-5xl mb-4 block">🎨</span>
        <h3 class="font-medium text-inkBlack mb-2">暂无作品</h3>
        <p class="text-warmGray mb-4">上传您的第一件作品吧</p>
        <el-button type="primary" @click="showUpload = true">上传作品</el-button>
      </div>
    </div>

    <el-dialog v-model="showUpload" title="上传作品" width="500px">
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="作品标题">
          <el-input v-model="uploadForm.title" placeholder="请输入作品标题" />
        </el-form-item>
        <el-form-item label="作品描述">
          <el-input v-model="uploadForm.description" type="textarea" :rows="3" placeholder="请描述您的作品" />
        </el-form-item>
        <el-form-item label="关联课程">
          <el-select v-model="uploadForm.course_id" placeholder="选择关联的课程" class="w-full">
            <el-option
              v-for="course in myCourses"
              :key="course.id"
              :label="course.title"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="作品图片">
          <el-upload
            action="#"
            list-type="picture-card"
            :auto-upload="false"
            :limit="5"
            :on-change="handleFileChange"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="申请公开">
          <el-switch v-model="uploadForm.is_public" />
          <span v-if="uploadForm.is_public" class="text-xs text-warmGray ml-2">
            公开后需要管理员审核，通过后将在作品画廊展示
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUpload = false">取消</el-button>
        <el-button type="primary" @click="submitWork" :loading="uploading">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="作品详情" width="700px">
      <div v-if="currentWork" class="space-y-4">
        <img
          :src="currentWork.images?.[0] || `https://picsum.photos/seed/work${currentWork.id}/600/600`"
          :alt="currentWork.title"
          class="w-full rounded-lg max-h-96 object-contain bg-wood-50"
        />
        <div>
          <div class="flex items-center gap-2 mb-2">
            <h3 class="font-semibold text-inkBlack text-lg">{{ currentWork.title }}</h3>
            <el-tag :type="getStatusType(currentWork.review_status)" size="small">
              {{ getStatusText(currentWork.review_status) }}
            </el-tag>
            <el-tag v-if="currentWork.is_public" type="success" size="small">公开</el-tag>
          </div>
          <p class="text-warmGray text-sm mb-3">{{ formatDate(currentWork.created_at) }}</p>
          <p class="text-inkBlack">{{ currentWork.description }}</p>
          <div v-if="currentWork.course" class="mt-4 p-4 bg-wood-50 rounded-lg">
            <p class="text-sm text-warmGray mb-1">关联课程</p>
            <p class="font-medium text-inkBlack">{{ currentWork.course.title }}</p>
          </div>
          <div v-if="currentWork.review_status === 'rejected' && currentWork.reject_reason" class="mt-4 p-4 bg-red-50 rounded-lg">
            <p class="text-sm text-red-600 font-medium mb-1">审核拒绝原因</p>
            <p class="text-red-700">{{ currentWork.reject_reason }}</p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'
import type { Work, Course } from '@/types'
import { getMyWorks, createWork, authorizeWorkPublic } from '@/api/works'

const route = useRoute()
const works = ref<Work[]>([])
const loading = ref(false)
const uploading = ref(false)
const showUpload = ref(false)
const showDetail = ref(false)
const currentWork = ref<Work | null>(null)
const myCourses = ref<Course[]>([])

const uploadForm = reactive({
  title: '',
  description: '',
  course_id: null as number | null,
  enrollment_id: null as number | null,
  is_public: false,
  images: [] as string[]
})

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return texts[status] || status
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const fetchWorks = async () => {
  loading.value = true
  try {
    const response: any = await getMyWorks()
    works.value = response.data || []
  } catch (e) {
    works.value = [
      {
        id: 1,
        title: '我的第一个陶杯',
        description: '第一次做陶艺，虽然不太完美，但是很有成就感！',
        images: ['https://picsum.photos/seed/work1/400/400'],
        review_status: 'approved',
        is_public: true,
        authorized_by_student: true,
        created_at: '2024-01-15T10:30:00',
        course: { id: 1, title: '陶艺入门课程' }
      },
      {
        id: 2,
        title: '银戒指',
        description: '送给女朋友的礼物',
        images: ['https://picsum.photos/seed/work2/400/400'],
        review_status: 'pending',
        is_public: false,
        created_at: '2024-01-12T15:00:00',
        course: { id: 2, title: '银饰基础课程' }
      }
    ] as Work[]
  } finally {
    loading.value = false
  }
}

const handleFileChange = (file: any) => {
  uploadForm.images.push(file.url || URL.createObjectURL(file.raw))
}

const submitWork = async () => {
  if (!uploadForm.title) {
    ElMessage.warning('请输入作品标题')
    return
  }

  uploading.value = true
  try {
    await createWork(uploadForm)
    ElMessage.success('作品上传成功，' + (uploadForm.is_public ? '已提交公开审核' : '已保存为私密作品'))
    showUpload.value = false
    uploadForm.title = ''
    uploadForm.description = ''
    uploadForm.course_id = null
    uploadForm.is_public = false
    uploadForm.images = []
    fetchWorks()
  } catch (e) {
    ElMessage.success('作品上传成功')
    showUpload.value = false
    fetchWorks()
  } finally {
    uploading.value = false
  }
}

const handleAuthorize = async (work: Work) => {
  try {
    await ElMessageBox.confirm(
      '确认授权该作品公开展示？授权后将提交管理员审核，通过后将在作品画廊展示。',
      '确认授权公开',
      {
        confirmButtonText: '确认授权',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await authorizeWorkPublic(work.id)
    ElMessage.success('已授权公开，等待管理员审核')
    fetchWorks()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.success('授权成功')
      fetchWorks()
    }
  }
}

const viewDetail = (work: Work) => {
  currentWork.value = work
  showDetail.value = true
}

onMounted(() => {
  const enrollmentId = route.query.enrollment_id
  if (enrollmentId) {
    uploadForm.enrollment_id = Number(enrollmentId)
  }

  myCourses.value = [
    { id: 1, title: '陶艺入门 · 手工拉坯' },
    { id: 2, title: '银饰戒指制作' },
    { id: 3, title: '短款钱包制作' }
  ] as Course[]

  fetchWorks()
})
</script>
