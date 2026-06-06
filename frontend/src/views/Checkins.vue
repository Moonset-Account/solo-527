<template>
  <div class="page-container">
    <div class="page-header">
      <h3>打卡记录</h3>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        上传打卡
      </el-button>
    </div>

    <el-table :data="checkins" v-loading="loading">
      <el-table-column prop="distance_km" label="距离(km)" width="100">
        <template #default="{ row }">
          <strong>{{ row.distance_km }}</strong>
        </template>
      </el-table-column>
      <el-table-column prop="avg_pace" label="配速" width="100" />
      <el-table-column prop="avg_heart_rate" label="心率" width="80" />
      <el-table-column prop="perceived_effort" label="RPE" width="80">
        <template #default="{ row }">
          <el-tag v-if="row.perceived_effort" size="small" :type="getRpeType(row.perceived_effort)">
            {{ row.perceived_effort }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="location_alias" label="地点" width="120" />
      <el-table-column prop="status" label="状态" width="110">
        <template #default="{ row }">
          <el-tag size="small" :type="getStatusType(row.status)">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="checkin_date" label="时间">
        <template #default="{ row }">
          {{ formatDate(row.checkin_date) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button
            v-if="userStore.isCoach && row.status !== 'archived'"
            size="small"
            type="primary"
            link
            @click="reviewCheckin(row)"
          >
            审核
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showCreateDialog" title="上传打卡" width="500px">
      <el-form :model="checkinForm" label-width="100px">
        <el-form-item label="距离(km)" required>
          <el-input-number v-model="checkinForm.distance_km" :min="0.1" :step="0.1" :precision="1" />
        </el-form-item>
        <el-form-item label="平均配速">
          <el-input v-model="checkinForm.avg_pace" placeholder="如：5:30" />
        </el-form-item>
        <el-form-item label="平均心率">
          <el-input-number v-model="checkinForm.avg_heart_rate" :min="0" :max="220" />
        </el-form-item>
        <el-form-item label="主观强度(RPE)">
          <el-slider v-model="checkinForm.perceived_effort" :min="1" :max="10" show-input />
        </el-form-item>
        <el-form-item label="地点别名">
          <el-input v-model="checkinForm.location_alias" placeholder="如：朝阳公园" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="checkinForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCheckin" :loading="submitting">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReviewDialog" title="审核打卡" width="400px">
      <template v-if="currentCheckin">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="距离">{{ currentCheckin.distance_km }} km</el-descriptions-item>
          <el-descriptions-item label="配速">{{ currentCheckin.avg_pace || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentCheckin.notes || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-form style="margin-top: 20px" label-width="100px">
          <el-form-item label="状态">
            <el-select v-model="reviewStatus" style="width: 100%">
              <el-option label="执行中" value="in_progress" />
              <el-option label="异常复核" value="exception_review" />
              <el-option label="已归档" value="archived" />
            </el-select>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="showReviewDialog = false">取消</el-button>
        <el-button type="primary" @click="updateCheckinStatus" :loading="updating">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const userStore = useUserStore()
const checkins = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showReviewDialog = ref(false)
const currentCheckin = ref(null)
const submitting = ref(false)
const updating = ref(false)
const reviewStatus = ref('')

const checkinForm = reactive({
  distance_km: 5,
  avg_pace: '',
  avg_heart_rate: null,
  perceived_effort: 5,
  location_alias: '',
  notes: ''
})

const loadCheckins = async () => {
  loading.value = true
  try {
    const data = await request.get('/checkins/')
    checkins.value = data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const submitCheckin = async () => {
  if (!checkinForm.distance_km) {
    ElMessage.warning('请输入跑步距离')
    return
  }
  submitting.value = true
  try {
    await request.post('/checkins/', checkinForm)
    ElMessage.success('打卡提交成功，等待教练审核')
    showCreateDialog.value = false
    loadCheckins()
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

const reviewCheckin = (row) => {
  currentCheckin.value = row
  reviewStatus.value = row.status
  showReviewDialog.value = true
}

const updateCheckinStatus = async () => {
  if (!currentCheckin.value) return
  updating.value = true
  try {
    await request.patch(`/checkins/${currentCheckin.value.id}`, {
      status: reviewStatus.value
    })
    ElMessage.success('状态更新成功')
    showReviewDialog.value = false
    loadCheckins()
  } catch (error) {
    console.error(error)
  } finally {
    updating.value = false
  }
}

const getStatusText = (status) => {
  const map = {
    new: '新建',
    pending_confirm: '待确认',
    in_progress: '执行中',
    exception_review: '异常复核',
    archived: '已归档'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    new: 'info',
    pending_confirm: 'warning',
    in_progress: 'primary',
    exception_review: 'danger',
    archived: 'success'
  }
  return map[status] || 'info'
}

const getRpeType = (rpe) => {
  if (rpe <= 4) return 'success'
  if (rpe <= 7) return 'warning'
  return 'danger'
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  loadCheckins()
})
</script>

<style scoped>
.page-container {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h3 {
  margin: 0;
  color: #303133;
}
</style>
