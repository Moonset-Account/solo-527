<template>
  <div class="page-container">
    <div class="page-header">
      <h3>活动报名</h3>
      <el-button
        v-if="userStore.isCoach"
        type="primary"
        @click="showCreateDialog = true"
      >
        <el-icon><Plus /></el-icon>
        发布活动
      </el-button>
    </div>

    <el-card v-for="activity in activities" :key="activity.id" class="activity-card" shadow="hover">
      <div class="activity-header">
        <div>
          <h4>{{ activity.title }}</h4>
          <div class="activity-meta">
            <el-tag size="small" :type="activity.is_published ? 'success' : 'info'">
              {{ activity.is_published ? '报名中' : '未发布' }}
            </el-tag>
            <span><el-icon><Calendar /></el-icon> {{ formatDate(activity.activity_date) }}</span>
            <span v-if="activity.meeting_point"><el-icon><Location /></el-icon> {{ activity.meeting_point }}</span>
            <span v-if="activity.max_participants">
              <el-icon><User /></el-icon> 上限 {{ activity.max_participants }} 人
            </span>
          </div>
        </div>
        <div class="activity-actions">
          <el-button
            v-if="userStore.isCoach && !activity.is_published"
            size="small"
            type="primary"
            @click="publishActivity(activity)"
          >
            发布
          </el-button>
          <el-button
            v-if="activity.is_published"
            size="small"
            type="success"
            @click="showSignupDialog = true; currentActivity = activity"
          >
            立即报名
          </el-button>
        </div>
      </div>
      <p class="activity-desc">{{ activity.description }}</p>
      <div class="activity-footer" v-if="activity.registration_deadline">
        报名截止：{{ formatDate(activity.registration_deadline) }}
      </div>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="发布活动" width="550px">
      <el-form :model="activityForm" label-width="100px">
        <el-form-item label="活动标题" required>
          <el-input v-model="activityForm.title" />
        </el-form-item>
        <el-form-item label="活动时间" required>
          <el-date-picker
            v-model="activityForm.activity_date"
            type="datetime"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="集合地点">
          <el-input v-model="activityForm.meeting_point" />
        </el-form-item>
        <el-form-item label="活动描述">
          <el-input v-model="activityForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="人数上限">
          <el-input-number v-model="activityForm.max_participants" :min="1" />
        </el-form-item>
        <el-form-item label="报名截止">
          <el-date-picker
            v-model="activityForm.registration_deadline"
            type="datetime"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createActivity" :loading="creating">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showSignupDialog" title="活动报名" width="450px">
      <template v-if="currentActivity">
        <p style="margin-bottom: 16px; color: #606266">
          您正在报名参加：<strong>{{ currentActivity.title }}</strong>
        </p>
        <el-form :model="signupForm" label-width="100px">
          <el-form-item label="紧急联系人">
            <el-input v-model="signupForm.emergency_contact" />
          </el-form-item>
          <el-form-item label="紧急联系电话">
            <el-input v-model="signupForm.emergency_phone" />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="showSignupDialog = false">取消</el-button>
        <el-button type="primary" @click="submitSignup" :loading="signingUp">确认报名</el-button>
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
const activities = ref([])
const showCreateDialog = ref(false)
const showSignupDialog = ref(false)
const currentActivity = ref(null)
const creating = ref(false)
const signingUp = ref(false)

const activityForm = reactive({
  title: '',
  activity_date: '',
  meeting_point: '',
  description: '',
  max_participants: null,
  registration_deadline: ''
})

const signupForm = reactive({
  emergency_contact: '',
  emergency_phone: ''
})

const loadActivities = async () => {
  try {
    const data = await request.get('/activities/')
    activities.value = data
  } catch (error) {
    console.error(error)
  }
}

const createActivity = async () => {
  if (!activityForm.title || !activityForm.activity_date) {
    ElMessage.warning('请填写活动标题和时间')
    return
  }
  creating.value = true
  try {
    await request.post('/activities/', activityForm)
    ElMessage.success('活动创建成功')
    showCreateDialog.value = false
    loadActivities()
  } catch (error) {
    console.error(error)
  } finally {
    creating.value = false
  }
}

const publishActivity = async (activity) => {
  try {
    await request.post(`/activities/${activity.id}/publish`)
    ElMessage.success('活动已发布')
    loadActivities()
  } catch (error) {
    console.error(error)
  }
}

const submitSignup = async () => {
  if (!currentActivity.value) return
  signingUp.value = true
  try {
    await request.post(`/activities/${currentActivity.value.id}/signup`, {
      activity_id: currentActivity.value.id,
      ...signupForm
    })
    ElMessage.success('报名成功，等待确认')
    showSignupDialog.value = false
  } catch (error) {
    console.error(error)
  } finally {
    signingUp.value = false
  }
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  loadActivities()
})
</script>

<style scoped>
.page-container {
  max-width: 900px;
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

.activity-card {
  margin-bottom: 16px;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.activity-header h4 {
  margin: 0 0 10px;
  font-size: 16px;
  color: #303133;
}

.activity-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
  align-items: center;
  flex-wrap: wrap;
}

.activity-meta .el-icon {
  margin-right: 4px;
  vertical-align: middle;
}

.activity-desc {
  color: #606266;
  margin: 12px 0;
  line-height: 1.6;
}

.activity-footer {
  font-size: 13px;
  color: #e6a23c;
  padding-top: 10px;
  border-top: 1px dashed #ebeef5;
}
</style>
