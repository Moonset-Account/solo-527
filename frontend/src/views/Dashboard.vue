<template>
  <div class="dashboard">
    <div class="page-header">
      <h2>工作台</h2>
      <p>欢迎回来，{{ userStore.user?.name }}</p>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card primary" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="32"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayInterviews }}</div>
              <div class="stat-label">今日面试</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card success" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="32"><Finished /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.checkedInCount }}</div>
              <div class="stat-label">已签到</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card warning" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="32"><Star /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingAssessments }}</div>
              <div class="stat-label">待测评</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card danger" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon :size="32"><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ reminderStore.unreadCount }}</div>
              <div class="stat-label">未读提醒</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :lg="16" :md="24">
        <el-card class="quick-actions" shadow="hover">
          <template #header>
            <div class="card-header">
            <span>快捷操作</span>
          </div>
          </template>
          <div class="action-buttons">
            <el-button type="primary" size="large" @click="$router.push('/interviews/create')">
              <el-icon><Plus /></el-icon>
              <span>预约面试</span>
            </el-button>
            <el-button type="success" size="large" @click="$router.push('/question-bank')">
              <el-icon><Reading /></el-icon>
              <span>题库查询</span>
            </el-button>
            <el-button v-if="userStore.hasRole(['admin', 'hr'])" type="warning" size="large" @click="$router.push('/schedules')">
              <el-icon><Clock /></el-icon>
              <span>档期管理</span>
            </el-button>
            <el-button v-if="userStore.hasRole(['admin', 'hr'])" type="info" size="large" @click="$router.push('/exports')">
              <el-icon><Download /></el-icon>
              <span>数据导出</span>
            </el-button>
          </div>
        </el-card>

        <el-card class="today-schedule" shadow="hover">
          <template #header>
            <div class="card-header">
            <span>今日面试日程</span>
            <el-button type="text" @click="refreshSchedule">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
          </template>
          <el-table :data="todayInterviews" v-loading="loading" style="width: 100%">
            <el-table-column prop="candidateName" label="候选人" width="120" />
            <el-table-column prop="position" label="应聘职位" width="140" />
            <el-table-column label="时间" width="180">
              <template #default="{ row }">
                {{ row.startTime }} - {{ row.endTime }}
              </template>
            </el-table-column>
            <el-table-column prop="interviewerId.name" label="面试官" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ InterviewStatusLabel[row.status as keyof typeof InterviewStatusLabel] }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === 'scheduled' || row.status === 'confirmed'" type="primary" size="small" @click="handleCheckIn(row._id)">签到</el-button>
                <el-button v-if="row.status === 'checked_in'" type="success" size="small" @click="handleStartInterview(row._id)">开始面试</el-button>
                <el-button v-if="row.status === 'in_progress'" type="warning" size="small" @click="handleComplete(row._id)">完成</el-button>
                <el-button v-if="row.status === 'completed' && row.hireResult !== 'pending'" type="primary" size="small" @click="$router.push('/assessments/create/' + row._id)">测评</el-button>
                <el-button type="info" size="small" @click="$router.push('/interviews/' + row._id)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="todayInterviews.length === 0 && !loading" description="今日暂无面试安排" />
        </el-card>
      </el-col>

      <el-col :lg="8" :md="24">
        <el-card class="reminders-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最新提醒</span>
              <el-badge :value="reminderStore.unreadCount" class="item" />
            </div>
          </template>
          <div class="reminder-list">
            <div v-for="item in recentReminders" :key="item._id" class="reminder-item" :class="{ unread: !item.isRead }">
              <el-tag :type="getReminderType(item.type)" size="small" effect="dark">{{ ReminderTypeLabel[item.type as keyof typeof ReminderTypeLabel] }}</el-tag>
              <div class="reminder-content">
                <div class="reminder-title">{{ item.title }}</div>
                <div class="reminder-desc">{{ item.content }}</div>
              </div>
            </div>
          </div>
          <el-empty v-if="recentReminders.length === 0" description="暂无提醒" />
        </el-card>

        <el-card v-if="userStore.hasRole(['admin', 'hr'])" class="blocking-alerts" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>阻断告警</span>
              <el-tag type="danger" size="small">{{ reminderStore.blockingCount }} 条</el-tag>
            </div>
          </template>
          <div class="blocking-list">
            <div v-for="item in reminderStore.blockingReminders.slice(0, 5)" :key="item._id" class="blocking-item">
              <el-icon color="#f56c6c"><WarningFilled /></el-icon>
              <div class="blocking-content">
                <div class="blocking-title">{{ item.title }}</div>
                <div class="blocking-desc">{{ item.content }}</div>
              </div>
            </div>
          </div>
          <el-empty v-if="reminderStore.blockingReminders.length === 0" description="暂无阻断告警" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  Calendar, Finished, Star, Bell, Plus, Reading, Clock, Download,
  Refresh, WarningFilled
} from '@element-plus/icons-vue';
import { useUserStore } from '../stores/user';
import { useInterviewStore } from '../stores/interview';
import { useReminderStore } from '../stores/reminder';
import { InterviewStatusLabel, ReminderTypeLabel, InterviewStatus, type Interview } from '../types';

const router = useRouter();
const userStore = useUserStore();
const interviewStore = useInterviewStore();
const reminderStore = useReminderStore();

const loading = ref(false);
const stats = reactive({
  todayInterviews: 0,
  checkedInCount: 0,
  pendingAssessments: 0,
});

const todayInterviews = ref<Interview[]>([]);

const recentReminders = computed(() => reminderStore.reminders.slice(0, 8));

function getStatusType(status: string) {
  const map: Record<string, string> = {
    pending: 'info',
    scheduled: 'primary',
    confirmed: '',
    checked_in: 'success',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger',
    no_show: 'danger',
  };
  return map[status] || 'info';
}

function getReminderType(type: string) {
  const map: Record<string, string> = {
    info: 'info',
    warning: 'warning',
    blocking: 'danger',
  };
  return map[type] || 'info';
}

async function fetchTodayInterviews() {
  loading.value = true;
  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await interviewStore.fetchInterviews({
      startDate: today,
      endDate: today,
      pageSize: 50,
      sortBy: 'startTime',
    });
    todayInterviews.value = result.data;
    stats.todayInterviews = result.total;
    stats.checkedInCount = result.data.filter((i: Interview) => i.status === 'checked_in' || i.status === 'in_progress' || i.status === 'completed').length;
    stats.pendingAssessments = result.data.filter((i: Interview) => i.status === 'completed' && i.hireResult === 'pending').length;
  } finally {
    loading.value = false;
  }
}

async function refreshSchedule() {
  await fetchTodayInterviews();
  await reminderStore.fetchReminders();
  if (userStore.isAdmin || userStore.isHR) {
    await reminderStore.fetchBlockingReminders();
  }
  ElMessage.success('刷新成功');
}

async function handleCheckIn(id: string) {
  try {
    await interviewStore.checkIn(id);
    ElMessage.success('签到成功');
    await fetchTodayInterviews();
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '签到失败');
  }
}

async function handleStartInterview(id: string) {
  try {
    await interviewStore.updateStatus(id, InterviewStatus.IN_PROGRESS);
    ElMessage.success('面试已开始');
    await fetchTodayInterviews();
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败');
  }
}

async function handleComplete(id: string) {
  try {
    await interviewStore.updateStatus(id, InterviewStatus.COMPLETED);
    ElMessage.success('面试已完成');
    await fetchTodayInterviews();
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败');
  }
}

onMounted(() => {
  fetchTodayInterviews();
  reminderStore.fetchReminders();
  if (userStore.isAdmin || userStore.isHR) {
    reminderStore.fetchBlockingReminders();
  }
});
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  margin-bottom: 20px;
  border: none;
}

.stat-card.primary {
  border-left: 4px solid #409eff;
}

.stat-card.success {
  border-left: 4px solid #67c23a;
}

.stat-card.warning {
  border-left: 4px solid #e6a23c;
}

.stat-card.danger {
  border-left: 4px solid #f56c6c;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-card.primary .stat-icon {
  background: linear-gradient(135deg, #66b1ff, #409eff);
}

.stat-card.success .stat-icon {
  background: linear-gradient(135deg, #85ce61, #67c23a);
}

.stat-card.warning .stat-icon {
  background: linear-gradient(135deg, #ebb563, #e6a23c);
}

.stat-card.danger .stat-icon {
  background: linear-gradient(135deg, #f78989, #f56c6c);
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.quick-actions {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-buttons .el-button {
  height: 60px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.today-schedule {
  margin-bottom: 20px;
}

.reminders-card,
.blocking-alerts {
  margin-bottom: 20px;
}

.reminder-list {
  max-height: 300px;
  overflow-y: auto;
}

.reminder-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.reminder-item.unread {
  background: #ecf5ff;
  padding: 12px;
  border-radius: 4px;
  margin: 4px 0;
}

.reminder-content {
  flex: 1;
}

.reminder-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.reminder-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.blocking-list {
  max-height: 200px;
  overflow-y: auto;
}

.blocking-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  align-items: flex-start;
}

.blocking-content {
  flex: 1;
}

.blocking-title {
  font-size: 14px;
  font-weight: 500;
  color: #f56c6c;
}

.blocking-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.item {
  margin-left: 10px;
}
</style>
