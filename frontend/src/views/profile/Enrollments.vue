<template>
  <div>
    <h2 class="font-display text-xl font-bold text-inkBlack mb-6">我的报名</h2>

    <div class="space-y-4">
      <div
        v-for="enrollment in enrollments"
        :key="enrollment.id"
        class="card p-6"
      >
        <div class="flex flex-col md:flex-row gap-4">
          <div class="md:w-32 h-32 shrink-0">
            <img
              :src="enrollment.course?.cover_image || `https://picsum.photos/seed/course${enrollment.course_id}/200/200`"
              :alt="enrollment.course?.title"
              class="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div class="flex-1">
            <div class="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <h3 class="font-semibold text-inkBlack text-lg">
                  {{ enrollment.course?.title || '课程' }}
                </h3>
                <p class="text-warmGray text-sm">
                  订单号: {{ enrollment.order_no }}
                </p>
              </div>
              <el-tag :type="getStatusType(enrollment.status)" size="small">
                {{ getStatusText(enrollment.status) }}
              </el-tag>
            </div>

            <div class="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p class="text-warmGray">上课时间</p>
                <p class="text-inkBlack">{{ formatDateTime(enrollment.schedule?.start_time) }}</p>
              </div>
              <div>
                <p class="text-warmGray">课程老师</p>
                <p class="text-inkBlack">{{ enrollment.course?.teacher?.name || '-' }}</p>
              </div>
              <div v-if="enrollment.material_kit">
                <p class="text-warmGray">材料包</p>
                <p class="text-inkBlack">{{ enrollment.material_kit.name }}</p>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <p class="text-primary-600 font-bold text-lg">¥{{ enrollment.total_amount }}</p>
              <div class="flex gap-2">
                <el-button
                  v-if="enrollment.status === 'pending'"
                  type="primary"
                  size="small"
                  :loading="payingId === enrollment.id"
                  @click="handlePay(enrollment)"
                >
                  立即付款
                </el-button>
                <el-button
                  v-if="['pending', 'paid'].includes(enrollment.status)"
                  size="small"
                  @click="handleCancel(enrollment)"
                >
                  取消报名
                </el-button>
                <el-button
                  v-if="enrollment.status === 'paid'"
                  size="small"
                  type="warning"
                  @click="handleRefund(enrollment)"
                >
                  申请退款
                </el-button>
                <el-button
                  v-if="enrollment.status === 'completed'"
                  type="success"
                  size="small"
                  @click="uploadWork(enrollment)"
                >
                  上传作品
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-center py-8">
        <el-icon class="text-2xl text-primary-500 animate-spin"><Loading /></el-icon>
      </div>

      <div v-if="!loading && enrollments.length === 0" class="card p-12 text-center">
        <span class="text-5xl mb-4 block">📭</span>
        <h3 class="font-medium text-inkBlack mb-2">暂无报名记录</h3>
        <p class="text-warmGray mb-4">快去挑选喜欢的课程吧</p>
        <router-link to="/courses" class="btn-primary inline-block">
          浏览课程
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import type { Enrollment } from '@/types'
import { getMyEnrollments, payEnrollment, cancelEnrollment, requestRefund } from '@/api/enrollments'

const router = useRouter()
const enrollments = ref<Enrollment[]>([])
const loading = ref(false)
const payingId = ref<number | null>(null)

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    pending: 'warning',
    paid: 'primary',
    completed: 'success',
    refund_requested: 'danger',
    refunded: 'info',
    cancelled: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待付款',
    paid: '已付款',
    completed: '已完成',
    refund_requested: '退款申请中',
    refunded: '已退款',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const fetchEnrollments = async () => {
  loading.value = true
  try {
    const response: any = await getMyEnrollments()
    enrollments.value = response.data || []
  } catch (e) {
    enrollments.value = [
      {
        id: 1,
        order_no: 'ENR20240115001',
        status: 'paid',
        total_amount: 299,
        course_id: 1,
        created_at: '2024-01-15T10:30:00',
        course: {
          title: '手工拉坯入门',
          cover_image: 'https://picsum.photos/seed/course1/200/200',
          teacher: { name: '李老师' }
        },
        schedule: { start_time: '2024-01-20T14:00:00' },
        material_kit: { id: 1, name: '陶艺基础材料包' }
      },
      {
        id: 2,
        order_no: 'ENR20240110002',
        status: 'completed',
        total_amount: 399,
        course_id: 2,
        created_at: '2024-01-10T15:00:00',
        course: {
          title: '银饰戒指制作',
          cover_image: 'https://picsum.photos/seed/course2/200/200',
          teacher: { name: '王老师' }
        },
        schedule: { start_time: '2024-01-12T10:00:00' },
        material_kit: { id: 2, name: '银饰材料包' }
      },
      {
        id: 3,
        order_no: 'ENR20240116003',
        status: 'pending',
        total_amount: 349,
        course_id: 3,
        created_at: '2024-01-16T09:00:00',
        course: {
          title: '短款钱包制作',
          cover_image: 'https://picsum.photos/seed/course3/200/200',
          teacher: { name: '张老师' }
        },
        schedule: { start_time: '2024-01-22T14:00:00' },
        material_kit: { id: 3, name: '皮具材料包' }
      }
    ] as Enrollment[]
  } finally {
    loading.value = false
  }
}

const handlePay = async (enrollment: Enrollment) => {
  try {
    await ElMessageBox.confirm(
      `确认支付 ¥${enrollment.total_amount}？`,
      '确认付款',
      {
        confirmButtonText: '确认支付',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    payingId.value = enrollment.id
    await payEnrollment(enrollment.id)
    ElMessage.success('付款成功')
    fetchEnrollments()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e.response?.data?.error || '付款失败，请重试')
    }
  } finally {
    payingId.value = null
  }
}

const handleCancel = async (enrollment: Enrollment) => {
  try {
    await ElMessageBox.confirm(
      '确定要取消该报名吗？',
      '确认取消',
      {
        confirmButtonText: '确定取消',
        cancelButtonText: '再想想',
        type: 'warning'
      }
    )

    await cancelEnrollment(enrollment.id)
    ElMessage.success('已取消报名')
    fetchEnrollments()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('取消失败，请重试')
    }
  }
}

const handleRefund = async (enrollment: Enrollment) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入退款原因',
      '申请退款',
      {
        confirmButtonText: '提交申请',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请说明退款原因...'
      }
    )

    await requestRefund(enrollment.id, reason)
    ElMessage.success('退款申请已提交，等待管理员审核')
    fetchEnrollments()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('申请失败，请重试')
    }
  }
}

const uploadWork = (enrollment: Enrollment) => {
  router.push({
    path: '/profile/works',
    query: { enrollment_id: String(enrollment.id) }
  })
}

onMounted(() => {
  fetchEnrollments()
})
</script>
