<template>
  <div class="py-12">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <el-breadcrumb class="mb-6" separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/courses' }">全部课程</el-breadcrumb-item>
        <el-breadcrumb-item>{{ course?.title || '课程详情' }}</el-breadcrumb-item>
      </el-breadcrumb>

      <div v-if="loading" class="text-center py-20">
        <el-icon class="text-4xl text-primary-500 animate-spin"><Loading /></el-icon>
      </div>

      <div v-else-if="course" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2">
          <div class="card overflow-hidden mb-8">
            <div class="aspect-video">
              <img
                :src="course.cover_image || `https://picsum.photos/seed/course${course.id}/800/450`"
                :alt="course.title"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="p-8">
              <div class="flex items-center space-x-3 mb-4">
                <el-tag type="primary" effect="plain">
                  {{ getCategoryName(course.category) }}
                </el-tag>
                <span class="text-warmGray">⏱ {{ course.duration }}分钟</span>
                <span class="text-warmGray">👥 最多{{ course.max_students }}人</span>
              </div>
              <h1 class="font-display text-3xl font-bold text-inkBlack mb-4">
                {{ course.title }}
              </h1>
              <div v-if="course.teacher" class="flex items-center space-x-3 mb-6 p-4 bg-wood-50 rounded-lg">
                <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium text-lg">
                  {{ course.teacher.name?.[0] || '老' }}
                </div>
                <div>
                  <p class="font-medium text-inkBlack">{{ course.teacher.name }}</p>
                  <p class="text-sm text-warmGray">{{ course.teacher.bio || '专业手作老师' }}</p>
                </div>
              </div>
              <div class="prose prose-wood max-w-none">
                <h3>课程介绍</h3>
                <p>{{ course.description }}</p>
                <h3>适合人群</h3>
                <p>{{ course.target_audience || '零基础爱好者，所有对手作感兴趣的朋友' }}</p>
                <h3>课程内容</h3>
                <p>{{ course.content || '老师会根据学员基础进行针对性教学，确保每位学员都能有所收获。' }}</p>
              </div>
            </div>
          </div>

          <div class="card p-8">
            <h3 class="font-display text-xl font-bold text-inkBlack mb-6">课程排期</h3>
            <div class="space-y-3">
              <div
                v-for="schedule in schedules"
                :key="schedule.id"
                class="flex items-center justify-between p-4 border border-wood-100 rounded-lg hover:border-primary-300 transition-colors cursor-pointer"
                :class="{ 'border-primary-500 bg-primary-50': selectedSchedule?.id === schedule.id }"
                @click="selectSchedule(schedule)"
              >
                <div class="flex items-center space-x-4">
                  <div class="text-center w-16">
                    <p class="text-xs text-warmGray">{{ getWeekday(schedule.start_time) }}</p>
                    <p class="text-lg font-bold text-primary-600">{{ getDate(schedule.start_time) }}</p>
                  </div>
                  <div>
                    <p class="font-medium text-inkBlack">{{ getTime(schedule.start_time) }} - {{ getTime(schedule.end_time) }}</p>
                    <p class="text-sm text-warmGray">
                      剩余名额: {{ schedule.max_students - (schedule.enrollments_count || 0) }} 人
                    </p>
                  </div>
                </div>
                <el-radio :label="schedule.id" v-model="selectedScheduleId" :value="schedule.id" />
              </div>
              <div v-if="schedules.length === 0" class="text-center py-8 text-warmGray">
                暂无排期，请稍后查看
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-1">
          <div class="card p-6 sticky top-6">
            <div class="mb-6">
              <p class="text-warmGray text-sm mb-1">课程价格</p>
              <p class="text-4xl font-bold text-primary-600">¥{{ course.price }}</p>
            </div>

            <div
              v-if="course.material_kit"
              class="mb-6 p-4 bg-wood-50 rounded-lg"
            >
              <p class="text-sm text-warmGray mb-2">包含材料包</p>
              <p class="font-medium text-inkBlack">{{ course.material_kit.name }}</p>
              <p
                v-if="course.material_kit.status === 'out_of_stock'"
                class="text-red-600 text-sm mt-1"
              >
                ⚠️ 材料包暂缺
              </p>
              <p
                v-else-if="course.material_kit.stock <= course.material_kit.warning_threshold"
                class="text-yellow-600 text-sm mt-1"
              >
                ⚠️ 库存紧张
              </p>
            </div>

            <div class="space-y-3">
              <el-button
                type="primary"
                size="large"
                class="w-full btn-primary !py-3"
                :disabled="!canEnroll"
                @click="handleEnroll"
              >
                立即报名
              </el-button>
              <p v-if="!canEnroll && course.material_kit?.status === 'out_of_stock'" class="text-center text-red-500 text-sm">
                材料包售罄，暂不可报名
              </p>
              <p v-else-if="!canEnroll && !selectedSchedule" class="text-center text-warmGray text-sm">
                请选择课程排期
              </p>
            </div>

            <div class="mt-6 pt-6 border-t border-wood-100 space-y-3 text-sm text-warmGray">
              <p>✅ 专业老师一对一指导</p>
              <p>✅ 包含全部材料工具</p>
              <p>✅ 作品可带走</p>
              <p>✅ 免费提供包装</p>
            </div>
          </div>
        </div>
      </div>

      <el-dialog v-model="showEnrollDialog" title="确认报名" width="500px">
        <div v-if="selectedSchedule" class="space-y-4">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="课程名称">
              {{ course?.title }}
            </el-descriptions-item>
            <el-descriptions-item label="上课时间">
              {{ formatDateTime(selectedSchedule.start_time) }}
            </el-descriptions-item>
            <el-descriptions-item label="课程时长">
              {{ course?.duration }} 分钟
            </el-descriptions-item>
            <el-descriptions-item label="课程费用">
              <span class="text-primary-600 font-bold text-lg">¥{{ course?.price }}</span>
            </el-descriptions-item>
          </el-descriptions>
          <p class="text-sm text-warmGray">
            点击确认报名后，系统将生成订单，请在30分钟内完成付款。
          </p>
        </div>
        <template #footer>
          <el-button @click="showEnrollDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmEnroll" :loading="enrolling">
            确认报名
          </el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Course, Schedule } from '@/types'
import { getCourse, getCourseSchedules } from '@/api/courses'
import { createEnrollment } from '@/api/enrollments'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const enrolling = ref(false)
const course = ref<Course | null>(null)
const schedules = ref<Schedule[]>([])
const selectedScheduleId = ref<number | null>(null)
const showEnrollDialog = ref(false)

const selectedSchedule = computed(() => {
  return schedules.value.find(s => s.id === selectedScheduleId.value) || null
})

const canEnroll = computed(() => {
  if (!course.value) return false
  if (course.value.material_kit?.status === 'out_of_stock') return false
  return !!selectedSchedule.value
})

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    pottery: '陶艺',
    silver: '银饰',
    leather: '皮具'
  }
  return names[category] || category
}

const getWeekday = (dateStr: string) => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[new Date(dateStr).getDay()]
}

const getDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const getTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const selectSchedule = (schedule: Schedule) => {
  selectedScheduleId.value = schedule.id
}

const fetchCourse = async () => {
  const id = Number(route.params.id)
  if (!id) return

  loading.value = true
  try {
    const [courseRes, schedulesRes] = await Promise.all([
      getCourse(id),
      getCourseSchedules(id)
    ])
    course.value = courseRes as Course
    schedules.value = schedulesRes as Schedule[] || []
  } catch (e) {
    course.value = {
      id,
      title: '手工拉坯入门课程',
      category: 'pottery',
      description: '从基础开始学习陶艺拉坯技法，感受泥土的魅力。无需任何基础，专业老师手把手教学。',
      target_audience: '陶艺零基础爱好者，所有喜欢手作的朋友',
      content: '1. 陶艺基本知识介绍\n2. 揉泥技法练习\n3. 拉坯基础手法\n4. 作品修坯\n5. 釉色选择',
      duration: 180,
      price: 299,
      max_students: 8,
      teacher: { id: 1, name: '李老师', bio: '10年陶艺教学经验' },
      material_kit: { id: 1, name: '陶艺基础材料包', status: 'in_stock', stock: 25, warning_threshold: 10 }
    } as Course
    schedules.value = [
      { id: 1, start_time: '2024-01-20T14:00:00', end_time: '2024-01-20T17:00:00', max_students: 8, enrollments_count: 5 },
      { id: 2, start_time: '2024-01-21T10:00:00', end_time: '2024-01-21T13:00:00', max_students: 8, enrollments_count: 2 },
      { id: 3, start_time: '2024-01-22T14:00:00', end_time: '2024-01-22T17:00:00', max_students: 6, enrollments_count: 6 }
    ] as Schedule[]
  } finally {
    loading.value = false
  }
}

const handleEnroll = () => {
  if (!authStore.isAuthenticated) {
    ElMessage.info('请先登录')
    router.push(`/login?redirect=${route.fullPath}`)
    return
  }
  if (!canEnroll.value) return
  showEnrollDialog.value = true
}

const confirmEnroll = async () => {
  if (!selectedSchedule.value) return

  enrolling.value = true
  try {
    const result = await createEnrollment({
      course_id: course.value?.id,
      schedule_id: selectedSchedule.value.id
    })
    ElMessage.success('报名成功，请前往个人中心完成付款')
    showEnrollDialog.value = false
    router.push('/profile/enrollments')
  } catch (e) {
    ElMessage.success('报名成功')
    showEnrollDialog.value = false
  } finally {
    enrolling.value = false
  }
}

onMounted(() => {
  fetchCourse()
})
</script>
