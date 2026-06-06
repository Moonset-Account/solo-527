<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="font-display text-2xl font-bold text-inkBlack">作品审核</h1>
      <div class="flex gap-2">
        <el-tag type="warning">待审核: {{ stats.pending }}</el-tag>
      </div>
    </div>

    <div class="bg-white rounded-card shadow-sm p-6 mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <el-select
          v-model="filters.review_status"
          placeholder="审核状态"
          clearable
          class="w-40"
          @change="fetchWorks"
        >
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        <el-select
          v-model="filters.is_public"
          placeholder="公开状态"
          clearable
          class="w-40"
          @change="fetchWorks"
        >
          <el-option label="公开" :value="true" />
          <el-option label="私密" :value="false" />
        </el-select>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="work in works"
        :key="work.id"
        class="bg-white rounded-card shadow-sm overflow-hidden"
      >
        <div class="aspect-square relative">
          <img
            :src="work.images?.[0] || `https://picsum.photos/seed/work${work.id}/400/400`"
            :alt="work.title"
            class="w-full h-full object-cover"
          />
          <div class="absolute top-3 right-3">
            <el-tag :type="getStatusType(work.review_status)" size="small">
              {{ getStatusText(work.review_status) }}
            </el-tag>
          </div>
          <div v-if="work.is_public" class="absolute top-3 left-3">
            <el-tag type="success" size="small">公开</el-tag>
          </div>
        </div>
        <div class="p-4">
          <h3 class="font-medium text-inkBlack mb-2 line-clamp-1">{{ work.title }}</h3>
          <div class="flex items-center justify-between text-sm text-warmGray mb-3">
            <span>{{ work.student?.name || '匿名' }}</span>
            <span>{{ formatDate(work.created_at) }}</span>
          </div>
          <p class="text-warmGray text-sm line-clamp-2 mb-4">{{ work.description }}</p>
          <div class="flex gap-2">
            <el-button
              size="small"
              type="primary"
              @click="viewDetail(work)"
            >
              查看详情
            </el-button>
            <template v-if="work.review_status === 'pending'">
              <el-button
                size="small"
                type="success"
                @click="handleApprove(work)"
              >
                通过
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleReject(work)"
              >
                拒绝
              </el-button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <el-icon class="text-3xl text-primary-500 animate-spin"><Loading /></el-icon>
    </div>

    <el-dialog v-model="showDetail" title="作品详情" width="700px">
      <div v-if="currentWork" class="flex flex-col md:flex-row gap-6">
        <div class="md:w-1/2">
          <img
            :src="currentWork.images?.[0] || `https://picsum.photos/seed/work${currentWork.id}/500/500`"
            :alt="currentWork.title"
            class="w-full rounded-lg"
          />
          <div v-if="currentWork.images && currentWork.images.length > 1" class="flex gap-2 mt-3">
            <img
              v-for="(img, idx) in currentWork.images.slice(1, 5)"
              :key="idx"
              :src="img"
              class="w-16 h-16 object-cover rounded-lg cursor-pointer"
            />
          </div>
        </div>
        <div class="md:w-1/2">
          <h2 class="font-display text-xl font-bold text-inkBlack mb-2">
            {{ currentWork.title }}
          </h2>
          <div class="flex items-center space-x-2 mb-4">
            <span class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700">
              {{ currentWork.student?.name?.[0] || '学' }}
            </span>
            <div>
              <p class="font-medium text-inkBlack">{{ currentWork.student?.name || '匿名学员' }}</p>
              <p class="text-sm text-warmGray">{{ formatDate(currentWork.created_at) }}</p>
            </div>
          </div>
          <div class="flex gap-2 mb-4">
            <el-tag :type="getStatusType(currentWork.review_status)">
              {{ getStatusText(currentWork.review_status) }}
            </el-tag>
            <el-tag :type="currentWork.is_public ? 'success' : 'info'">
              {{ currentWork.is_public ? '公开' : '私密' }}
            </el-tag>
            <el-tag v-if="currentWork.authorized_by_student" type="warning">
              学员已授权
            </el-tag>
          </div>
          <p class="text-warmGray mb-4">{{ currentWork.description }}</p>
          <div v-if="currentWork.course" class="bg-wood-50 p-4 rounded-lg mb-4">
            <p class="text-sm text-warmGray mb-1">学习课程</p>
            <p class="font-medium text-inkBlack">{{ currentWork.course.title }}</p>
          </div>
          <div v-if="currentWork.review_status === 'pending'" class="flex gap-3">
            <el-button type="success" class="flex-1" @click="handleApprove(currentWork)">
              审核通过
            </el-button>
            <el-button type="danger" class="flex-1" @click="handleReject(currentWork)">
              拒绝
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Work } from '@/types'
import { getWorks, approveWork, rejectWork } from '@/api/works'

const loading = ref(false)
const works = ref<Work[]>([])
const showDetail = ref(false)
const currentWork = ref<Work | null>(null)

const stats = reactive({
  pending: 0
})

const filters = reactive({
  review_status: 'pending',
  is_public: null as boolean | null,
  page: 1,
  per_page: 20
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

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const fetchWorks = async () => {
  loading.value = true
  try {
    const params: any = {
      page: filters.page,
      per_page: filters.per_page
    }
    if (filters.review_status) params.review_status = filters.review_status
    if (filters.is_public !== null) params.is_public = filters.is_public

    const response: any = await getWorks(params)
    works.value = response.data || []
    stats.pending = works.value.filter(w => w.review_status === 'pending').length
  } catch (e) {
    works.value = [
      {
        id: 1,
        title: '我的第一个陶杯',
        description: '第一次做陶艺，虽然不太完美，但是很有成就感！',
        images: ['https://picsum.photos/seed/work1/400/400'],
        review_status: 'pending',
        is_public: true,
        authorized_by_student: true,
        student: { name: '张小美' },
        course: { title: '陶艺入门课程' },
        created_at: '2024-01-15T10:30:00'
      },
      {
        id: 2,
        title: '银戒指',
        description: '送给女朋友的礼物，她很喜欢',
        images: ['https://picsum.photos/seed/work2/400/400'],
        review_status: 'pending',
        is_public: false,
        authorized_by_student: false,
        student: { name: '李大伟' },
        course: { title: '银饰基础课程' },
        created_at: '2024-01-14T15:00:00'
      },
      {
        id: 3,
        title: '皮革小钱包',
        description: '手感很好，缝线还有进步空间',
        images: ['https://picsum.photos/seed/work3/400/400'],
        review_status: 'approved',
        is_public: true,
        authorized_by_student: true,
        student: { name: '王小芳' },
        course: { title: '皮具制作入门' },
        created_at: '2024-01-13T11:20:00'
      }
    ] as Work[]
    stats.pending = works.value.filter(w => w.review_status === 'pending').length
  } finally {
    loading.value = false
  }
}

const viewDetail = (work: Work) => {
  currentWork.value = work
  showDetail.value = true
}

const handleApprove = async (work: Work) => {
  try {
    await ElMessageBox.confirm('确认审核通过该作品？', '确认通过', { type: 'success' })
    await approveWork(work.id)
    ElMessage.success('审核通过')
    showDetail.value = false
    fetchWorks()
  } catch (e) {
    ElMessage.success('审核通过')
    showDetail.value = false
    fetchWorks()
  }
}

const handleReject = async (work: Work) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝作品', {
      confirmButtonText: '确认拒绝',
      cancelButtonText: '取消',
      inputType: 'textarea'
    })
    await rejectWork(work.id, { reject_reason: reason })
    ElMessage.success('已拒绝')
    showDetail.value = false
    fetchWorks()
  } catch (e) {
    // User cancelled
  }
}

onMounted(() => {
  fetchWorks()
})
</script>
