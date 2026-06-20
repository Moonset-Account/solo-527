<template>
  <div class="activity-detail" v-loading="activityStore.loading">
    <el-page-header @back="router.push('/')" title="返回列表" content="活动详情" />

    <el-card shadow="never" class="detail-card" v-if="activityStore.current">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="活动名称" :span="2">
          {{ activityStore.current.title }}
        </el-descriptions-item>
        <el-descriptions-item label="组织者">{{ activityStore.current.organizer }}</el-descriptions-item>
        <el-descriptions-item label="地点">{{ activityStore.current.location }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ formatDate(activityStore.current.startTime) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ formatDate(activityStore.current.endTime) }}</el-descriptions-item>
        <el-descriptions-item label="参与人数">
          {{ activityStore.current.currentParticipants }} / {{ activityStore.current.maxParticipants }}
        </el-descriptions-item>
        <el-descriptions-item label="活动费用">¥{{ activityStore.current.fee }}</el-descriptions-item>
        <el-descriptions-item label="活动状态">
          <el-tag :type="statusTagType(activityStore.current.status)">
            {{ statusLabel(activityStore.current.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="交易保障">
          <el-tag :type="activityStore.current.guaranteeEnabled ? 'success' : 'info'">
            {{ activityStore.current.guaranteeEnabled ? '已开启' : '未开启' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="报名状态">
          <el-tag :type="activityStore.current.isRegistered ? 'success' : 'info'" size="large">
            {{ activityStore.current.isRegistered ? '已报名' : '未报名' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="活动描述" :span="2">
          {{ activityStore.current.description }}
        </el-descriptions-item>
      </el-descriptions>

      <div class="action-bar">
        <el-button
          v-if="!activityStore.current.isRegistered && activityStore.current.status === 'open'"
          type="primary"
          size="large"
          @click="handleRegister"
        >
          立即报名
        </el-button>
        <el-button
          v-if="activityStore.current.isRegistered"
          type="warning"
          size="large"
          @click="handleCancel"
        >
          取消报名
        </el-button>
        <el-button
          type="danger"
          size="large"
          plain
          @click="handleReport"
        >
          举报活动
        </el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="participants-card" v-if="activityStore.current">
      <template #header>
        <span>参与人员列表</span>
      </template>
      <el-table :data="participants" stripe style="width: 100%">
        <el-table-column prop="userName" label="姓名" />
        <el-table-column prop="registeredAt" label="报名时间">
          <template #default="{ row }">
            {{ formatDate(row.registeredAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '有效' : '已取消' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="reportDialogVisible" title="举报活动" width="500">
      <el-form :model="reportForm" label-width="80px">
        <el-form-item label="举报原因">
          <el-input v-model="reportForm.reason" placeholder="请输入举报原因" />
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input v-model="reportForm.description" type="textarea" :rows="4" placeholder="请详细描述举报内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReport">提交举报</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useActivityStore } from '../stores/activity'
import { useReportStore } from '../stores/report'

const route = useRoute()
const router = useRouter()
const activityStore = useActivityStore()
const reportStore = useReportStore()

const participants = ref<any[]>([])
const reportDialogVisible = ref(false)
const reportForm = reactive({
  reason: '',
  description: ''
})

const statusMap: Record<string, string> = {
  draft: '草稿',
  open: '报名中',
  ongoing: '进行中',
  closed: '已结束',
  cancelled: '已取消'
}

const statusTagTypeMap: Record<string, 'info' | 'success' | 'warning' | 'danger' | ''> = {
  draft: 'info',
  open: 'success',
  ongoing: 'warning',
  closed: '',
  cancelled: 'danger'
}

const statusLabel = (status: string) => statusMap[status] || status
const statusTagType = (status: string) => statusTagTypeMap[status] || ''

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}

const handleRegister = async () => {
  try {
    await ElMessageBox.confirm('确认报名该活动？', '提示', { type: 'info' })
    await activityStore.register(route.params.id as string)
    ElMessage.success('报名成功')
    activityStore.fetchDetail(route.params.id as string)
  } catch {}
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('确认取消报名？', '提示', { type: 'warning' })
    await activityStore.cancelRegister(route.params.id as string)
    ElMessage.success('已取消报名')
    activityStore.fetchDetail(route.params.id as string)
  } catch {}
}

const handleReport = () => {
  reportForm.reason = ''
  reportForm.description = ''
  reportDialogVisible.value = true
}

const submitReport = async () => {
  if (!reportForm.reason) {
    ElMessage.warning('请输入举报原因')
    return
  }
  try {
    await reportStore.create({
      activityId: route.params.id as string,
      activityTitle: activityStore.current?.title || '',
      reason: reportForm.reason,
      description: reportForm.description
    })
    ElMessage.success('举报已提交')
    reportDialogVisible.value = false
  } catch {}
}

onMounted(() => {
  const id = route.params.id as string
  if (id) {
    activityStore.fetchDetail(id)
  }
})
</script>

<style scoped>
.activity-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-card {
  margin-top: 8px;
}

.action-bar {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}
</style>
