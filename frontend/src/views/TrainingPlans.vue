<template>
  <div class="page-container">
    <div class="page-header">
      <h3>训练计划</h3>
      <el-button
        v-if="userStore.isCoach"
        type="primary"
        @click="showCreateDialog = true"
      >
        <el-icon><Plus /></el-icon>
        发布计划
      </el-button>
    </div>

    <el-card v-for="plan in plans" :key="plan.id" class="plan-card" shadow="hover">
      <div class="plan-header">
        <div>
          <h4>{{ plan.title }}</h4>
          <div class="plan-meta">
            <el-tag size="small" :type="plan.is_published ? 'success' : 'info'">
              {{ plan.is_published ? '已发布' : '草稿' }}
            </el-tag>
            <span class="plan-date">
              <el-icon><Calendar /></el-icon>
              {{ formatDate(plan.plan_date) }}
            </span>
            <span v-if="plan.distance_km">
              <el-icon><Position /></el-icon>
              {{ plan.distance_km }} 公里
            </span>
            <span v-if="plan.target_pace">
              <el-icon><Timer /></el-icon>
              目标配速 {{ plan.target_pace }}
            </span>
          </div>
        </div>
        <div class="plan-actions" v-if="userStore.isCoach">
          <el-button size="small" type="primary" @click="publishPlan(plan)" v-if="!plan.is_published">
            发布
          </el-button>
        </div>
      </div>
      <p class="plan-desc">{{ plan.description }}</p>
      <div class="plan-detail" v-if="plan.warm_up || plan.main_set || plan.cool_down">
        <div v-if="plan.warm_up" class="plan-section">
          <span class="section-title">热身：</span>{{ plan.warm_up }}
        </div>
        <div v-if="plan.main_set" class="plan-section">
          <span class="section-title">主课：</span>{{ plan.main_set }}
        </div>
        <div v-if="plan.cool_down" class="plan-section">
          <span class="section-title">放松：</span>{{ plan.cool_down }}
        </div>
      </div>
    </el-card>

    <el-dialog v-model="showCreateDialog" title="创建训练计划" width="600px">
      <el-form :model="planForm" label-width="100px">
        <el-form-item label="标题" required>
          <el-input v-model="planForm.title" placeholder="请输入训练计划标题" />
        </el-form-item>
        <el-form-item label="训练日期" required>
          <el-date-picker
            v-model="planForm.plan_date"
            type="datetime"
            placeholder="选择训练日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="planForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="距离(km)">
          <el-input-number v-model="planForm.distance_km" :min="0" :step="0.5" />
        </el-form-item>
        <el-form-item label="目标配速">
          <el-input v-model="planForm.target_pace" placeholder="如：5:30" />
        </el-form-item>
        <el-form-item label="热身">
          <el-input v-model="planForm.warm_up" />
        </el-form-item>
        <el-form-item label="主课">
          <el-input v-model="planForm.main_set" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="放松">
          <el-input v-model="planForm.cool_down" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createPlan" :loading="creating">创建</el-button>
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
const plans = ref([])
const showCreateDialog = ref(false)
const creating = ref(false)

const planForm = reactive({
  title: '',
  description: '',
  plan_date: '',
  distance_km: 0,
  target_pace: '',
  warm_up: '',
  main_set: '',
  cool_down: ''
})

const loadPlans = async () => {
  try {
    const data = await request.get('/training-plans/')
    plans.value = data
  } catch (error) {
    console.error(error)
  }
}

const createPlan = async () => {
  if (!planForm.title || !planForm.plan_date) {
    ElMessage.warning('请填写标题和训练日期')
    return
  }
  creating.value = true
  try {
    await request.post('/training-plans/', planForm)
    ElMessage.success('训练计划创建成功')
    showCreateDialog.value = false
    loadPlans()
  } catch (error) {
    console.error(error)
  } finally {
    creating.value = false
  }
}

const publishPlan = async (plan) => {
  try {
    await request.post(`/training-plans/${plan.id}/publish`)
    ElMessage.success('发布成功')
    loadPlans()
  } catch (error) {
    console.error(error)
  }
}

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  loadPlans()
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

.plan-card {
  margin-bottom: 16px;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.plan-header h4 {
  margin: 0 0 10px;
  font-size: 16px;
  color: #303133;
}

.plan-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
  align-items: center;
  flex-wrap: wrap;
}

.plan-meta .el-icon {
  margin-right: 4px;
  vertical-align: middle;
}

.plan-desc {
  color: #606266;
  margin: 12px 0;
  line-height: 1.6;
}

.plan-detail {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
}

.plan-section {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
}

.section-title {
  color: #409EFF;
  font-weight: 500;
}
</style>
