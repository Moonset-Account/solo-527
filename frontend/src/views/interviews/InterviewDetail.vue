<template>
  <div class="interview-detail">
    <div class="page-header">
      <h2 class="page-title">面试详情</h2>
      <el-button @click="$router.back()">返回</el-button>
    </div>

    <div v-loading="loading" class="detail-content">
      <el-descriptions :column="3" border class="mb-20" title="基本信息">
        <el-descriptions-item label="候选人">{{ interview?.candidateName }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ interview?.candidatePhone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ interview?.candidateEmail || '-' }}</el-descriptions-item>
        <el-descriptions-item label="应聘职位">{{ interview?.position }}</el-descriptions-item>
        <el-descriptions-item label="级别">{{ interview?.level || '-' }}</el-descriptions-item>
        <el-descriptions-item label="面试官">{{ interview?.interviewerId?.name }}</el-descriptions-item>
        <el-descriptions-item label="面试日期">{{ interview?.interviewDate }}</el-descriptions-item>
        <el-descriptions-item label="时间">{{ interview?.startTime }} - {{ interview?.endTime }}</el-descriptions-item>
        <el-descriptions-item label="地点">{{ interview?.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(interview?.status)">{{ interview?.status ? InterviewStatusLabel[interview.status as keyof typeof InterviewStatusLabel] : '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="录用结果">
          <el-tag :type="getHireResultType(interview?.hireResult)">{{ interview?.hireResult ? HireResultLabel[interview.hireResult as keyof typeof HireResultLabel] : '-' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="面试形式">{{ interview?.channel || '-' }}</el-descriptions-item>
        <el-descriptions-item label="签到时间">{{ interview?.checkInTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ interview?.startInterviewTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ interview?.endInterviewTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="技能标签" :span="3">
          <el-tag v-for="skill in interview?.skills" :key="skill" style="margin-right: 8px">{{ skill }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="3">{{ interview?.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-card class="mb-20" shadow="never">
        <template #header>
          <div class="card-header">
            <span>操作记录</span>
          </div>
        </template>
        <div class="action-buttons">
          <el-button
            v-if="interview?.status === 'scheduled' || interview?.status === 'confirmed'"
            type="primary"
            @click="handleCheckIn"
          >
            <el-icon><Finished /></el-icon> 签到
          </el-button>
          <el-button
            v-if="interview?.status === 'checked_in'"
            type="success"
            @click="handleStart"
          >
            <el-icon><VideoPlay /></el-icon> 开始面试
          </el-button>
          <el-button
            v-if="interview?.status === 'in_progress'"
            type="warning"
            @click="handleComplete"
          >
            <el-icon><CircleCheck /></el-icon> 完成面试
          </el-button>
          <el-button
            v-if="interview?.status === 'completed' && interview?.hireResult === 'pending'"
            type="primary"
            @click="$router.push('/assessments/create/' + interview?._id)"
          >
            <el-icon><Star /></el-icon> 快速测评
          </el-button>
          <el-button
            v-if="interview?.status !== 'cancelled' && interview?.status !== 'completed'"
            type="danger"
            @click="handleCancel"
          >
            <el-icon><Close /></el-icon> 取消面试
          </el-button>
        </div>
      </el-card>

      <el-card shadow="never" v-if="assessment">
        <template #header>
          <div class="card-header">
            <span>测评结果</span>
          </div>
        </template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="综合评分">{{ assessment?.totalScore || '-' }}</el-descriptions-item>
          <el-descriptions-item label="技术能力">{{ assessment?.technicalScore || '-' }}</el-descriptions-item>
          <el-descriptions-item label="沟通能力">{{ assessment?.communicationScore || '-' }}</el-descriptions-item>
          <el-descriptions-item label="问题解决">{{ assessment?.problemSolvingScore || '-' }}</el-descriptions-item>
          <el-descriptions-item label="录用建议" :span="2">
            <el-tag :type="getHireResultType(assessment?.recommendation)">{{ assessment?.recommendation ? HireResultLabel[assessment.recommendation as keyof typeof HireResultLabel] : '-' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="建议级别">{{ assessment?.suggestedLevel || '-' }}</el-descriptions-item>
          <el-descriptions-item label="建议薪资">{{ assessment?.suggestedSalary || '-' }}</el-descriptions-item>
          <el-descriptions-item label="测评人">{{ assessment?.interviewerId?.name }}</el-descriptions-item>
          <el-descriptions-item label="测评时间">{{ assessment?.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="优势" :span="3">{{ assessment?.strengths || '-' }}</el-descriptions-item>
          <el-descriptions-item label="不足" :span="3">{{ assessment?.weaknesses || '-' }}</el-descriptions-item>
          <el-descriptions-item label="综合评价" :span="3">{{ assessment?.overallComment || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Finished, VideoPlay, CircleCheck, Star, Close } from '@element-plus/icons-vue';
import * as interviewsApi from '../../api/interviews';
import * as assessmentsApi from '../../api/assessments';
import { InterviewStatusLabel, HireResultLabel, InterviewStatus, type Interview, type Assessment } from '../../types';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const interview = ref<Interview | null>(null);
const assessment = ref<Assessment | null>(null);

function getStatusType(status?: string) {
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
  return map[status || ''] || 'info';
}

function getHireResultType(result?: string) {
  const map: Record<string, string> = {
    pending: 'info',
    pass: 'success',
    fail: 'danger',
    hold: 'warning',
  };
  return map[result || ''] || 'info';
}

async function fetchDetail() {
  loading.value = true;
  try {
    const id = route.params.id as string;
    interview.value = await interviewsApi.getInterview(id);
    try {
      const assessments = await assessmentsApi.getAssessments({ interviewId: id });
      if (assessments.data.length > 0) {
        assessment.value = assessments.data[0];
      }
    } catch (e) {
      console.error('Failed to fetch assessment:', e);
    }
  } finally {
    loading.value = false;
  }
}

async function handleCheckIn() {
  if (!interview.value) return;
  try {
    await interviewsApi.checkIn(interview.value._id);
    ElMessage.success('签到成功');
    await fetchDetail();
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '签到失败');
  }
}

async function handleStart() {
  if (!interview.value) return;
  try {
    await interviewsApi.updateStatus(interview.value._id, { status: InterviewStatus.IN_PROGRESS });
    ElMessage.success('面试已开始');
    await fetchDetail();
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败');
  }
}

async function handleComplete() {
  if (!interview.value) return;
  try {
    await interviewsApi.updateStatus(interview.value._id, { status: InterviewStatus.COMPLETED });
    ElMessage.success('面试已完成');
    await fetchDetail();
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败');
  }
}

async function handleCancel() {
  if (!interview.value) return;
  ElMessageBox.prompt('请输入取消原因', '取消面试', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入取消原因',
    type: 'warning',
  }).then(async ({ value }) => {
    try {
      await interviewsApi.cancel(interview.value!._id, value);
      ElMessage.success('已取消面试');
      await fetchDetail();
    } catch (e: any) {
      ElMessage.error(e.response?.data?.message || '操作失败');
    }
  }).catch(() => {});
}

onMounted(() => {
  fetchDetail();
});
</script>

<style scoped>
.interview-detail {
  padding: 0;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.detail-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.mb-20 {
  margin-bottom: 20px;
}
</style>
