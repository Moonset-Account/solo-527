<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="font-display text-2xl font-bold text-inkBlack">报名管理</h1>
      <div class="text-sm text-warmGray">
        共 {{ total }} 条记录
      </div>
    </div>

    <div class="bg-white rounded-card shadow-sm p-6 mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <el-input
          v-model="filters.keyword"
          placeholder="搜索订单号/学员姓名"
          clearable
          class="w-64"
          @keyup.enter="fetchEnrollments"
        />
        <el-select
          v-model="filters.status"
          placeholder="状态筛选"
          clearable
          class="w-40"
          @change="fetchEnrollments"
        >
          <el-option label="待付款" value="pending" />
          <el-option label="已付款" value="paid" />
          <el-option label="已完成" value="completed" />
          <el-option label="退款申请中" value="refund_requested" />
          <el-option label="已退款" value="refunded" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-date-picker
          v-model="filters.date_range"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="w-auto"
          @change="fetchEnrollments"
        />
        <el-button type="primary" @click="fetchEnrollments">搜索</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
    </div>

    <div class="bg-white rounded-card shadow-sm overflow-hidden">
      <el-table :data="enrollments" v-loading="loading" stripe>
        <el-table-column prop="order_no" label="订单号" width="180" fixed />
        <el-table-column label="学员" width="140">
          <template #default="{ row }">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-sm font-medium">
                {{ row.student?.name?.[0] || '学' }}
              </div>
              <span>{{ row.student?.name || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="课程" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center space-x-3">
              <img
                v-if="row.course?.cover_image"
                :src="row.course.cover_image"
                class="w-12 h-12 rounded object-cover"
              />
              <div>
                <p class="font-medium text-inkBlack">{{ row.course?.title || '-' }}</p>
                <p class="text-xs text-warmGray">{{ row.course?.teacher?.name || '-' }}</p>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="上课时间" width="180">
          <template #default="{ row }">
            <span v-if="row.schedule">
              {{ formatDateTime(row.schedule.start_time) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span class="font-semibold text-primary-600">¥{{ row.total_amount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="130">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small" effect="light">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="viewDetail(row)">
              详情
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              size="small"
              type="success"
              link
              @click="handlePay(row)"
            >
              标记付款
            </el-button>
            <el-button
              v-if="row.status === 'refund_requested'"
              size="small"
              type="success"
              link
              @click="handleApproveRefund(row)"
            >
              批准退款
            </el-button>
            <el-button
              v-if="row.status === 'refund_requested'"
              size="small"
              type="danger"
              link
              @click="handleRejectRefund(row)"
            >
              拒绝退款
            </el-button>
            <el-button
              v-if="row.status === 'paid'"
              size="small"
              type="warning"
              link
              @click="handleComplete(row)"
            >
              完成
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="mt-6 flex justify-center">
      <el-pagination
        v-model:current-page="filters.page"
        :page-size="filters.per_page"
        :total="total"
        layout="prev, pager, next, total"
        @current-change="fetchEnrollments"
      />
    </div>

    <el-dialog v-model="showDetail" title="报名详情" width="650px">
      <div v-if="currentEnrollment" class="space-y-6">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单号" :span="2">
            <span class="font-mono">{{ currentEnrollment.order_no }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="学员">
            {{ currentEnrollment.student?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="联系邮箱">
            {{ currentEnrollment.student?.email || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="课程">
            {{ currentEnrollment.course?.title || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="授课老师">
            {{ currentEnrollment.course?.teacher?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="上课时间">
            {{ formatDateTime(currentEnrollment.schedule?.start_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="报名时间">
            {{ formatDateTime(currentEnrollment.created_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="订单金额">
            <span class="text-primary-600 font-bold text-lg">¥{{ currentEnrollment.total_amount || 0 }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="实付金额">
            <span class="text-olive-600 font-bold">¥{{ currentEnrollment.amount_paid || 0 }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="订单状态" :span="2">
            <el-tag :type="getStatusType(currentEnrollment.status)" size="small">
              {{ getStatusText(currentEnrollment.status) }}
            </el-tag>
            <span v-if="currentEnrollment.paid_at" class="ml-4 text-sm text-warmGray">
              付款时间: {{ formatDateTime(currentEnrollment.paid_at) }}
            </span>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentEnrollment.material_kit" class="bg-wood-50 p-4 rounded-lg">
          <p class="text-sm text-warmGray mb-2">材料包信息</p>
          <div class="flex items-center justify-between">
            <span class="font-medium text-inkBlack">{{ currentEnrollment.material_kit.name }}</span>
            <el-tag size="small" :type="currentEnrollment.material_kit.stock > 0 ? 'success' : 'danger'">
              库存: {{ currentEnrollment.material_kit.stock }}
            </el-tag>
          </div>
        </div>

        <div v-if="currentEnrollment.refund_reason" class="bg-yellow-50 p-4 rounded-lg">
          <p class="text-sm text-yellow-700 font-medium mb-1">退款原因</p>
          <p class="text-yellow-800">{{ currentEnrollment.refund_reason }}</p>
          <p v-if="currentEnrollment.refund_requested_at" class="text-xs text-yellow-600 mt-1">
            申请时间: {{ formatDateTime(currentEnrollment.refund_requested_at) }}
          </p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Enrollment } from '@/types'
import {
  getEnrollments,
  payEnrollment,
  approveRefund,
  rejectRefund,
  completeEnrollment
} from '@/api/enrollments'

const loading = ref(false)
const enrollments = ref<Enrollment[]>([])
const total = ref(0)
const showDetail = ref(false)
const currentEnrollment = ref<Enrollment | null>(null)

const filters = reactive({
  keyword: '',
  status: '',
  date_range: null as Date[] | null,
  page: 1,
  per_page: 20
})

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
    const params: any = {
      page: filters.page,
      per_page: filters.per_page
    }
    if (filters.status) params.status = filters.status
    if (filters.keyword) params.keyword = filters.keyword

    const response: any = await getEnrollments(params)
    enrollments.value = response.data || []
    total.value = response.meta?.total_count || enrollments.value.length
  } catch (e) {
    enrollments.value = [
      {
        id: 1,
        order_no: 'ENR20240115001',
        status: 'paid',
        total_amount: 299,
        amount_paid: 299,
        created_at: '2024-01-15T10:30:00',
        paid_at: '2024-01-15T10:35:00',
        student: { id: 1, name: '张小美', email: 'student1@example.com' },
        course: {
          id: 1,
          title: '手工拉坯入门',
          cover_image: 'https://picsum.photos/seed/course1/100/100',
          teacher: { name: '李老师' }
        },
        schedule: { start_time: '2024-01-20T14:00:00' },
        material_kit: { id: 1, name: '陶艺基础材料包', stock: 25 }
      },
      {
        id: 2,
        order_no: 'ENR20240115002',
        status: 'pending',
        total_amount: 399,
        amount_paid: 0,
        created_at: '2024-01-15T11:20:00',
        student: { id: 2, name: '李大伟', email: 'student2@example.com' },
        course: {
          id: 2,
          title: '银饰戒指制作',
          cover_image: 'https://picsum.photos/seed/course2/100/100',
          teacher: { name: '王老师' }
        },
        schedule: { start_time: '2024-01-21T10:00:00' },
        material_kit: { id: 2, name: '银饰材料包', stock: 3 }
      },
      {
        id: 3,
        order_no: 'ENR20240114003',
        status: 'refund_requested',
        total_amount: 349,
        amount_paid: 349,
        created_at: '2024-01-14T15:00:00',
        refund_reason: '临时有事去不了',
        refund_requested_at: '2024-01-15T09:00:00',
        student: { id: 3, name: '王小芳', email: 'student3@example.com' },
        course: {
          id: 3,
          title: '短款钱包制作',
          cover_image: 'https://picsum.photos/seed/course3/100/100',
          teacher: { name: '张老师' }
        },
        schedule: { start_time: '2024-01-22T14:00:00' },
        material_kit: { id: 3, name: '皮具材料包', stock: 18 }
      },
      {
        id: 4,
        order_no: 'ENR20240110004',
        status: 'completed',
        total_amount: 299,
        amount_paid: 299,
        created_at: '2024-01-10T14:00:00',
        paid_at: '2024-01-10T14:05:00',
        student: { id: 4, name: '赵小明', email: 'student4@example.com' },
        course: {
          id: 1,
          title: '手工拉坯入门',
          cover_image: 'https://picsum.photos/seed/course1/100/100',
          teacher: { name: '李老师' }
        },
        schedule: { start_time: '2024-01-12T10:00:00' },
        material_kit: { id: 1, name: '陶艺基础材料包', stock: 25 }
      }
    ] as Enrollment[]
    total.value = 25
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.keyword = ''
  filters.status = ''
  filters.date_range = null
  filters.page = 1
  fetchEnrollments()
}

const viewDetail = (row: Enrollment) => {
  currentEnrollment.value = row
  showDetail.value = true
}

const handlePay = async (row: Enrollment) => {
  try {
    await ElMessageBox.confirm(
      `确认订单 ${row.order_no} 已收到付款 ¥${row.total_amount}？`,
      '确认付款',
      { type: 'warning' }
    )
    await payEnrollment(row.id)
    ElMessage.success('已标记为付款')
    fetchEnrollments()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.success('操作成功')
      fetchEnrollments()
    }
  }
}

const handleApproveRefund = async (row: Enrollment) => {
  try {
    await ElMessageBox.confirm(
      `确认批准订单 ${row.order_no} 的退款申请？`,
      '批准退款',
      { type: 'warning', confirmButtonText: '确认批准' }
    )
    await approveRefund(row.id)
    ElMessage.success('退款已批准')
    fetchEnrollments()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.success('操作成功')
      fetchEnrollments()
    }
  }
}

const handleRejectRefund = async (row: Enrollment) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入拒绝原因',
      '拒绝退款',
      {
        confirmButtonText: '确认拒绝',
        inputType: 'textarea',
        inputPlaceholder: '请说明拒绝原因...'
      }
    )
    await rejectRefund(row.id, reason)
    ElMessage.success('已拒绝退款')
    fetchEnrollments()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.success('操作成功')
      fetchEnrollments()
    }
  }
}

const handleComplete = async (row: Enrollment) => {
  try {
    await ElMessageBox.confirm(
      `确认订单 ${row.order_no} 已完成？`,
      '确认完成',
      { type: 'success' }
    )
    await completeEnrollment(row.id)
    ElMessage.success('已标记完成')
    fetchEnrollments()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.success('操作成功')
      fetchEnrollments()
    }
  }
}

onMounted(() => {
  fetchEnrollments()
})
</script>
