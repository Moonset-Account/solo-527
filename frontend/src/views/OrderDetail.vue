<template>
  <div class="order-detail" v-loading="loading">
    <el-page-header @back="$router.back()" :content="'工单详情 - ' + (order?.orderNo || '')" />

    <el-row :gutter="20" class="mt-20">
      <el-col :span="16">
        <el-card shadow="never" class="mb-20">
          <template #header>
            <div class="flex-between">
              <span>基本信息</span>
              <div>
                <span :class="getPriorityClass(order?.priority)" style="margin-right: 10px;">
                  {{ getPriorityText(order?.priority) }}
                </span>
                <el-tag :type="getStatusType(order?.status)" size="large">
                  {{ getStatusText(order?.status) }}
                </el-tag>
              </div>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="工单编号">{{ order?.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="工单分类">{{ order?.category }}</el-descriptions-item>
            <el-descriptions-item label="报修业主">{{ order?.ownerName }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ order?.contactPhone }}</el-descriptions-item>
            <el-descriptions-item label="报修位置">{{ order?.roomInfo }}</el-descriptions-item>
            <el-descriptions-item label="报修时间">{{ order?.reportTime }}</el-descriptions-item>
            <el-descriptions-item label="预约时间">{{ order?.appointTime || '无' }}</el-descriptions-item>
            <el-descriptions-item label="处理人员">{{ order?.assigneeName || '未指派' }}</el-descriptions-item>
            <el-descriptions-item label="预估费用" v-if="order?.expectedCost">¥ {{ order?.expectedCost }}</el-descriptions-item>
            <el-descriptions-item label="实际费用" v-if="order?.actualCost">¥ {{ order?.actualCost }}</el-descriptions-item>
            <el-descriptions-item label="缴费状态">
              <el-tag :type="order?.isPaid ? 'success' : 'warning'">
                {{ order?.isPaid ? '已缴费' : '未缴费' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ order?.createdAt }}</el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <div class="detail-section">
            <h4>问题描述</h4>
            <p>{{ order?.description }}</p>
          </div>

          <div class="detail-section" v-if="order?.handlerRemark">
            <h4>处理备注</h4>
            <p>{{ order?.handlerRemark }}</p>
          </div>

          <div class="detail-section" v-if="order?.rejectReason">
            <h4 style="color: #f56c6c;">驳回原因</h4>
            <p>{{ order?.rejectReason }}</p>
          </div>
        </el-card>

        <el-card shadow="never" class="mb-20">
          <template #header>
            <div class="flex-between">
              <span>处理照片</span>
              <el-upload
                :action="uploadUrl"
                :headers="uploadHeaders"
                :data="{ bizType: 'WORK_ORDER', bizId: orderId }"
                :show-file-list="false"
                :on-success="handleUploadSuccess"
                accept="image/*"
              >
                <el-button type="primary" size="small" v-if="canUpload">
                  <el-icon><Upload /></el-icon>
                  上传照片
                </el-button>
              </el-upload>
            </div>
          </template>

          <el-empty v-if="attachments.length === 0" description="暂无照片" />
          <el-row :gutter="12" v-else>
            <el-col :span="6" v-for="item in attachments" :key="item.id">
              <div class="photo-item">
                <el-image :src="item.fileUrl" fit="cover" style="width: 100%; height: 120px; border-radius: 4px;" :preview-src-list="[item.fileUrl]" />
                <p class="photo-name">{{ item.originalName }}</p>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <el-card shadow="never">
          <template #header>
            <span>状态流转记录</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in history"
              :key="item.id"
              :timestamp="item.createdAt"
              :type="getTimelineType(index)"
            >
              <h4>{{ item.remark }}</h4>
              <p>操作人：{{ item.operatorName }}</p>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="never" class="mb-20">
          <template #header>
            <span>操作</span>
          </template>
          <div class="action-buttons">
            <el-button v-if="canApprove" type="primary" style="width: 100%; margin-bottom: 10px;" @click="handleApprove">
              审核工单
            </el-button>
            <el-button v-if="canStart" type="warning" style="width: 100%; margin-bottom: 10px;" @click="handleStart">
              开始处理
            </el-button>
            <el-button v-if="canComplete" type="success" style="width: 100%; margin-bottom: 10px;" @click="handleComplete">
              完成处理
            </el-button>
            <el-button v-if="canClose" type="primary" style="width: 100%; margin-bottom: 10px;" @click="handleClose">
              验收关闭工单
            </el-button>
            <el-alert v-if="canClose && !hasPhoto" title="关闭工单前必须上传处理照片" type="warning" :closable="false" style="margin-top: 10px;" />
          </div>
        </el-card>

        <el-card shadow="never" v-if="canEvaluate">
          <template #header>
            <span>满意度评价</span>
          </template>
          <div class="evaluate-section">
            <p>总体评分</p>
            <el-rate v-model="evaluateForm.overallScore" />
            <p>响应速度</p>
            <el-rate v-model="evaluateForm.responseSpeedScore" />
            <p>服务态度</p>
            <el-rate v-model="evaluateForm.serviceAttitudeScore" />
            <p>维修质量</p>
            <el-rate v-model="evaluateForm.qualityScore" />
            <el-input v-model="evaluateForm.content" type="textarea" :rows="3" placeholder="请输入评价内容" style="margin: 10px 0;" />
            <el-button type="primary" @click="submitEvaluate">提交评价</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getOrderDetail, getOrderHistory, approveOrder, startProcess, completeOrder, closeOrder } from '@/api/order'
import { getAttachments } from '@/api/file'
import { submitSatisfaction } from '@/api/satisfaction'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const orderId = route.params.id
const order = ref(null)
const history = ref([])
const attachments = ref([])
const loading = ref(false)
const hasPhoto = ref(false)

const userRole = computed(() => userStore.userInfo?.role)
const userId = computed(() => userStore.userInfo?.userId)

const canUpload = computed(() => {
  if (!order.value) return false
  return ['PROCESSING', 'COMPLETED'].includes(order.value.status)
})

const canApprove = computed(() => {
  return order.value?.status === 'PENDING' && ['ADMIN', 'PROPERTY'].includes(userRole.value)
})

const canStart = computed(() => {
  return order.value?.status === 'APPROVED' && order.value?.assigneeId === userId.value
})

const canComplete = computed(() => {
  return order.value?.status === 'PROCESSING' && order.value?.assigneeId === userId.value
})

const canClose = computed(() => {
  return order.value?.status === 'COMPLETED'
})

const canEvaluate = computed(() => {
  return order.value?.status === 'COMPLETED' && userRole.value === 'OWNER'
})

const evaluateForm = reactive({
  overallScore: 5,
  responseSpeedScore: 5,
  serviceAttitudeScore: 5,
  qualityScore: 5,
  content: ''
})

const uploadUrl = '/api/files/upload'
const uploadHeaders = computed(() => ({
  Authorization: 'Bearer ' + userStore.token
}))

function getPriorityClass(priority) {
  const map = { URGENT: 'urgent-tag', HIGH: 'high-tag', NORMAL: 'normal-tag', LOW: 'low-tag' }
  return map[priority] || 'normal-tag'
}

function getPriorityText(priority) {
  const map = { URGENT: '紧急', HIGH: '高', NORMAL: '普通', LOW: '低' }
  return map[priority] || priority
}

function getStatusType(status) {
  const map = {
    PENDING: 'warning', APPROVED: 'primary', PROCESSING: 'info',
    COMPLETED: 'success', CLOSED: '', REJECTED: 'danger'
  }
  return map[status] || ''
}

function getStatusText(status) {
  const map = {
    PENDING: '待审核', APPROVED: '已派单', PROCESSING: '处理中',
    COMPLETED: '待验收', CLOSED: '已关闭', REJECTED: '已驳回'
  }
  return map[status] || status
}

function getTimelineType(index) {
  const types = ['primary', 'success', 'warning', 'info', 'danger']
  return types[index % types.length]
}

function handleUploadSuccess() {
  ElMessage.success('上传成功')
  loadAttachments()
}

async function loadData() {
  loading.value = true
  try {
    const [orderRes, historyRes, attachRes] = await Promise.all([
      getOrderDetail(orderId),
      getOrderHistory(orderId),
      getAttachments('WORK_ORDER', orderId)
    ])
    order.value = orderRes.data
    history.value = historyRes.data
    attachments.value = attachRes.data
    hasPhoto.value = attachments.value.some(a => a.fileType === 'image')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadAttachments() {
  try {
    const res = await getAttachments('WORK_ORDER', orderId)
    attachments.value = res.data
    hasPhoto.value = attachments.value.some(a => a.fileType === 'image')
  } catch (e) {
    console.error(e)
  }
}

function handleApprove() {
  ElMessageBox.confirm('确定审核通过并派单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      await approveOrder(orderId, true, '', 3)
      ElMessage.success('审核通过，已派单')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

async function handleStart() {
  try {
    await startProcess(orderId)
    ElMessage.success('已开始处理')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

function handleComplete() {
  ElMessageBox.prompt('请输入处理备注', '完成工单', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入处理结果说明'
  }).then(async ({ value }) => {
    try {
      await completeOrder(orderId, value, null)
      ElMessage.success('工单已完成')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

async function handleClose() {
  if (!hasPhoto.value) {
    ElMessage.warning('请先上传处理照片后再关闭工单')
    return
  }
  try {
    await closeOrder(orderId)
    ElMessage.success('工单已关闭')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

async function submitEvaluate() {
  if (!evaluateForm.overallScore) {
    ElMessage.warning('请至少给出总体评分')
    return
  }
  try {
    await submitSatisfaction(orderId, evaluateForm.overallScore,
      evaluateForm.responseSpeedScore, evaluateForm.serviceAttitudeScore,
      evaluateForm.qualityScore, evaluateForm.content, 1)
    ElMessage.success('评价提交成功')
    loadData()
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.detail-section {
  margin-bottom: 15px;
}

.detail-section h4 {
  margin-bottom: 8px;
  color: #303133;
}

.detail-section p {
  color: #606266;
  line-height: 1.6;
}

.photo-item {
  text-align: center;
}

.photo-name {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}

.evaluate-section p {
  margin: 10px 0 5px;
  color: #606266;
}
</style>
